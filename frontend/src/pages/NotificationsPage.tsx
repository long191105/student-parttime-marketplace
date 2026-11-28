import { Bell, Check, MessageCircle, ShieldCheck } from 'lucide-react'
import type { UserNotification } from '../services/MarketplaceApi'

interface NotificationsPageProps {
  notifications: UserNotification[]
  unreadCount: number
  loading: boolean
  error: string
  onOpen: (notification: UserNotification) => void
  onMarkAllRead: () => void
  onRetry: () => void
}

function notificationStyle(type: UserNotification['type']) {
  if (type === 'NEW_MESSAGE') {
    return { icon: MessageCircle, tone: 'notification-orange' }
  }
  if (type === 'ACCOUNT_STATUS') {
    return { icon: ShieldCheck, tone: 'notification-yellow' }
  }
  return {
    icon: ShieldCheck,
    tone: type === 'LISTING_APPROVED' || type === 'REPORT_STATUS' ? 'notification-green' : 'notification-yellow',
  }
}

function formatCreatedAt(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('vi-VN')
}

export function NotificationsPage({
  notifications,
  unreadCount,
  loading,
  error,
  onOpen,
  onMarkAllRead,
  onRetry,
}: NotificationsPageProps) {
  return (
    <div className="notifications-page">
      <div className="workspace-heading">
        <div><span className="section-eyebrow">CẬP NHẬT TỪ CHỢ HỜI</span><h1>Thông báo</h1><p>Tin nhắn, trạng thái tin đăng và kết quả xử lý báo cáo của bạn.</p></div>
        <button className="notifications-read-all" onClick={onMarkAllRead} disabled={unreadCount === 0}>
          <Check size={15} /> Đánh dấu đã đọc
        </button>
      </div>
      {error && <div className="notification-error" role="alert">Không thể tải thông báo: {error}<button onClick={onRetry}>Thử lại</button></div>}
      {loading && notifications.length === 0 && <div className="empty-state"><p>Đang tải thông báo...</p></div>}
      {!loading && !error && notifications.length === 0 && <div className="empty-state"><span><Bell size={24} /></span><h3>Chưa có thông báo</h3><p>Tin nhắn, trạng thái duyệt tin và kết quả báo cáo sẽ xuất hiện tại đây.</p></div>}
      {notifications.length > 0 && <div className="notifications-list">
        {notifications.map((notification) => {
          const { icon: Icon, tone } = notificationStyle(notification.type)
          return <button
            className={`notification-item ${notification.read ? '' : 'notification-unread'}`}
            key={notification.id}
            onClick={() => onOpen(notification)}
          >
            <span className={`notification-icon-tile ${tone}`}><Icon size={18} /></span>
            <span className="notification-copy">
              <strong>{notification.title}</strong>
              <span>{notification.detail}</span>
              <small>{formatCreatedAt(notification.createdAt)}</small>
            </span>
            {!notification.read && <i className="notification-unread-dot" />}
          </button>
        })}
      </div>}
      <div className="notification-settings"><Bell size={16} /><span><strong>Thông báo đang được bật</strong><small>Bạn sẽ nhận cập nhật tin nhắn, trạng thái tin đăng và báo cáo vi phạm.</small></span></div>
    </div>
  )
}
