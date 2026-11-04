import { useState } from 'react'
import { ArrowLeft, ExternalLink, Image, MapPin, MoreHorizontal, Phone, Search, Send, Smile } from 'lucide-react'
import { conversations } from '../data/conversations'

type ChatMessage =
  | { id: string; kind: 'text'; content: string }
  | { id: string; kind: 'location'; mapsUrl: string }

export function InboxPage() {
  const [activeId, setActiveId] = useState(conversations[0].id)
  const [message, setMessage] = useState('')
  const [messagesByChat, setMessagesByChat] = useState<Record<string, ChatMessage[]>>({})
  const [search, setSearch] = useState('')
  const [isSharingLocation, setIsSharingLocation] = useState(false)
  const [locationError, setLocationError] = useState('')
  const activeChat = conversations.find((item) => item.id === activeId) ?? conversations[0]
  const visibleChats = conversations.filter((item) => `${item.name} ${item.product}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')))
  const sentMessages = messagesByChat[activeId] ?? []

  function shareLocation() {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt này không hỗ trợ chia sẻ vị trí.')
      return
    }

    setLocationError('')
    setIsSharingLocation(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`
        setMessagesByChat((current) => ({
          ...current,
          [activeId]: [...(current[activeId] ?? []), { id: crypto.randomUUID(), kind: 'location', mapsUrl }],
        }))
        setIsSharingLocation(false)
      },
      (error) => {
        const errorMessage = error.code === error.PERMISSION_DENIED
          ? 'Bạn chưa cho phép truy cập vị trí. Hãy bật quyền vị trí của trình duyệt rồi thử lại.'
          : error.code === error.TIMEOUT
            ? 'Không lấy được vị trí kịp thời. Vui lòng thử lại.'
            : 'Không thể xác định vị trí hiện tại. Vui lòng thử lại.'
        setLocationError(errorMessage)
        setIsSharingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  }

  function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!message.trim()) return
    setMessagesByChat((current) => ({
      ...current,
      [activeId]: [...(current[activeId] ?? []), { id: crypto.randomUUID(), kind: 'text', content: message.trim() }],
    }))
    setMessage('')
  }

  return (
    <div className="inbox-page">
      <div className="inbox-heading"><div><span className="section-eyebrow">KẾT NỐI TỬ TẾ</span><h1>Hộp thư</h1></div><span className="inbox-encryption">Tin nhắn riêng tư <i /></span></div>
      <div className="inbox-panel">
        <aside className="conversation-sidebar"><div className="conversation-sidebar-heading"><h2>Trò chuyện <span>3</span></h2><button aria-label="Thêm hội thoại"><MoreHorizontal size={19} /></button></div><label className="conversation-search"><Search size={16} /><input placeholder="Tìm trong hộp thư" value={search} onChange={(event) => setSearch(event.target.value)} /></label><div className="conversation-list">{visibleChats.map((chat) => <button className={`conversation-item ${chat.id === activeId ? 'conversation-active' : ''}`} key={chat.id} onClick={() => setActiveId(chat.id)}><span className={`avatar conversation-avatar avatar-tone-${chat.color}`}>{chat.initials}<i /></span><span className="conversation-copy"><span><strong>{chat.name}</strong><small>{chat.time}</small></span><span>{chat.lastMessage}</span><small className="conversation-product">{chat.product}</small></span>{chat.unread && <i className="unread-dot" />}</button>)}</div></aside>
        <section className="chat-panel"><header className="chat-header"><button className="chat-back"><ArrowLeft size={18} /></button><span className={`avatar avatar-tone-${activeChat.color}`}>{activeChat.initials}</span><span className="chat-person"><strong>{activeChat.name}</strong><small>Đang hoạt động</small></span><div className="chat-header-actions"><button aria-label="Gọi điện"><Phone size={18} /></button><button aria-label="Gửi vị trí hiện tại" title="Gửi vị trí trên Google Maps" onClick={shareLocation} disabled={isSharingLocation}><MapPin size={18} /></button><button aria-label="Tùy chọn"><MoreHorizontal size={19} /></button></div></header>
          <button className="chat-product-card"><img src={activeChat.productImage} alt={activeChat.product} /><span><small>ĐANG TRAO ĐỔI</small><strong>{activeChat.product}</strong><b>{activeChat.price}</b></span><span className="chat-product-link">Xem tin →</span></button>
          <div className="chat-messages"><div className="message-date">Hôm nay, 10:28</div><div className="message-bubble message-incoming">{activeChat.greeting}<small>10:28</small></div><div className="message-bubble message-outgoing">{activeChat.reply}<small>10:31 <span>✓✓</span></small></div>{sentMessages.map((sentMessage) => <div className={`message-bubble message-outgoing ${sentMessage.kind === 'location' ? 'message-location' : ''}`} key={sentMessage.id}>{sentMessage.kind === 'text' ? sentMessage.content : <a className="shared-location-link" href={sentMessage.mapsUrl} target="_blank" rel="noreferrer"><MapPin size={16} /><span><strong>Vị trí được chia sẻ</strong><small>Mở trong Google Maps</small></span><ExternalLink size={13} /></a>}<small>Vừa xong <span>✓✓</span></small></div>)}</div>
          {locationError && <p className="location-share-error" role="alert">{locationError}</p>}
          <form className="chat-compose" onSubmit={sendMessage}><div className="chat-compose-tools"><button type="button" aria-label="Gửi ảnh"><Image size={18} /></button><button type="button" aria-label="Chọn biểu tượng"><Smile size={18} /></button></div><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Viết tin nhắn..." aria-label="Nội dung tin nhắn" /><button className="send-message-button" type="submit" disabled={!message.trim()} aria-label="Gửi tin nhắn"><Send size={17} /></button></form>
        </section>
      </div>
    </div>
  )
}
