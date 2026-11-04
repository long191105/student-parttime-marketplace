import { Bell, Check, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'

interface NotificationsPageProps {
  onNavigate: (view: 'messages' | 'my-listings' | 'search') => void
}

const notifications = [
  { title: 'Tin nhắn mới từ Trần Thị Bích', detail: '“Chào bạn, chiếc iPhone còn không ạ?”', time: '5 phút trước', icon: MessageCircle, tone: 'notification-orange', view: 'messages' as const, unread: true },
  { title: 'Tin đăng đang chờ duyệt', detail: 'Máy ảnh film Canon AE-1 sẽ sớm được kiểm duyệt.', time: '1 giờ trước', icon: ShieldCheck, tone: 'notification-green', view: 'my-listings' as const, unread: true },
  { title: 'Món hời mới quanh bạn', detail: '12 tin đăng mới trong danh mục Điện tử.', time: 'Hôm qua', icon: Sparkles, tone: 'notification-yellow', view: 'search' as const, unread: false },
]

export function NotificationsPage({ onNavigate }: NotificationsPageProps) {
  return (
    <div className="notifications-page">
      <div className="workspace-heading"><div><span className="section-eyebrow">CẬP NHẬT TỪ CHỢ HỜI</span><h1>Thông báo</h1><p>Tin mới từ người bán và những hoạt động bạn quan tâm.</p></div><button className="notifications-read-all"><Check size={15} /> Đánh dấu đã đọc</button></div>
      <div className="notifications-list">{notifications.map(({ title, detail, time, icon: Icon, tone, view, unread }) => <button className={`notification-item ${unread ? 'notification-unread' : ''}`} key={title} onClick={() => onNavigate(view)}><span className={`notification-icon-tile ${tone}`}><Icon size={18} /></span><span className="notification-copy"><strong>{title}</strong><span>{detail}</span><small>{time}</small></span>{unread && <i className="notification-unread-dot" />}</button>)}</div>
      <div className="notification-settings"><Bell size={16} /><span><strong>Thông báo đang được bật</strong><small>Bạn sẽ nhận cập nhật tin nhắn và trạng thái tin đăng.</small></span></div>
    </div>
  )
}
