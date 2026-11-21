import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ExternalLink, Map, MapPin, MessageCircle, Search, Send, X } from 'lucide-react'
import type { AuthUser, ChatConversation, ChatMessage, ChatSocketEvent, MarketplaceApi } from '../services/MarketplaceApi'

interface InboxPageProps {
  api: MarketplaceApi
  user: AuthUser
  initialConversationId: string | null
  onOpenListing: (listingId: string) => void
  onUnreadCountChange: (count: number) => void
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

export function InboxPage({ api, user, initialConversationId, onOpenListing, onUnreadCountChange }: InboxPageProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeId, setActiveId] = useState(initialConversationId ?? '')
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({})
  const [loadedConversations, setLoadedConversations] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState('')
  const [pinnedLocation, setPinnedLocation] = useState('')
  const [search, setSearch] = useState('')
  const [connection, setConnection] = useState<ConnectionState>('connecting')
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isSharingLocation, setIsSharingLocation] = useState(false)
  const [isPinningLocation, setIsPinningLocation] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [error, setError] = useState('')
  const socketRef = useRef<WebSocket | null>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const activeIdRef = useRef(activeId)
  const connectionRef = useRef<ConnectionState>(connection)
  const initialConversationAppliedRef = useRef(false)
  const refreshTimerRef = useRef<number | null>(null)

  const refreshConversations = useCallback(async () => {
    try {
      const nextConversations = await api.listChatConversations()
      setConversations(nextConversations)
      onUnreadCountChange(nextConversations.reduce((total, item) => total + item.unreadCount, 0))
      if (!initialConversationAppliedRef.current
        && initialConversationId
        && nextConversations.some((item) => item.id === initialConversationId)) {
        initialConversationAppliedRef.current = true
        setActiveId(initialConversationId)
      } else {
        setActiveId((current) => current && nextConversations.some((item) => item.id === current)
          ? current
          : nextConversations[0]?.id ?? '')
      }
      setError('')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải hộp thư.')
    } finally {
      setIsLoadingConversations(false)
    }
  }, [api, initialConversationId, onUnreadCountChange])

  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  useEffect(() => {
    connectionRef.current = connection
  }, [connection])

  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshConversations() }, 0)
    return () => window.clearTimeout(timer)
  }, [refreshConversations])

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

          setMessagesByConversation((current) => {
            const threadMessages = current[event.message.conversationId] ?? []
            if (threadMessages.some((item) => item.id === event.message.id)) {
              return current
            }
            return { ...current, [event.message.conversationId]: [...threadMessages, event.message] }
          })
          void refreshConversations()
          if (event.message.conversationId === activeIdRef.current) {
            void api.getChatMessages(event.message.conversationId).then((nextMessages) => {
              setMessagesByConversation((current) => ({ ...current, [event.message.conversationId]: nextMessages }))
            }).catch((loadError: unknown) => {
              console.error('Không thể đồng bộ tin nhắn đã nhận.', loadError)
            })
          }
        })
        socketRef.current = socket
        socket.addEventListener('close', () => {
          if (disposed) return
          socketRef.current = null
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
      socket?.close()
      socketRef.current = null
    }
  }, [api, refreshConversations])

  useEffect(() => {
    if (!activeId) {
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
  }, [activeId, api, refreshConversations])

  const activeChat = conversations.find((item) => item.id === activeId)
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

  const connectionLabel = connection === 'connected'
    ? 'Đang kết nối realtime'
    : connection === 'connecting'
      ? 'Đang kết nối...'
      : connection === 'error'
        ? 'Không thể kết nối'
        : 'Đang kết nối lại...'

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeId, messages.length])

  return (
    <div className="inbox-page">
      <div className="inbox-heading">
        <div><span className="section-eyebrow">KẾT NỐI TỬ TẾ</span><h1>Hộp thư</h1></div>
        <span className={`inbox-encryption inbox-connection-${connection}`}><i />{connectionLabel}</span>
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
                <span className="chat-person"><strong>{activeChat.participantName}</strong><small>{connectionLabel}</small></span>
              </header>
              <button className="chat-product-card" onClick={() => onOpenListing(activeChat.listingId)}>
                <img src={activeChat.listingImage} alt={activeChat.listingTitle} />
                <span><small>ĐANG TRAO ĐỔI</small><strong>{activeChat.listingTitle}</strong><b>{formatPrice(activeChat.price, activeChat.giveaway)}</b></span>
                <span className="chat-product-link">Xem tin <ExternalLink size={12} /></span>
              </button>
              <div className="chat-messages" aria-live="polite">
                {isLoadingMessages && <p className="chat-list-status">Đang tải tin nhắn...</p>}
                {!isLoadingMessages && messages.length === 0 && <p className="chat-empty-thread"><MessageCircle size={20} />Gửi lời chào để bắt đầu trao đổi về tin đăng này.</p>}
                {messages.map((chatMessage) => (
                  chatMessage.messageType === 'LOCATION'
                    ? <LocationMessage key={chatMessage.id} message={chatMessage} isOwnMessage={chatMessage.senderId === String(user.id)} />
                    : <div className={`message-bubble ${chatMessage.senderId === String(user.id) ? 'message-outgoing' : 'message-incoming'}`} key={chatMessage.id}>
                        {chatMessage.content}<small>{formatTime(chatMessage.sentAt)}</small>
                      </div>
                ))}
                <div ref={messageEndRef} />
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
    </div>
  )
}

function formatPrice(price: number, giveaway: boolean): string {
  return giveaway ? 'Miễn phí' : `${price.toLocaleString('vi-VN')} đ`
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function formatRelativeTime(value: string): string {
  const ageInMinutes = Math.floor((Date.now() - new Date(value).getTime()) / 60_000)
  if (ageInMinutes < 1) return 'Vừa xong'
  if (ageInMinutes < 60) return `${ageInMinutes} phút`
  if (ageInMinutes < 1440) return `${Math.floor(ageInMinutes / 60)} giờ`
  return new Date(value).toLocaleDateString('vi-VN')
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
