import { useEffect, useRef, useState } from 'react'
import { Bell, Bookmark, Check, ChevronDown, Heart, LogOut, MapPin, Menu, MessageCircle, Package, Plus, Search, ShieldCheck, ShoppingBag, UserRound, X } from 'lucide-react'
import { locations } from '../data/categories'
import type { AuthUser, UserNotification } from '../services/MarketplaceApi'
import { ChoHoiWordmark } from './ChoHoiWordmark'
import { FloatingPromotions } from './FloatingPromotions'
import { ScrollToTopButton } from './ScrollToTopButton'

export type AppView = 'home' | 'search' | 'detail' | 'sell' | 'my-listings' | 'favorites' | 'messages' | 'notifications' | 'profile' | 'check-in' | 'auth'

interface MarketplaceLayoutProps {
  children: React.ReactNode
  view: AppView
  query: string
  location: string
  onQueryChange: (value: string) => void
  onLocationChange: (value: string) => void
  onNavigate: (view: AppView) => void
  onStartNewListing: () => void
  onAdminNavigate: () => void
  onSearch: () => void
  onSignOut: () => void
  favoritesCount: number
  unreadCount: number
  notificationUnreadCount: number
  notifications: UserNotification[]
  onOpenNotification: (notification: UserNotification) => void
  onMarkAllNotificationsRead: () => void
  user: AuthUser | null
  authNotice: string
  onDismissAuthNotice: () => void
}

