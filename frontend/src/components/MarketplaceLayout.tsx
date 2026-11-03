import { useState } from 'react'
import { Bell, ChevronDown, Heart, MapPin, Menu, MessageCircle, Plus, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { locations } from '../data/categories'
import type { AuthUser } from '../services/MarketplaceApi'

export type AppView = 'home' | 'search' | 'detail' | 'sell' | 'my-listings' | 'favorites' | 'messages' | 'notifications' | 'profile' | 'admin' | 'auth'

interface MarketplaceLayoutProps {
  children: React.ReactNode
  view: AppView
  query: string
  location: string
  onQueryChange: (value: string) => void
  onLocationChange: (value: string) => void
  onNavigate: (view: AppView) => void
  onSearch: () => void
  favoritesCount: number
  unreadCount: number
  user: AuthUser | null
}

export function MarketplaceLayout({
  children, view, query, location, onQueryChange, onLocationChange, onNavigate, onSearch, favoritesCount, unreadCount, user,
}: MarketplaceLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function navigate(nextView: AppView) {
    onNavigate(nextView)
    setMobileMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <div className="announcement">
        <span>Chợ Hời đang có hơn <strong>8.400 món đồ tốt</strong> chờ bạn khám phá</span>
        <button type="button" onClick={() => navigate('search')}>Tìm món đồ yêu thích <span aria-hidden="true">→</span></button>
      </div>
      <header className="site-header">
        <div className="header-main page-container">
          <button className="brand" type="button" onClick={() => navigate('home')} aria-label="Về trang chủ Chợ Hời">
            <span className="brand-icon"><ShoppingBag size={21} strokeWidth={2.2} /></span>
            <span>chợ<span>hời</span><small>MUA BÁN QUANH BẠN</small></span>
          </button>
          <label className="location-picker">
            <MapPin size={16} />
            <select aria-label="Khu vực" value={location} onChange={(event) => onLocationChange(event.target.value)}>
              {locations.map((item) => <option key={item}>{item}</option>)}
            </select>
            <ChevronDown size={14} />
          </label>
          <form className="header-search" onSubmit={(event) => { event.preventDefault(); onSearch() }}>
            <Search size={19} />
            <input aria-label="Tìm tin rao" placeholder="Tìm iPhone, xe máy, đồ gia dụng..." value={query} onChange={(event) => onQueryChange(event.target.value)} />
            <button type="submit">Tìm kiếm</button>
          </form>
          <div className="header-actions">
            <button className="header-icon" type="button" aria-label="Tin yêu thích" onClick={() => navigate('favorites')}><Heart size={20} /><span>Yêu thích</span>{favoritesCount > 0 && <b>{favoritesCount}</b>}</button>
            <button className="header-icon" type="button" aria-label="Hộp thư" onClick={() => navigate('messages')}><MessageCircle size={20} /><span>Tin nhắn</span>{unreadCount > 0 && <b>{unreadCount}</b>}</button>
            <button className="header-icon notification-icon" type="button" aria-label="Thông báo" onClick={() => navigate('notifications')}><Bell size={20} /><i /></button>
            <button className="profile-menu" type="button" onClick={() => navigate(user ? 'profile' : 'auth')}><span className="avatar avatar-header">{user ? user.fullName.split(/\s+/).slice(-2).map((part) => part[0]).join('').toLocaleUpperCase('vi') : <UserRound size={15} />}</span><span className="profile-menu-name">{user ? user.fullName : 'Đăng nhập'}</span><ChevronDown size={14} /></button>
          </div>
          <button className="mobile-menu-toggle" type="button" aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X /> : <Menu />}</button>
        </div>
        <div className="header-bottom">
          <div className="page-container header-bottom-inner">
            <nav className={`main-nav ${mobileMenuOpen ? 'main-nav-open' : ''}`} aria-label="Điều hướng chính">
              <button className={view === 'home' || view === 'search' ? 'nav-active' : ''} onClick={() => navigate('home')}>Trang chủ</button>
              <button onClick={() => navigate('search')}>Khám phá</button>
              <button onClick={() => navigate('my-listings')}>Tin của tôi</button>
              <button onClick={() => navigate('messages')}>Hộp thư</button>
              <button onClick={() => navigate('admin')}>Quản trị</button>
              <button className="mobile-nav-only" onClick={() => navigate('profile')}>Tài khoản</button>
              <button className="mobile-nav-only" onClick={() => navigate('auth')}>Đăng xuất</button>
            </nav>
            <button className="sell-button" onClick={() => navigate('sell')}><Plus size={18} /> Đăng tin miễn phí</button>
          </div>
        </div>
      </header>
      <main className="page-container page-content">{children}</main>
      <footer className="site-footer">
        <div className="page-container footer-inner">
          <div className="footer-brand"><span className="brand-icon"><ShoppingBag size={19} /></span><strong>chợ<span>hời</span></strong><p>Món đồ tốt, tìm thấy quanh bạn.</p></div>
          <div><strong>Khám phá</strong><span>Đồ điện tử</span><span>Xe cộ</span><span>Đồ gia dụng</span></div>
          <div><strong>Hỗ trợ</strong><span>Hướng dẫn mua bán</span><span>Chính sách an toàn</span><span>Liên hệ với chúng tôi</span></div>
          <div className="footer-note">Mua bán gần nhà<br />Bắt đầu bằng một tin đăng tử tế.</div>
        </div>
        <div className="footer-bottom">© 2026 Chợ Hời · Mua bán gần nhà, an tâm hơn mỗi ngày</div>
      </footer>
      <nav className="mobile-bottom-nav" aria-label="Điều hướng di động">
        <button className={view === 'home' || view === 'search' ? 'mobile-nav-active' : ''} onClick={() => navigate('home')}><Search size={19} /><span>Khám phá</span></button>
        <button className={view === 'favorites' ? 'mobile-nav-active' : ''} onClick={() => navigate('favorites')}><Heart size={19} /><span>Đã lưu</span></button>
        <button className="mobile-create" onClick={() => navigate('sell')}><Plus size={21} /><span>Đăng tin</span></button>
        <button className={view === 'messages' ? 'mobile-nav-active' : ''} onClick={() => navigate('messages')}><MessageCircle size={19} /><span>Hộp thư</span></button>
        <button className={view === 'profile' ? 'mobile-nav-active' : ''} onClick={() => navigate('profile')}><UserRound size={19} /><span>Tôi</span></button>
      </nav>
    </div>
  )
}
