import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ExternalLink, MessageCircle, Search, Send } from 'lucide-react'
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
  const [search, setSearch] = useState('')
  const [connection, setConnection] = useState<ConnectionState>('connecting')
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
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
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN || connectionRef.current !== 'connected') {
      setError('Đang kết nối lại hộp thư. Vui lòng thử gửi lại sau giây lát.')
      return
    }
    socket.send(JSON.stringify({ type: 'message', conversationId: activeChat.id, content }))
    setMessage('')
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
                  <div className={`message-bubble ${chatMessage.senderId === String(user.id) ? 'message-outgoing' : 'message-incoming'}`} key={chatMessage.id}>
                    {chatMessage.content}<small>{formatTime(chatMessage.sentAt)}</small>
                  </div>
                ))}
                <div ref={messageEndRef} />
              </div>
              <form className="chat-compose" onSubmit={sendMessage}>
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
