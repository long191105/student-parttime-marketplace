import { useState } from 'react'
import { ArrowLeft, Image, MoreHorizontal, Phone, Search, Send, Smile } from 'lucide-react'
import { conversations } from '../data/conversations'

export function InboxPage() {
  const [activeId, setActiveId] = useState(conversations[0].id)
  const [message, setMessage] = useState('')
  const [messagesByChat, setMessagesByChat] = useState<Record<string, string[]>>({})
  const [search, setSearch] = useState('')
  const activeChat = conversations.find((item) => item.id === activeId) ?? conversations[0]
  const visibleChats = conversations.filter((item) => `${item.name} ${item.product}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')))
  const sentMessages = messagesByChat[activeId] ?? []

  function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!message.trim()) return
    setMessagesByChat((current) => ({ ...current, [activeId]: [...(current[activeId] ?? []), message.trim()] }))
    setMessage('')
  }

  return (
    <div className="inbox-page">
      <div className="inbox-heading"><div><span className="section-eyebrow">KẾT NỐI TỬ TẾ</span><h1>Hộp thư</h1></div><span className="inbox-encryption">Tin nhắn riêng tư <i /></span></div>
      <div className="inbox-panel">
        <aside className="conversation-sidebar"><div className="conversation-sidebar-heading"><h2>Trò chuyện <span>3</span></h2><button aria-label="Thêm hội thoại"><MoreHorizontal size={19} /></button></div><label className="conversation-search"><Search size={16} /><input placeholder="Tìm trong hộp thư" value={search} onChange={(event) => setSearch(event.target.value)} /></label><div className="conversation-list">{visibleChats.map((chat) => <button className={`conversation-item ${chat.id === activeId ? 'conversation-active' : ''}`} key={chat.id} onClick={() => setActiveId(chat.id)}><span className={`avatar conversation-avatar avatar-tone-${chat.color}`}>{chat.initials}<i /></span><span className="conversation-copy"><span><strong>{chat.name}</strong><small>{chat.time}</small></span><span>{chat.lastMessage}</span><small className="conversation-product">{chat.product}</small></span>{chat.unread && <i className="unread-dot" />}</button>)}</div></aside>
        <section className="chat-panel"><header className="chat-header"><button className="chat-back"><ArrowLeft size={18} /></button><span className={`avatar avatar-tone-${activeChat.color}`}>{activeChat.initials}</span><span className="chat-person"><strong>{activeChat.name}</strong><small>Đang hoạt động</small></span><div className="chat-header-actions"><button aria-label="Gọi điện"><Phone size={18} /></button><button aria-label="Tùy chọn"><MoreHorizontal size={19} /></button></div></header>
          <button className="chat-product-card"><img src={activeChat.productImage} alt={activeChat.product} /><span><small>ĐANG TRAO ĐỔI</small><strong>{activeChat.product}</strong><b>{activeChat.price}</b></span><span className="chat-product-link">Xem tin →</span></button>
          <div className="chat-messages"><div className="message-date">Hôm nay, 10:28</div><div className="message-bubble message-incoming">{activeChat.greeting}<small>10:28</small></div><div className="message-bubble message-outgoing">{activeChat.reply}<small>10:31 <span>✓✓</span></small></div>{sentMessages.map((text, index) => <div className="message-bubble message-outgoing" key={`${index}-${text}`}>{text}<small>Vừa xong <span>✓✓</span></small></div>)}</div>
          <form className="chat-compose" onSubmit={sendMessage}><div className="chat-compose-tools"><button type="button" aria-label="Gửi ảnh"><Image size={18} /></button><button type="button" aria-label="Chọn biểu tượng"><Smile size={18} /></button></div><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Viết tin nhắn..." aria-label="Nội dung tin nhắn" /><button className="send-message-button" type="submit" disabled={!message.trim()} aria-label="Gửi tin nhắn"><Send size={17} /></button></form>
        </section>
      </div>
    </div>
  )
}
