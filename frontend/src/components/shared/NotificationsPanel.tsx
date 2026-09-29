import { Bell, CheckCheck, Clock3 } from 'lucide-react'
import type { MarketplaceNotification } from '../../types/marketplace'

type NotificationsPanelProps = {
  notifications: MarketplaceNotification[]
  onMarkRead: () => void
}

function formatTime(value: string) {
  const time = new Date(value)
  if (Number.isNaN(time.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(time)
}

export function NotificationsPanel({ notifications, onMarkRead }: NotificationsPanelProps) {
  return (
    <section className="workspace-section notification-workspace">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">CẬP NHẬT MỚI NHẤT</p>
          <h1>Thông báo</h1>
          <p className="section-subtitle">Mọi thay đổi về hồ sơ và công việc của bạn, ở cùng một nơi.</p>
        </div>
        {notifications.some((item) => !item.read) && (
          <button className="quiet-button" type="button" onClick={onMarkRead}><CheckCheck size={16} /> Đánh dấu đã đọc</button>
        )}
      </div>
      {notifications.length ? (
        <div className="notification-list">
          {notifications.map((notification) => (
            <article className={`notification-item ${notification.read ? '' : 'unread'}`} key={notification.id}>
              <span className="notification-symbol"><Bell size={18} /></span>
              <div className="notification-copy">
                <div className="notification-title-row"><h2>{notification.title}</h2>{!notification.read && <span className="unread-dot" />}</div>
                <p>{notification.message}</p>
                <span className="notification-time"><Clock3 size={13} /> {formatTime(notification.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state"><span className="empty-icon"><Bell size={21} /></span><h2>Chưa có thông báo mới</h2><p>Khi có cập nhật về công việc hoặc hồ sơ, thông tin sẽ xuất hiện ở đây.</p></div>
      )}
    </section>
  )
}