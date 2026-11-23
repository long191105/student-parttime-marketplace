import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ExternalLink, Map, MapPin, MessageCircle, Mic, MicOff, Phone, PhoneOff, Search, Send, Video, VideoOff, X } from 'lucide-react'
import type { AuthUser, CallType, ChatConversation, ChatMessage, ChatSocketEvent, MarketplaceApi } from '../services/MarketplaceApi'

interface InboxPageProps {
  api: MarketplaceApi
  user: AuthUser
  initialConversationId: string | null
  isVisible: boolean
  onOpenListing: (listingId: string) => void
  onUnreadCountChange: (count: number) => void
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'
type UserPresence = { online: boolean; lastActiveAt: string | null }
type CallState =
  | { status: 'idle' }
  | { status: 'incoming' | 'contacting' | 'outgoing' | 'connecting' | 'connected' | 'failed'; conversationId: string; callType: CallType; peerName: string; isCaller: boolean; error?: string }
type ActiveCallState = Exclude<CallState, { status: 'idle' }>
type CallSignalEvent = Extract<ChatSocketEvent, { type: `call-${string}` }>

export function InboxPage({ api, user, initialConversationId, isVisible, onOpenListing, onUnreadCountChange }: InboxPageProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeId, setActiveId] = useState(initialConversationId ?? '')
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({})
  const [loadedConversations, setLoadedConversations] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState('')
  const [pinnedLocation, setPinnedLocation] = useState('')
  const [search, setSearch] = useState('')
  const [connection, setConnection] = useState<ConnectionState>('connecting')
  const [presenceByUser, setPresenceByUser] = useState<Record<string, UserPresence>>({})
  const [presenceClock, setPresenceClock] = useState(Date.now())
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isSharingLocation, setIsSharingLocation] = useState(false)
  const [isPinningLocation, setIsPinningLocation] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [error, setError] = useState('')
  const [callState, setCallState] = useState<CallState>({ status: 'idle' })
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const socketRef = useRef<WebSocket | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const activeIdRef = useRef(activeId)
  const isVisibleRef = useRef(isVisible)
  isVisibleRef.current = isVisible
  const connectionRef = useRef<ConnectionState>(connection)
  const conversationsRef = useRef(conversations)
  const callStateRef = useRef<CallState>(callState)
  const callSignalHandlerRef = useRef<(event: CallSignalEvent) => Promise<void>>(async () => {})
  const finishCallRef = useRef<() => void>(() => {})
  const componentMountedRef = useRef(true)
  const callInviteSentRef = useRef(false)
  const callConnectedAtRef = useRef<number | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const appliedInitialConversationIdRef = useRef<string | null>(null)
  const refreshTimerRef = useRef<number | null>(null)

  const refreshConversations = useCallback(async () => {
    try {
      const nextConversations = await api.listChatConversations()
      setConversations(nextConversations)
      onUnreadCountChange(nextConversations.reduce((total, item) => total + item.unreadCount, 0))
      setActiveId((current) => current && nextConversations.some((item) => item.id === current)
        ? current
        : isVisibleRef.current ? nextConversations[0]?.id ?? '' : '')
      setError('')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải hộp thư.')
    } finally {
      setIsLoadingConversations(false)
    }
  }, [api, onUnreadCountChange])

  const shouldLoadMessages = isVisible || callState.status !== 'idle'

  useEffect(() => {
    if (!isVisible) {
      appliedInitialConversationIdRef.current = null
      return
    }
    if (initialConversationId
      && initialConversationId !== appliedInitialConversationIdRef.current
      && conversations.some((item) => item.id === initialConversationId)) {
      appliedInitialConversationIdRef.current = initialConversationId
      setActiveId(initialConversationId)
    }
  }, [conversations, initialConversationId, isVisible])

  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  useEffect(() => {
    connectionRef.current = connection
  }, [connection])

  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  useEffect(() => {
    componentMountedRef.current = true
    return () => {
      componentMountedRef.current = false
      const current = callStateRef.current
      const socket = socketRef.current
      if (current.status !== 'idle' && callInviteSentRef.current && socket?.readyState === WebSocket.OPEN) {
        try {
          const type = current.status === 'incoming' ? 'call-decline' : 'call-end'
          const detail = current.status === 'incoming'
            ? { callType: current.callType }
            : getCallEndDetails(current)
          socket.send(JSON.stringify({ type, conversationId: current.conversationId, ...detail }))
        } catch (sendError) {
          console.error('Không thể báo kết thúc cuộc gọi khi đóng hộp thư.', sendError)
        }
      }
      peerConnectionRef.current?.close()
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
      peerConnectionRef.current = null
      localStreamRef.current = null
      remoteStreamRef.current = null
      pendingCandidatesRef.current = []
    }
  }, [])

  function updateCallState(next: CallState | ((current: CallState) => CallState)) {
    const resolved = typeof next === 'function' ? next(callStateRef.current) : next
    if (resolved.status === 'connected' && callStateRef.current.status !== 'connected') {
      callConnectedAtRef.current = Date.now()
    }
    if (resolved.status === 'idle') {
      callConnectedAtRef.current = null
      callInviteSentRef.current = false
    }
    callStateRef.current = resolved
    setCallState(resolved)
  }

  function getCallState(): CallState {
    return callStateRef.current
  }

  function getCallEndDetails(current: ActiveCallState, fallbackOutcome: 'cancelled' | 'no-answer' = 'cancelled') {
    const connectedAt = callConnectedAtRef.current
    return {
      callType: current.callType,
      outcome: connectedAt === null ? fallbackOutcome : 'completed',
      durationSeconds: connectedAt === null ? 0 : Math.floor((Date.now() - connectedAt) / 1000),
    }
  }

  function sendCallSignal(type: string, conversationId: string, detail: Record<string, unknown> = {}): boolean {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN || connectionRef.current !== 'connected') {
      setError('Đang kết nối lại hộp thư. Không thể thực hiện cuộc gọi lúc này.')
      return false
    }
    try {
      socket.send(JSON.stringify({ type, conversationId, ...detail }))
      return true
    } catch (sendError) {
      console.error('Không thể gửi tín hiệu cuộc gọi.', sendError)
      setError('Không thể kết nối cuộc gọi lúc này. Vui lòng thử lại.')
      return false
    }
  }

  function disposeCallMedia() {
    peerConnectionRef.current?.close()
    peerConnectionRef.current = null
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null
    remoteStreamRef.current = null
    pendingCandidatesRef.current = []
  }

  function finishCall() {
    disposeCallMedia()
    updateCallState({ status: 'idle' })
    setMicrophoneEnabled(true)
    setCameraEnabled(true)
  }

  function createPeerConnection(conversationId: string): RTCPeerConnection {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })
    const localStream = localStreamRef.current
    localStream?.getTracks().forEach((track) => peer.addTrack(track, localStream))
    peer.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0] ?? new MediaStream([event.track])
    }
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        sendCallSignal('call-ice', conversationId, { candidate: event.candidate.toJSON() })
      }
    }
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'failed') {
        const current = callStateRef.current
        if (current.status !== 'idle') {
          disposeCallMedia()
          updateCallState({ ...current, status: 'failed', error: 'Không thể thiết lập kết nối. Hãy thử gọi lại.' })
        }
      } else if (peer.connectionState === 'connected') {
        updateCallState((current) => current.status === 'idle' ? current : { ...current, status: 'connected' })
      }
    }
    peerConnectionRef.current = peer
    return peer
  }

  async function applyPendingCandidates(peer: RTCPeerConnection) {
    const candidates = pendingCandidatesRef.current
    pendingCandidatesRef.current = []
    for (const candidate of candidates) {
      await peer.addIceCandidate(candidate)
    }
  }

  function refreshCallHistory(conversationId: string) {
    void api.getChatMessages(conversationId).then((nextMessages) => {
      setMessagesByConversation((current) => ({ ...current, [conversationId]: nextMessages }))
      setLoadedConversations((current) => ({ ...current, [conversationId]: true }))
    }).catch((loadError: unknown) => {
      console.error('Không thể tải lịch sử cuộc gọi.', loadError)
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải lịch sử cuộc gọi.')
    })
  }

  async function handleCallSignal(event: CallSignalEvent) {
    const current = callStateRef.current
    if (event.type === 'call-invite') {
      if (current.status !== 'idle') {
        sendCallSignal('call-busy', event.conversationId, { callType: event.callType })
        return
      }
      const peerName = conversationsRef.current.find((item) => item.id === event.conversationId)?.participantName
        ?? 'Người dùng'
      callInviteSentRef.current = true
      setActiveId(event.conversationId)
      setError('')
      setMicrophoneEnabled(true)
      setCameraEnabled(true)
      updateCallState({
        status: 'incoming',
        conversationId: event.conversationId,
        callType: event.callType,
        peerName,
        isCaller: false,
      })
      return
    }

    if (current.status === 'idle' || current.conversationId !== event.conversationId) return

    if (event.type === 'call-contacting') return

    if (event.type === 'call-ringing' && current.status === 'contacting') {
      updateCallState({ ...current, status: 'outgoing' })
      return
    }

    if (event.type === 'call-error') {
      finishCall()
      setError(event.message)
      refreshCallHistory(event.conversationId)
      return
    }

    if (event.type === 'call-busy') {
      finishCall()
      refreshCallHistory(event.conversationId)
      return
    }

    if (event.type === 'call-accept' && (current.status === 'contacting' || current.status === 'outgoing')) {
      updateCallState({ ...current, status: 'connecting' })
      const peer = createPeerConnection(event.conversationId)
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      if (!peer.localDescription || !sendCallSignal('call-offer', event.conversationId, {
        description: { type: peer.localDescription.type, sdp: peer.localDescription.sdp },
      })) {
        throw new Error('Không thể gửi lời mời thiết lập cuộc gọi.')
      }
      return
    }

    if (event.type === 'call-offer' && !current.isCaller) {
      if (current.status !== 'connecting') return
      const peer = peerConnectionRef.current
      if (!peer) return
      await peer.setRemoteDescription(event.description)
      await applyPendingCandidates(peer)
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      if (!peer.localDescription || !sendCallSignal('call-answer', event.conversationId, {
        description: { type: peer.localDescription.type, sdp: peer.localDescription.sdp },
      })) {
        throw new Error('Không thể phản hồi thiết lập cuộc gọi.')
      }
      return
    }

    if (event.type === 'call-answer' && current.isCaller) {
      if (current.status !== 'connecting') return
      const peer = peerConnectionRef.current
      if (!peer) return
      await peer.setRemoteDescription(event.description)
      await applyPendingCandidates(peer)
      return
    }

    if (event.type === 'call-ice') {
      if (current.status !== 'connecting' && current.status !== 'connected') return
      const peer = peerConnectionRef.current
      if (!peer) return
      if (peer.remoteDescription) {
        await peer.addIceCandidate(event.candidate)
      } else {
        pendingCandidatesRef.current.push(event.candidate)
      }
      return
    }

    if (event.type === 'call-decline') {
      finishCall()
      refreshCallHistory(event.conversationId)
      return
    }

    if (event.type === 'call-end') {
      finishCall()
      refreshCallHistory(event.conversationId)
    }
  }

  useEffect(() => {
    callSignalHandlerRef.current = handleCallSignal
    finishCallRef.current = finishCall
  })

  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshConversations() }, 0)
    return () => window.clearTimeout(timer)
  }, [refreshConversations])

  useEffect(() => {
    const timer = window.setInterval(() => setPresenceClock(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const wasVisibleRef = useRef(isVisible)
  useEffect(() => {
    if (isVisible && !wasVisibleRef.current) {
      void refreshConversations()
    }
    wasVisibleRef.current = isVisible
  }, [isVisible, refreshConversations])

  useEffect(() => {
    let disposed = false
    let reconnect = true
    let socket: WebSocket | null = null

    function connect() {
      if (disposed) return
      setConnection('connecting')
      let authenticated = false
      try {
        socket = api.connectChat((event: ChatSocketEvent) => {
          if (event.type === 'authenticated') {
            authenticated = true
            connectionRef.current = 'connected'
            setConnection('connected')
            setError('')
            return
          }
          if (event.type === 'error') {
            setError(event.message)
            if (!authenticated) {
              reconnect = false
              setConnection('error')
              socket?.close(1008, 'Authentication failed')
            }
            return
          }

          if (event.type === 'presence') {
            setPresenceByUser((current) => ({
              ...current,
              [event.userId]: { online: event.online, lastActiveAt: event.lastActiveAt },
            }))
            return
          }

          if (event.type !== 'message') {
            void callSignalHandlerRef.current(event).catch((callError: unknown) => {
              console.error('Không thể thiết lập cuộc gọi.', callError)
              const current = getCallState()
              if (current.status !== 'idle') {
                disposeCallMedia()
                updateCallState({
                  ...current,
                  status: 'failed',
                  error: callError instanceof Error ? callError.message : 'Không thể thiết lập cuộc gọi.',
                })
              }
            })
            return
          }

          setMessagesByConversation((current) => {
            const threadMessages = current[event.message.conversationId] ?? []
            if (threadMessages.some((item) => item.id === event.message.id)) {
              return current
            }
            return { ...current, [event.message.conversationId]: [...threadMessages, event.message] }
          })
          void refreshConversations()
          if (event.message.conversationId === activeIdRef.current
            && (isVisibleRef.current || callStateRef.current.status !== 'idle')) {
            void api.getChatMessages(event.message.conversationId).then((nextMessages) => {
              setMessagesByConversation((current) => ({ ...current, [event.message.conversationId]: nextMessages }))
            }).catch((loadError: unknown) => {
              console.error('Không thể đồng bộ tin nhắn đã nhận.', loadError)
            })
          }
        })
        socketRef.current = socket
        socket.addEventListener('close', (closeEvent) => {
          if (disposed) return
          console.warn('Chat WebSocket closed unexpectedly.', {
            code: closeEvent.code,
            reason: closeEvent.reason,
            wasClean: closeEvent.wasClean,
          })
          socketRef.current = null
          if (callStateRef.current.status !== 'idle') {
            disposeCallMedia()
            updateCallState({ status: 'idle' })
            setError('Cuộc gọi đã bị ngắt do mất kết nối.')
          }
          if (!reconnect) return
          setConnection('disconnected')
          refreshTimerRef.current = window.setTimeout(connect, 2500)
        })
        socket.addEventListener('error', () => {
          if (!disposed) setConnection('disconnected')
        })
      } catch (connectError) {
        setConnection('error')
        setError(connectError instanceof Error ? connectError.message : 'Không thể kết nối hộp thư realtime.')
      }
    }

    connect()
    return () => {
      disposed = true
      reconnect = false
      if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current)
      if (socket?.readyState === WebSocket.CONNECTING) {
        const pendingSocket = socket
        pendingSocket.addEventListener('open', () => pendingSocket.close(), { once: true })
      } else {
        socket?.close()
      }
      socketRef.current = null
    }
  }, [api, refreshConversations])

  useEffect(() => {
    if (!activeId || !shouldLoadMessages) {
      return
    }

    let active = true
    void api.getChatMessages(activeId).then((nextMessages) => {
      if (active) {
        setMessagesByConversation((current) => ({ ...current, [activeId]: nextMessages }))
        setLoadedConversations((current) => ({ ...current, [activeId]: true }))
        void refreshConversations()
      }
    }).catch((loadError: unknown) => {
      if (active) {
        setError(loadError instanceof Error ? loadError.message : 'Không thể tải tin nhắn.')
        setLoadedConversations((current) => ({ ...current, [activeId]: true }))
      }
    })
    return () => { active = false }
  }, [activeId, api, refreshConversations, shouldLoadMessages])

  const activeChat = conversations.find((item) => item.id === activeId)
  const activePresence = activeChat ? presenceByUser[activeChat.participantId] : undefined
  const presenceLabel = activePresence
    ? activePresence.online
      ? 'Đang hoạt động'
      : formatLastActive(activePresence.lastActiveAt, presenceClock)
    : 'Đang cập nhật trạng thái...'
  const messages = messagesByConversation[activeId] ?? []
  const isLoadingMessages = Boolean(activeId && !loadedConversations[activeId])
  const visibleChats = conversations.filter((item) =>
    `${item.participantName} ${item.listingTitle}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')))

  function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = message.trim()
    if (!content || !activeChat) return
    if (sendChatPayload(activeChat.id, { content, messageType: 'TEXT' })) setMessage('')
  }

  function sendChatPayload(conversationId: string, payload: Record<string, unknown>): boolean {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN || connectionRef.current !== 'connected') {
      setError('Đang kết nối lại hộp thư. Vui lòng thử gửi lại sau giây lát.')
      return false
    }
    try {
      socket.send(JSON.stringify({ type: 'message', conversationId, ...payload }))
      setError('')
      return true
    } catch (sendError) {
      console.error('Không thể gửi dữ liệu chat.', sendError)
      setError('Không thể gửi tin nhắn lúc này. Vui lòng thử lại.')
      return false
    }
  }

  async function startCall(callType: CallType) {
    if (!activeChat || callStateRef.current.status !== 'idle') return
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Trình duyệt không hỗ trợ gọi audio/video. Hãy dùng trình duyệt mới và HTTPS.')
      return
    }

    const conversationId = activeChat.id
    callInviteSentRef.current = false
    updateCallState({
      status: 'connecting',
      conversationId,
      callType,
      peerName: activeChat.participantName,
      isCaller: true,
    })
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      })
      const current = getCallState()
      if (!componentMountedRef.current || current.status !== 'connecting' || current.conversationId !== conversationId) {
        localStream.getTracks().forEach((track) => track.stop())
        return
      }
      localStreamRef.current = localStream
      setMicrophoneEnabled(true)
      setCameraEnabled(true)
      updateCallState({
        status: 'contacting',
        conversationId,
        callType,
        peerName: activeChat.participantName,
        isCaller: true,
      })
      if (!sendCallSignal('call-invite', conversationId, { callType })) finishCall()
      else callInviteSentRef.current = true
    } catch (callError) {
      const current = getCallState()
      if (current.status === 'idle' || current.conversationId !== conversationId) return
      console.error('Không thể truy cập micro hoặc camera.', callError)
      setError(callError instanceof DOMException && callError.name === 'NotAllowedError'
        ? 'Bạn cần cho phép truy cập micro/camera để gọi.'
        : callError instanceof Error ? callError.message : 'Không thể bắt đầu cuộc gọi.')
      finishCall()
    }
  }

  function startCallSafely(callType: CallType) {
    void startCall(callType).catch((callError: unknown) => {
      console.error('Không thể bắt đầu cuộc gọi.', callError)
      if (callStateRef.current.status !== 'idle') finishCall()
      setError(callError instanceof Error ? callError.message : 'Không thể bắt đầu cuộc gọi.')
    })
  }

  async function acceptCall() {
    const current = callStateRef.current
    if (current.status !== 'incoming') return
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Trình duyệt không hỗ trợ gọi audio/video. Hãy dùng trình duyệt mới và HTTPS.')
      finishCall()
      return
    }

    updateCallState({ ...current, status: 'connecting' })
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: current.callType === 'video',
      })
      const latest = getCallState()
      if (!componentMountedRef.current || latest.status !== 'connecting' || latest.conversationId !== current.conversationId) {
        localStream.getTracks().forEach((track) => track.stop())
        return
      }
      localStreamRef.current = localStream
      setMicrophoneEnabled(true)
      setCameraEnabled(true)
      callInviteSentRef.current = true
      createPeerConnection(current.conversationId)
      updateCallState({ ...current, status: 'connecting' })
      if (!sendCallSignal('call-accept', current.conversationId)) {
        throw new Error('Không thể chấp nhận cuộc gọi do mất kết nối.')
      }
    } catch (callError) {
      const latest = getCallState()
      if (latest.status === 'idle' || latest.conversationId !== current.conversationId) return
      console.error('Không thể chấp nhận cuộc gọi.', callError)
      sendCallSignal('call-decline', current.conversationId, { callType: current.callType })
      disposeCallMedia()
      const callErrorMessage = callError instanceof DOMException && callError.name === 'NotAllowedError'
        ? 'Bạn cần cho phép truy cập micro/camera để nhận cuộc gọi.'
        : callError instanceof DOMException && callError.name === 'NotReadableError'
          ? 'Camera hoặc micro đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng/tab khác đang dùng thiết bị và yêu cầu gọi lại.'
          : callError instanceof Error ? callError.message : 'Không thể nhận cuộc gọi.'
      updateCallState({ ...current, status: 'failed', error: callErrorMessage })
    }
  }

  function declineCall() {
    const current = callStateRef.current
    if (current.status !== 'incoming') return
    sendCallSignal('call-decline', current.conversationId, { callType: current.callType })
    finishCall()
  }

  function hangUpCall() {
    const current = callStateRef.current
    if (current.status === 'idle') return
    if (callInviteSentRef.current) {
      sendCallSignal('call-end', current.conversationId, getCallEndDetails(current))
    }
    finishCall()
  }

  function toggleMicrophone() {
    const enabled = !microphoneEnabled
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = enabled })
    setMicrophoneEnabled(enabled)
  }

  function toggleCamera() {
    const enabled = !cameraEnabled
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = enabled })
    setCameraEnabled(enabled)
  }

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStreamRef.current
  }, [callState])

  const ringingCallType = callState.status === 'incoming' || callState.status === 'outgoing'
    ? callState.callType
    : null

  useEffect(() => {
    if (!ringingCallType || !window.AudioContext) return
    let context: AudioContext
    try {
      context = new AudioContext()
    } catch (ringError) {
      console.warn('Không thể phát âm báo cuộc gọi; giao diện vẫn hiển thị trạng thái đổ chuông.', ringError)
      return
    }

    function playRing() {
      if (context.state !== 'running') return
      for (const frequency of [440, 480]) {
        const oscillator = context.createOscillator()
        const volume = context.createGain()
        const startAt = context.currentTime
        oscillator.frequency.setValueAtTime(frequency, startAt)
        volume.gain.setValueAtTime(0.0001, startAt)
        volume.gain.exponentialRampToValueAtTime(0.035, startAt + 0.025)
        volume.gain.setValueAtTime(0.035, startAt + 0.24)
        volume.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.32)
        oscillator.connect(volume)
        volume.connect(context.destination)
        oscillator.start(startAt)
        oscillator.stop(startAt + 0.33)
      }
    }

    const interval = window.setInterval(playRing, 1600)
    void context.resume().then(playRing).catch((ringError: unknown) => {
      console.info('Trình duyệt đã chặn âm báo tự động; trạng thái đổ chuông vẫn hiển thị.', ringError)
    })
    return () => {
      window.clearInterval(interval)
      if (context.state !== 'closed') {
        void context.close().catch((ringError: unknown) => {
          console.debug('Không thể đóng âm báo cuộc gọi.', ringError)
        })
      }
    }
  }, [ringingCallType])

  useEffect(() => {
    if (callState.status !== 'contacting' && callState.status !== 'outgoing') return
    const { conversationId } = callState
    const timeout = window.setTimeout(() => {
      const current = callStateRef.current
      if ((current.status !== 'contacting' && current.status !== 'outgoing') || current.conversationId !== conversationId) return
      sendCallSignal('call-end', conversationId, getCallEndDetails(current, 'no-answer'))
      finishCallRef.current()
      setError('Không có phản hồi. Cuộc gọi đã kết thúc.')
    }, 30_000)
    return () => window.clearTimeout(timeout)
  }, [callState])

  function shareCurrentLocation() {
    if (!activeChat) return
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt này không hỗ trợ chia sẻ vị trí.')
      return
    }

    setLocationError('')
    setIsSharingLocation(true)
    const conversationId = activeChat.id
    try {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        const latitude = coords.latitude
        const longitude = coords.longitude
        const mapUrl = createCoordinatesMapUrl(latitude, longitude)
        sendChatPayload(conversationId, {
          content: 'Vị trí hiện tại',
          messageType: 'LOCATION',
          latitude,
          longitude,
          mapUrl,
        })
        setIsSharingLocation(false)
      }, (geoError) => {
        const description = geoError.code === geoError.PERMISSION_DENIED
          ? 'Bạn chưa cho phép truy cập vị trí. Hãy bật quyền vị trí của trình duyệt rồi thử lại.'
          : geoError.code === geoError.TIMEOUT
            ? 'Không lấy được vị trí kịp thời. Vui lòng thử lại.'
            : 'Không thể xác định vị trí hiện tại. Vui lòng thử lại.'
        setLocationError(description)
        setIsSharingLocation(false)
      }, { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 })
    } catch (geoError) {
      console.error('Không thể yêu cầu vị trí hiện tại.', geoError)
      setLocationError('Không thể yêu cầu quyền truy cập vị trí. Hãy thử lại trong môi trường HTTPS.')
      setIsSharingLocation(false)
    }
  }

  function sendPinnedLocation() {
    const location = pinnedLocation.trim()
    if (!activeChat || !location) {
      setLocationError('Hãy nhập địa chỉ hoặc liên kết Google Maps cần ghim.')
      return
    }
    const coordinates = parseCoordinates(location)
    if (coordinates === 'invalid') {
      setLocationError('Tọa độ cần nằm trong khoảng vĩ độ -90 đến 90 và kinh độ -180 đến 180.')
      return
    }
    const mapUrl = coordinates
      ? createCoordinatesMapUrl(coordinates.latitude, coordinates.longitude)
      : toGoogleMapsUrl(location)
    if (!mapUrl) {
      setLocationError('Chỉ hỗ trợ liên kết HTTPS từ Google Maps. Bạn cũng có thể nhập tên địa điểm hoặc tọa độ.')
      return
    }
    const locationMessage = {
      content: `Vị trí ghim: ${location}`,
      messageType: 'LOCATION',
      mapUrl,
      ...(coordinates ? { latitude: coordinates.latitude, longitude: coordinates.longitude } : {}),
    }
    if (sendChatPayload(activeChat.id, locationMessage)) {
      setLocationError('')
      setPinnedLocation('')
      setIsPinningLocation(false)
    }
  }

  function selectConversation(conversationId: string) {
    setActiveId(conversationId)
  }

  useEffect(() => {
    const messagesContainer = messagesContainerRef.current
    if (messagesContainer) {
      messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' })
    }
  }, [activeId, messages.length])

  return (
    <div className="inbox-page">
      <div className="inbox-heading">
        <div><span className="section-eyebrow">KẾT NỐI TỬ TẾ</span><h1>Hộp thư</h1></div>
      </div>
      {error && <p className="chat-error inbox-error" role="alert">{error}</p>}
      <div className={`inbox-panel${activeChat ? ' inbox-chat-active' : ''}`}>
        <aside className="conversation-sidebar">
          <div className="conversation-sidebar-heading"><h2>Trò chuyện <span>{conversations.length}</span></h2></div>
          <label className="conversation-search"><Search size={16} /><input placeholder="Tìm trong hộp thư" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <div className="conversation-list">
            {isLoadingConversations && <p className="chat-list-status">Đang tải cuộc trò chuyện...</p>}
            {!isLoadingConversations && visibleChats.length === 0 && <p className="chat-list-status">Chưa có cuộc trò chuyện nào.</p>}
            {visibleChats.map((chat) => (
              <button className={`conversation-item ${chat.id === activeId ? 'conversation-active' : ''}`} key={chat.id} onClick={() => selectConversation(chat.id)}>
                <span className="avatar conversation-avatar avatar-tone-green">{chat.participantInitials}</span>
                <span className="conversation-copy">
                  <span><strong>{chat.participantName}</strong><small>{formatRelativeTime(chat.updatedAt)}</small></span>
                  <span>{chat.lastMessage || 'Bắt đầu trò chuyện'}</span>
                  <small className="conversation-product">{chat.listingTitle}</small>
                </span>
                {chat.unreadCount > 0 && <i className="unread-dot" aria-label={`${chat.unreadCount} tin nhắn chưa đọc`} />}
              </button>
            ))}
          </div>
        </aside>
        <section className="chat-panel">
          {activeChat ? (
            <>
              <header className="chat-header">
                <button className="chat-back" aria-label="Đóng cuộc trò chuyện" onClick={() => setActiveId('')}><ArrowLeft size={18} /></button>
                <span className="avatar avatar-tone-green">{activeChat.participantInitials}</span>
                <span className="chat-person"><strong>{activeChat.participantName}</strong><small className={activePresence?.online ? 'chat-presence-online' : 'chat-presence-offline'}>{presenceLabel}</small></span>
                <div className="chat-header-actions">
                  <button type="button" aria-label="Gọi thoại" title="Gọi thoại" onClick={() => startCallSafely('audio')} disabled={connection !== 'connected' || callState.status !== 'idle'}>
                    <Phone size={17} />
                  </button>
                  <button type="button" aria-label="Gọi video" title="Gọi video" onClick={() => startCallSafely('video')} disabled={connection !== 'connected' || callState.status !== 'idle'}>
                    <Video size={18} />
                  </button>
                </div>
              </header>
              <button className="chat-product-card" onClick={() => onOpenListing(activeChat.listingId)}>
                <img src={activeChat.listingImage} alt={activeChat.listingTitle} />
                <span><small>ĐANG TRAO ĐỔI</small><strong>{activeChat.listingTitle}</strong><b>{formatPrice(activeChat.price, activeChat.giveaway)}</b></span>
                <span className="chat-product-link">Xem tin <ExternalLink size={12} /></span>
              </button>
              <div className="chat-messages" ref={messagesContainerRef} aria-live="polite">
                {isLoadingMessages && <p className="chat-list-status">Đang tải tin nhắn...</p>}
                {!isLoadingMessages && messages.length === 0 && <p className="chat-empty-thread"><MessageCircle size={20} />Gửi lời chào để bắt đầu trao đổi về tin đăng này.</p>}
                {messages.map((chatMessage) => (
                  chatMessage.messageType === 'LOCATION'
                    ? <LocationMessage key={chatMessage.id} message={chatMessage} isOwnMessage={chatMessage.senderId === String(user.id)} />
                    : isCallHistoryMessage(chatMessage)
                      ? <CallHistoryMessage
                          key={chatMessage.id}
                          message={chatMessage}
                          isOwnMessage={chatMessage.senderId === String(user.id)}
                          onCallBack={startCallSafely}
                          disabled={connection !== 'connected' || callState.status !== 'idle'}
                        />
                    : <div className={`message-bubble ${chatMessage.senderId === String(user.id) ? 'message-outgoing' : 'message-incoming'}`} key={chatMessage.id}>
                        {chatMessage.content}<small>{formatTime(chatMessage.sentAt)}</small>
                      </div>
                ))}
              </div>
              {isPinningLocation && (
                <div className="chat-location-pin-panel">
                  <div className="chat-location-pin-heading"><MapPin size={16} /><strong>Ghim địa điểm trên Google Maps</strong><button type="button" aria-label="Đóng" onClick={() => setIsPinningLocation(false)}><X size={15} /></button></div>
                  <input maxLength={500} value={pinnedLocation} onChange={(event) => setPinnedLocation(event.target.value)} placeholder="Địa chỉ, tọa độ hoặc liên kết Google Maps" aria-label="Địa chỉ, tọa độ hoặc liên kết Google Maps" />
                  <small>Người nhận có thể mở ghim trực tiếp trên Google Maps.</small>
                  <button type="button" className="button-primary" onClick={sendPinnedLocation} disabled={!pinnedLocation.trim() || connection !== 'connected'}>Gửi ghim vị trí</button>
                </div>
              )}
              {locationError && <p className="location-share-error" role="alert">{locationError}</p>}
              <form className="chat-compose" onSubmit={sendMessage}>
                <div className="chat-compose-tools">
                  <button type="button" aria-label="Chia sẻ vị trí hiện tại" title="Chia sẻ vị trí hiện tại" onClick={shareCurrentLocation} disabled={connection !== 'connected' || isSharingLocation}>
                    <MapPin size={18} />
                  </button>
                  <button type="button" aria-label="Ghim địa điểm Google Maps" title="Ghim địa điểm Google Maps" aria-expanded={isPinningLocation} onClick={() => { setIsPinningLocation((open) => !open); setLocationError('') }} disabled={connection !== 'connected'}>
                    <Map size={18} />
                  </button>
                </div>
                <input maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Viết tin nhắn..." aria-label="Nội dung tin nhắn" />
                <button className="send-message-button" type="submit" disabled={!message.trim() || connection !== 'connected'} aria-label="Gửi tin nhắn"><Send size={17} /></button>
              </form>
            </>
          ) : (
            <div className="chat-empty-state">
              <MessageCircle size={30} />
              <strong>{isLoadingConversations ? 'Đang tải hộp thư' : 'Chưa có cuộc trò chuyện'}</strong>
              <span>Mở một tin đăng và chọn “Chat với người bán” để bắt đầu trao đổi.</span>
            </div>
          )}
        </section>
      </div>
      {callState.status !== 'idle' && createPortal(
        <div className="call-overlay">
          <section className={`call-dialog${callState.status === 'incoming' || callState.status === 'outgoing' ? ' call-dialog-ringing' : ''}`} role="dialog" aria-modal="true" aria-label="Cuộc gọi">
            <header className="call-dialog-heading">
              <span>{callState.callType === 'video' ? 'Cuộc gọi video' : 'Cuộc gọi thoại'}</span>
              <button type="button" aria-label="Đóng cuộc gọi" onClick={callState.status === 'incoming' ? declineCall : hangUpCall}><X size={18} /></button>
            </header>
            {callState.callType === 'video' && callState.status !== 'incoming' ? (
              <div className="call-video-stage">
                <video ref={remoteVideoRef} autoPlay playsInline aria-label={`Video của ${callState.peerName}`} />
                <video className="call-local-video" ref={localVideoRef} autoPlay playsInline muted aria-label="Video của bạn" />
              </div>
            ) : (
              <div className="call-audio-stage">
                <span className="avatar avatar-tone-green">{callState.peerName.trim().slice(0, 1).toLocaleUpperCase('vi')}</span>
                <strong>{callState.peerName}</strong>
                <audio ref={remoteAudioRef} autoPlay aria-label={`Âm thanh từ ${callState.peerName}`} />
              </div>
            )}
            <p className={`call-status${callState.status === 'incoming' || callState.status === 'outgoing' ? ' call-status-ringing' : ''}`} role="status">
              {callState.status === 'incoming' ? 'Đang đổ chuông...'
                : callState.status === 'contacting' ? 'Đang liên hệ...'
                  : callState.status === 'outgoing' ? 'Đang rung chuông...'
                  : callState.status === 'connecting' ? 'Đang kết nối...'
                    : callState.status === 'connected' ? 'Đã kết nối'
                      : callState.error}
            </p>
            {callState.status === 'incoming' ? (
              <div className="call-controls">
                <button type="button" className="call-control-decline" onClick={declineCall}><PhoneOff size={19} />Từ chối</button>
                <button type="button" className="call-control-accept" onClick={() => { void acceptCall() }}><Phone size={19} />Trả lời</button>
              </div>
            ) : callState.status === 'failed' ? (
              <div className="call-controls">
                <button type="button" className="call-control-accept" onClick={hangUpCall}>Đóng</button>
              </div>
            ) : (
              <div className="call-controls">
                <button type="button" className={`call-control-toggle${microphoneEnabled ? '' : ' call-control-muted'}`} onClick={toggleMicrophone} aria-label={microphoneEnabled ? 'Tắt micro' : 'Bật micro'}>
                  {microphoneEnabled ? <Mic size={19} /> : <MicOff size={19} />}
                </button>
                {callState.callType === 'video' && (
                  <button type="button" className={`call-control-toggle${cameraEnabled ? '' : ' call-control-muted'}`} onClick={toggleCamera} aria-label={cameraEnabled ? 'Tắt camera' : 'Bật camera'}>
                    {cameraEnabled ? <Video size={19} /> : <VideoOff size={19} />}
                  </button>
                )}
                <button type="button" className="call-control-decline" onClick={hangUpCall} aria-label="Kết thúc cuộc gọi"><PhoneOff size={19} /></button>
              </div>
            )}
          </section>
        </div>,
        document.body
      )}
    </div>
  )
}

function formatPrice(price: number, giveaway: boolean): string {
  return giveaway ? 'Miễn phí' : `${price.toLocaleString('vi-VN')} đ`
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function isCallHistoryMessage(message: ChatMessage): boolean {
  if (message.messageType === 'MISSED_CALL' || message.messageType === 'CALL') return true
  return [
    'Người nhận đang bận. Đã nhỡ cuộc gọi ',
    'Người nhận đã từ chối cuộc gọi ',
    'Người nhận hiện không trực tuyến để nhận cuộc gọi ',
    'Cuộc gọi thoại đã bị hủy',
    'Cuộc gọi video đã bị hủy',
    'Không có phản hồi cho cuộc gọi ',
    'Cuộc gọi thoại đã kết thúc',
    'Cuộc gọi video đã kết thúc',
  ].some((prefix) => message.content.startsWith(prefix))
}

function formatRelativeTime(value: string): string {
  const ageInMinutes = Math.floor((Date.now() - new Date(value).getTime()) / 60_000)
  if (ageInMinutes < 1) return 'Vừa xong'
  if (ageInMinutes < 60) return `${ageInMinutes} phút`
  if (ageInMinutes < 1440) return `${Math.floor(ageInMinutes / 60)} giờ`
  return new Date(value).toLocaleDateString('vi-VN')
}

function formatLastActive(value: string | null, now: number): string {
  if (!value) return 'Ngoại tuyến'
  const lastActiveAt = new Date(value).getTime()
  if (Number.isNaN(lastActiveAt)) return 'Không rõ lần hoạt động gần nhất'

  const ageInMinutes = Math.floor(Math.max(0, now - lastActiveAt) / 60_000)
  if (ageInMinutes < 1) return 'Đã hoạt động vừa xong'
  if (ageInMinutes < 60) return `Đã hoạt động ${ageInMinutes} phút trước`
  const ageInHours = Math.floor(ageInMinutes / 60)
  if (ageInHours < 24) return `Đã hoạt động ${ageInHours} giờ trước`
  const ageInDays = Math.floor(ageInHours / 24)
  if (ageInDays < 30) return `Đã hoạt động ${ageInDays} ngày trước`
  return `Đã hoạt động ngày ${new Date(lastActiveAt).toLocaleDateString('vi-VN')}`
}

function LocationMessage({ message, isOwnMessage }: { message: ChatMessage; isOwnMessage: boolean }) {
  const mapUrl = message.mapUrl ? trustedGoogleMapsUrl(message.mapUrl) : null
  const coordinates = message.latitude !== null && message.longitude !== null
    ? `${message.latitude.toFixed(5)}, ${message.longitude.toFixed(5)}`
    : 'Mở vị trí trên Google Maps'

  return (
    <div className={`message-bubble message-location ${isOwnMessage ? 'message-outgoing' : 'message-incoming'}`}>
      {mapUrl
        ? <a className="shared-location-link" href={mapUrl} target="_blank" rel="noreferrer">
            <MapPin size={17} />
            <span><strong>{message.content || 'Vị trí được chia sẻ'}</strong><small>{coordinates}</small></span>
            <ExternalLink size={13} />
          </a>
        : <span>{message.content || 'Vị trí được chia sẻ'}</span>}
      <small className="message-sent-time">{formatTime(message.sentAt)}</small>
    </div>
  )
}

function CallHistoryMessage({
  message,
  isOwnMessage,
  onCallBack,
  disabled,
}: {
  message: ChatMessage
  isOwnMessage: boolean
  onCallBack: (callType: CallType) => void
  disabled: boolean
}) {
  const callType: CallType = message.content.toLocaleLowerCase('vi').includes('video') ? 'video' : 'audio'
  const isCompletedCall = message.messageType === 'CALL' || message.content.includes('đã kết thúc')

  return (
    <div className={`call-history-card ${isOwnMessage ? 'call-history-outgoing' : 'call-history-incoming'}`}>
      <div className="call-history-details">
        <span className={`call-history-icon${isCompletedCall ? ' call-history-icon-completed' : ''}`}>
          {isCompletedCall ? callType === 'video' ? <Video size={17} /> : <Phone size={17} /> : <PhoneOff size={17} />}
        </span>
        <span><strong>{message.content}</strong><small>{formatTime(message.sentAt)}</small></span>
      </div>
      <button type="button" onClick={() => onCallBack(callType)} disabled={disabled}>Gọi lại</button>
    </div>
  )
}

function createCoordinatesMapUrl(latitude: number, longitude: number): string {
  const url = new URL('https://www.google.com/maps/search/')
  url.searchParams.set('api', '1')
  url.searchParams.set('query', `${latitude},${longitude}`)
  return url.toString()
}

function toGoogleMapsUrl(value: string): string | null {
  const sharedMapUrl = trustedGoogleMapsUrl(value)
  if (sharedMapUrl) return sharedMapUrl
  if (/^https?:\/\//i.test(value)) return null

  const url = new URL('https://www.google.com/maps/search/')
  url.searchParams.set('api', '1')
  url.searchParams.set('query', value)
  return url.toString()
}

function parseCoordinates(value: string): { latitude: number; longitude: number } | 'invalid' | null {
  const match = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/.exec(value)
  if (!match) return null
  const latitude = Number(match[1])
  const longitude = Number(match[2])
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return 'invalid'
  }
  return { latitude, longitude }
}

function trustedGoogleMapsUrl(value: string): string | null {
  try {
    const url = new URL(value)
    const host = url.hostname.toLocaleLowerCase('en-US')
    const googleMapsPath = url.pathname.startsWith('/maps')
    const trustedHost = ((host === 'google.com' || host === 'www.google.com') && googleMapsPath)
      || host === 'maps.google.com'
      || (host === 'maps.app.goo.gl' && url.pathname !== '/')
      || (host === 'goo.gl' && googleMapsPath)
    return url.protocol === 'https:' && trustedHost && !url.username && !url.password && !url.port
      ? url.toString()
      : null
  } catch {
    return null
  }
}