export function MarketplaceLayout({
  children, view, query, location, onQueryChange, onLocationChange, onNavigate, onStartNewListing, onAdminNavigate, onSearch, onSignOut, favoritesCount, unreadCount, notificationUnreadCount, notifications, onOpenNotification, onMarkAllNotificationsRead, user, authNotice, onDismissAuthNotice,
}: MarketplaceLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [locationMenuOpen, setLocationMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [homeHeaderCompact, setHomeHeaderCompact] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const accountTriggerRef = useRef<HTMLButtonElement>(null)
  const locationPickerRef = useRef<HTMLDivElement>(null)
  const locationTriggerRef = useRef<HTMLButtonElement>(null)
  const notificationMenuRef = useRef<HTMLDivElement>(null)
  const headerNotificationCount = notificationUnreadCount

  useEffect(() => {
    if (view !== 'home') return

    function updateHeader() {
      const isMobile = window.innerWidth <= 760
      const bannerHeight = isMobile
        ? window.innerWidth / 3
        : Math.min(Math.max(window.innerWidth * 0.27, 210), 420)
      const mobileSearchHeight = isMobile ? 54 : 0
      setHomeHeaderCompact(window.scrollY > bannerHeight + mobileSearchHeight)
    }
    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    window.addEventListener('resize', updateHeader)
    return () => {
      window.removeEventListener('scroll', updateHeader)
      window.removeEventListener('resize', updateHeader)
    }
  }, [view])

  useEffect(() => {
    if (!accountMenuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false)
        accountTriggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [accountMenuOpen])

  useEffect(() => {
    if (!locationMenuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !locationPickerRef.current?.contains(event.target)) {
        setLocationMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setLocationMenuOpen(false)
        locationTriggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [locationMenuOpen])

  useEffect(() => {
    if (!notificationsOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !notificationMenuRef.current?.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setNotificationsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [notificationsOpen])

  function navigate(nextView: AppView) {
    onNavigate(nextView)
    setMobileMenuOpen(false)
    setAccountMenuOpen(false)
    setNotificationsOpen(false)
  }

  function signOut() {
    setAccountMenuOpen(false)
    onSignOut()
  }

  return (
    <div className="app-shell">
      {view !== 'home' && (
        <div className="announcement">
          <span>Chợ Hời đang có hơn <strong>8.400 món đồ tốt</strong> chờ bạn khám phá</span>
          <button type="button" onClick={() => navigate('search')}>Tìm món đồ yêu thích <span aria-hidden="true">→</span></button>
        </div>
      )}
      {view === 'home' && homeHeaderCompact && <div className="home-header-placeholder" aria-hidden="true" />}
      <header className={`site-header${view === 'home' ? ' site-header-home' : ''}${view === 'home' && homeHeaderCompact ? ' site-header-home-compact' : ''}`}>
        {view === 'home' && <img className="home-banner-image" src="/banner.png" alt="" aria-hidden="true" />}
        <div className="header-main page-container">
          <button className="brand" type="button" onClick={() => navigate('home')} aria-label="Về trang chủ Chợ Hời">
            <img className="brand-logo-image" src="/favicon.png" alt="" />
            <span className="brand-copy"><ChoHoiWordmark /><small>MUA BÁN QUANH BẠN</small></span>
          </button>
          <form className="header-search" onSubmit={(event) => { event.preventDefault(); onSearch() }}>
            <Search size={19} />
            <input aria-label="Tìm tin rao" placeholder="Tìm sản phẩm..." value={query} onChange={(event) => onQueryChange(event.target.value)} />
            <div className="location-picker" ref={locationPickerRef}>
              <button
                className="location-picker-trigger"
                ref={locationTriggerRef}
                type="button"
                aria-label={`Chọn khu vực, hiện tại ${location}`}
                aria-haspopup="listbox"
                aria-expanded={locationMenuOpen}
                onClick={() => setLocationMenuOpen((open) => !open)}
              >
                <MapPin size={17} />
                <span>{location}</span>
                <ChevronDown size={14} />
              </button>
              {locationMenuOpen && (
                <div className="location-options" role="listbox" aria-label="Chọn tỉnh hoặc thành phố">
                  {locations.map((item) => (
                    <button
                      className={location === item ? 'location-option location-option-selected' : 'location-option'}
                      key={item}
                      type="button"
                      role="option"
                      aria-selected={location === item}
                      onClick={() => {
                        onLocationChange(item)
                        setLocationMenuOpen(false)
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="submit">Tìm kiếm</button>
          </form>
          <div className="header-actions">
            <button className="header-icon" type="button" aria-label="Tin yêu thích" onClick={() => navigate('favorites')}><Heart size={20} /><span>Yêu thích</span>{favoritesCount > 0 && <b>{favoritesCount}</b>}</button>
            <button className="header-icon" type="button" aria-label="Hộp thư" onClick={() => navigate('messages')}><MessageCircle size={20} /><span>Tin nhắn</span>{unreadCount > 0 && <b>{unreadCount}</b>}</button>
            <div className="notification-menu-wrap" ref={notificationMenuRef}>
              <button
                className="header-icon notification-icon"
                type="button"
                aria-label={headerNotificationCount > 0 ? `Thông báo, ${headerNotificationCount} chưa đọc` : 'Thông báo'}
                aria-expanded={notificationsOpen}
                aria-haspopup="dialog"
                onClick={() => {
                  if (!user) {
                    navigate('notifications')
                    return
                  }
                  setAccountMenuOpen(false)
                  setNotificationsOpen((open) => !open)
                }}
              >
                <Bell size={20} />
                <span>Thông báo</span>
                {user && headerNotificationCount > 0 && <b>{Math.min(headerNotificationCount, 99)}{headerNotificationCount > 99 ? '+' : ''}</b>}
              </button>
              {notificationsOpen && <section className="notification-dropdown" role="dialog" aria-label="Thông báo mới">
                <div className="notification-dropdown-heading">
                  <strong>Thông báo</strong>
                  {notificationUnreadCount > 0 && <button type="button" onClick={onMarkAllNotificationsRead}><Check size={13} /> Đọc tất cả</button>}
                </div>
                {notifications.length > 0
                  ? <div className="header-notification-list">{notifications.slice(0, 5).map((notification) => {
                    const isMessage = notification.type === 'NEW_MESSAGE'
                    const Icon = isMessage ? MessageCircle : ShieldCheck
                    const tone = isMessage ? 'notification-orange' : notification.type === 'LISTING_APPROVED' ? 'notification-green' : 'notification-yellow'
                    return <button
                      type="button"
                      className={`notification-item header-notification-item${notification.read ? '' : ' notification-unread'}`}
                      key={notification.id}
                      onClick={() => {
                        setNotificationsOpen(false)
                        onOpenNotification(notification)
                      }}
                    >
                      <span className={`notification-icon-tile ${tone}`}><Icon size={16} /></span>
                      <span className="notification-copy">
                        <strong>{notification.title}</strong>
                        <span>{notification.detail}</span>
                        <small>{new Date(notification.createdAt).toLocaleString('vi-VN')}</small>
                      </span>
                      {!notification.read && <i className="notification-unread-dot" />}
                    </button>
                  })}</div>
                  : <div className="header-notification-empty">Chưa có thông báo nào.</div>}
                <button className="notification-view-all" type="button" onClick={() => navigate('notifications')}>Xem tất cả thông báo</button>
              </section>}
            </div>
            <div className="account-menu-wrap" ref={accountMenuRef}>
              <button
                className="profile-menu"
                ref={accountTriggerRef}
                type="button"
                aria-label={user ? `Tài khoản ${user.fullName}` : 'Đăng nhập'}
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                onClick={() => {
                  setNotificationsOpen(false)
                  setAccountMenuOpen((open) => !open)
                }}
              >
                <span className="avatar avatar-header">{user ? user.fullName.split(/\s+/).slice(-2).map((part) => part[0]).join('').toLocaleUpperCase('vi') : <UserRound size={15} />}</span>
                <span className="profile-menu-name">{user ? user.fullName : 'Đăng nhập'}</span>
                <ChevronDown size={14} />
              </button>
              {accountMenuOpen && (
                <section className="account-dropdown" aria-label="Menu tài khoản">
                  {user ? (
                    <>
                      <div className="account-dropdown-heading">
                        <span className="avatar account-dropdown-avatar">{user.fullName.split(/\s+/).slice(-2).map((part) => part[0]).join('').toLocaleUpperCase('vi')}</span>
                        <span className="account-dropdown-identity"><strong>{user.fullName}</strong><small>{user.email}</small></span>
                      </div>
                      <div className="account-dropdown-actions">
                        <button type="button" onClick={() => navigate('profile')}>Hồ sơ cá nhân</button>
                        <button type="button" onClick={onStartNewListing}><Plus size={15} /> Đăng tin</button>
                      </div>
                      <div className="account-dropdown-links" role="menu" aria-label="Tiện ích tài khoản">
                        <button type="button" role="menuitem" onClick={() => navigate('favorites')}><Heart size={17} /><span>Tin đã lưu</span><small>{favoritesCount}</small></button>
                        <button type="button" role="menuitem" onClick={() => navigate('my-listings')}><Package size={17} /><span>Tin của tôi</span><ChevronDown size={15} /></button>
                        <button type="button" role="menuitem" onClick={() => navigate('messages')}><MessageCircle size={17} /><span>Hộp thư</span>{unreadCount > 0 && <small>{unreadCount}</small>}</button>
                        <button type="button" role="menuitem" onClick={() => navigate('notifications')}><Bell size={17} /><span>Thông báo</span></button>
                      </div>
                      <button className="account-dropdown-signout" type="button" onClick={signOut}><LogOut size={16} /> Đăng xuất</button>
                    </>
                  ) : (
                    <div className="account-dropdown-guest">
                      <span className="account-dropdown-guest-icon"><Bookmark size={20} /></span>
                      <strong>Chào mừng đến với Chợ Hời</strong>
                      <p>Đăng nhập để quản lý tin đăng và lưu những món đồ bạn yêu thích.</p>
                      <button type="button" onClick={() => navigate('auth')}>Đăng nhập / Đăng ký</button>
                    </div>
                  )}
                </section>
              )}
            </div>
            <button className="sell-button" type="button" onClick={onStartNewListing}><Plus size={18} /> Đăng tin miễn phí</button>
            {authNotice && (
              <div className="toast-message auth-toast-message" role="status">
                {authNotice}
                <button type="button" onClick={onDismissAuthNotice} aria-label="Đóng thông báo">×</button>
              </div>
            )}
          </div>
          <button className="mobile-menu-toggle" type="button" aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X /> : <Menu />}</button>
        </div>
        <div className="header-bottom">
          <div className="page-container header-bottom-inner">
            <nav className={`main-nav ${mobileMenuOpen ? 'main-nav-open' : ''}`} aria-label="Điều hướng chính">
              <button type="button" className={view === 'home' ? 'nav-active' : ''} aria-current={view === 'home' ? 'page' : undefined} onClick={() => navigate('home')}>Trang chủ</button>
              <button type="button" className={view === 'search' || view === 'detail' ? 'nav-active' : ''} aria-current={view === 'search' || view === 'detail' ? 'page' : undefined} onClick={() => navigate('search')}>Khám phá</button>
              <button type="button" className={view === 'my-listings' ? 'nav-active' : ''} aria-current={view === 'my-listings' ? 'page' : undefined} onClick={() => navigate('my-listings')}>Tin của tôi</button>
              <button type="button" className={view === 'messages' ? 'nav-active' : ''} aria-current={view === 'messages' ? 'page' : undefined} onClick={() => navigate('messages')}>Hộp thư</button>
              <button className="mobile-nav-only" onClick={() => navigate('notifications')}>Thông báo{notificationUnreadCount > 0 ? ` (${notificationUnreadCount})` : ''}</button>
              {user?.role === 'ADMIN' && <button onClick={() => { onAdminNavigate(); setMobileMenuOpen(false) }}>Quản trị</button>}
              <button className="mobile-nav-only" onClick={() => navigate('profile')}>Tài khoản</button>
              <button className="mobile-nav-only" onClick={() => navigate('auth')}>Đăng xuất</button>
            </nav>
          </div>
        </div>
        {authNotice && (
          <div className="toast-message auth-toast-message-mobile" role="status">
            {authNotice}
            <button type="button" onClick={onDismissAuthNotice} aria-label="Đóng thông báo">×</button>
          </div>
        )}
      </header>
      <main className="page-container page-content">{children}</main>
      <footer className="site-footer">
        <div className="page-container footer-inner">
          <div className="footer-brand"><span className="brand-icon"><ShoppingBag size={19} /></span><ChoHoiWordmark className="footer-wordmark" /><p>Món đồ tốt, tìm thấy quanh bạn.</p></div>
          <div><strong>Khám phá</strong><span>Đồ điện tử</span><span>Xe cộ</span><span>Đồ gia dụng</span></div>
          <div><strong>Hỗ trợ</strong><span>Hướng dẫn mua bán</span><span>Chính sách an toàn</span><span>Liên hệ với chúng tôi</span></div>
          <div className="footer-note">Mua bán gần nhà<br />Bắt đầu bằng một tin đăng tử tế.</div>
        </div>
        <div className="footer-bottom">© 2026 Chợ Hời · Mua bán gần nhà, an tâm hơn mỗi ngày</div>
      </footer>
      <nav className="mobile-bottom-nav" aria-label="Điều hướng di động">
        <button className={view === 'home' || view === 'search' ? 'mobile-nav-active' : ''} onClick={() => navigate('home')}><Search size={19} /><span>Khám phá</span></button>
        <button className={view === 'favorites' ? 'mobile-nav-active' : ''} onClick={() => navigate('favorites')}><Heart size={19} /><span>Đã lưu</span></button>
        <button className="mobile-create" onClick={onStartNewListing}><Plus size={21} /><span>Đăng tin</span></button>
        <button className={view === 'messages' ? 'mobile-nav-active' : ''} onClick={() => navigate('messages')}><MessageCircle size={19} /><span>Hộp thư</span></button>
        <button className={view === 'profile' ? 'mobile-nav-active' : ''} onClick={() => navigate('profile')}><UserRound size={19} /><span>Tôi</span></button>
      </nav>
      <FloatingPromotions onNavigate={navigate} view={view} />
      <ScrollToTopButton />
    </div>
  )
}
