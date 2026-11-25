import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Check, ChevronDown, ChevronRight, CircleAlert, FolderTree, LayoutDashboard, List, LockKeyhole, Search, ShieldCheck, Users, X } from 'lucide-react'
import { ChoHoiWordmark } from '../components/ChoHoiWordmark'
import { useAppDialog } from '../components/AppDialogContext'
import type { Listing, ListingStatus } from '../domain/Listing'
import { categories } from '../data/categories'
import { formatImageUrl } from '../services/ImageUrl'
import type { AdminStats, AdminUser, AdminUserStatus } from '../services/MarketplaceApi'

interface AdminPageProps {
  listings: Listing[]
  onStatusChange: (id: string, status: ListingStatus, reason?: string) => void
  onOpen: (listing: Listing) => void
  onExit: () => void
  onLoadStats: (from: string, to: string) => Promise<AdminStats>
  onLoadUsers: () => Promise<AdminUser[]>
  onUserStatusChange: (id: number, status: AdminUserStatus) => Promise<AdminUser>
}

type AdminTab = 'overview' | 'listings' | 'review' | 'categories' | 'reports' | 'users'
type DateRange = 'today' | '7days' | '30days' | '90days' | 'custom'

function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const adminNavigation: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'listings', label: 'Tin hiển thị', icon: List },
  { id: 'review', label: 'Duyệt tin', icon: ShieldCheck },
  { id: 'categories', label: 'Danh mục & thuộc tính', icon: FolderTree },
  { id: 'reports', label: 'Báo cáo vi phạm', icon: CircleAlert },
  { id: 'users', label: 'Người dùng', icon: Users },
]

const adminReports = [
  ['Trần Thị Bích', 'Tin: Laptop Dell XPS', 'Nghi ngờ lừa đảo'],
  ['Lê Văn Cường', 'Người dùng: Phạm D.', 'Spam / làm phiền'],
  ['Nguyễn Hà', 'Tin: iPhone 13 Pro', 'Sai thông tin sản phẩm'],
] as const

export function AdminPage({ listings, onStatusChange, onOpen, onExit, onLoadStats, onLoadUsers, onUserStatusChange }: AdminPageProps) {
  const { showAlert } = useAppDialog()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [categoryNames, setCategoryNames] = useState(categories.map((item) => item.name))
  const [newCategory, setNewCategory] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({})
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [userActionError, setUserActionError] = useState('')
  const [userActionId, setUserActionId] = useState<number | null>(null)
  const [usersReload, setUsersReload] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const [dateRange, setDateRange] = useState<DateRange>('30days')
  const [customFrom, setCustomFrom] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 29)
    return formatDateInput(date)
  })
  const [customTo, setCustomTo] = useState(() => formatDateInput(new Date()))
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsError, setStatsError] = useState('')
  const [statsUpdatedAt, setStatsUpdatedAt] = useState<Date | null>(null)
  const [statsRetry, setStatsRetry] = useState(0)
  const pendingListings = useMemo(() => listings.filter((item) => item.status === 'PENDING'), [listings])
  const activeListings = useMemo(() => listings.filter((item) => item.status === 'ACTIVE'), [listings])
  const today = formatDateInput(now)
  const dateBounds = useMemo(() => {
    if (dateRange === 'custom') {
      return customFrom && customTo && customFrom <= customTo
        ? { from: customFrom, to: customTo }
        : null
    }

    const [year, month, day] = today.split('-').map(Number)
    const end = new Date(year, month - 1, day)
    const days = dateRange === 'today' ? 1 : Number.parseInt(dateRange, 10)
    const start = new Date(end)
    start.setDate(start.getDate() - days + 1)
    return { from: formatDateInput(start), to: formatDateInput(end) }
  }, [customFrom, customTo, dateRange, today])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!dateBounds) return
    let active = true
    const refreshStats = async () => {
      try {
        const nextStats = await onLoadStats(dateBounds.from, dateBounds.to)
        if (!active) return
        setStats(nextStats)
        setStatsError('')
        setStatsUpdatedAt(new Date())
      } catch (error) {
        if (!active) return
        setStatsError(error instanceof Error ? error.message : 'Không thể tải số liệu quản trị.')
      }
    }
    void refreshStats()
    const timer = window.setInterval(() => void refreshStats(), 30_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [dateBounds, onLoadStats, statsRetry])

  useEffect(() => {
    if (activeTab !== 'users') return
    let active = true
    async function loadUsers() {
      setUsersLoading(true)
      setUsersError('')
      try {
        const users = await onLoadUsers()
        if (active) setAdminUsers(users)
      } catch (error) {
        if (active) setUsersError(error instanceof Error ? error.message : 'Không thể tải danh sách người dùng.')
      } finally {
        if (active) setUsersLoading(false)
      }
    }
    void loadUsers()
    return () => {
      active = false
    }
  }, [activeTab, onLoadUsers, usersReload])

  const greeting = now.getHours() < 12 ? 'sáng' : now.getHours() < 18 ? 'chiều' : 'tối'
  const dateLabel = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const dateRangeLabel = dateRange === 'today'
    ? 'Hôm nay'
    : dateRange === 'custom'
      ? 'Tùy chỉnh'
      : `${dateRange.slice(0, -4)} ngày qua`

  function addCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = newCategory.trim()
    if (!name || categoryNames.includes(name)) return
    setCategoryNames((current) => [...current, name])
    setNewCategory('')
  }

  async function changeUserStatus(user: AdminUser) {
    const status: AdminUserStatus = user.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED'
    setUserActionId(user.id)
    setUserActionError('')
    try {
      const updatedUser = await onUserStatusChange(user.id, status)
      setAdminUsers((current) => current.map((item) => item.id === user.id ? updatedUser : item))
    } catch (error) {
      setUserActionError(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái người dùng.')
    } finally {
      setUserActionId(null)
    }
  }

  return (
    <div className="admin-app admin-app-standalone">
      <aside className="admin-sidebar"><div className="admin-brand"><span className="brand-icon"><ShieldCheck size={19} /></span><span className="admin-brand-copy"><ChoHoiWordmark className="admin-wordmark" /><small>TRUNG TÂM QUẢN TRỊ</small></span></div><div className="admin-nav-label">KHÔNG GIAN LÀM VIỆC</div><nav>{adminNavigation.map(({ id, label, icon: Icon }) => <button key={id} className={activeTab === id ? 'admin-nav-active' : ''} onClick={() => setActiveTab(id)}><Icon size={17} />{label}{id === 'review' && pendingListings.length > 0 && <span className="admin-nav-count">{pendingListings.length}</span>}</button>)}</nav><div className="admin-sidebar-bottom"><span className="admin-avatar">AD</span><span><strong>Quản trị viên</strong><small>admin@chohoi.vn</small></span><ChevronDown size={15} /></div></aside>
      <section className="admin-content"><header className="admin-topbar"><div><button className="admin-home-link" onClick={onExit}>Chợ Hời</button><ChevronRight size={14} /><strong>{adminNavigation.find((item) => item.id === activeTab)?.label}</strong></div><div className="admin-topbar-profile"><span className="admin-status-dot" /> Hệ thống đang hoạt động <span className="admin-avatar admin-avatar-small">AD</span></div></header>
        <div className="admin-main">
          {activeTab === 'overview' && <>
            <div className="admin-page-heading">
              <div><span className="section-eyebrow">{dateLabel}</span><h1>Chào buổi {greeting}, Admin 👋</h1><p>Tổng quan hoạt động trên Chợ Hời hôm nay.</p></div>
              <div className="admin-date-controls">
                <label className="button-secondary admin-date-filter"><BarChart3 size={15} /><select aria-label="Lọc số liệu theo thời gian" value={dateRange} onChange={(event) => setDateRange(event.target.value as DateRange)}><option value="today">Hôm nay</option><option value="7days">7 ngày qua</option><option value="30days">30 ngày qua</option><option value="90days">90 ngày qua</option><option value="custom">Tùy chỉnh</option></select><ChevronDown size={14} /></label>
                {dateRange === 'custom' && <div className="admin-custom-dates"><label>Từ <input aria-label="Từ ngày" type="date" value={customFrom} max={customTo || undefined} onChange={(event) => setCustomFrom(event.target.value)} /></label><label>Đến <input aria-label="Đến ngày" type="date" value={customTo} min={customFrom || undefined} onChange={(event) => setCustomTo(event.target.value)} /></label></div>}
              </div>
            </div>
            {statsError && <div className="admin-stats-error" role="alert">Không thể cập nhật số liệu: {statsError}<button onClick={() => setStatsRetry((value) => value + 1)}>Thử lại</button></div>}
            {!dateBounds && <div className="admin-stats-error" role="alert">Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.</div>}
            <div className="admin-stat-grid">
              {[
                { label: 'Tổng tin hiển thị', value: dateBounds ? stats?.activeListings.toLocaleString('vi-VN') ?? '—' : '—', change: dateRangeLabel, icon: BarChart3, tone: 'green', tab: 'listings' as const },
                { label: 'Chờ duyệt', value: dateBounds ? stats?.pendingListings.toLocaleString('vi-VN') ?? '—' : '—', change: dateRangeLabel, icon: ShieldCheck, tone: 'orange', tab: 'review' as const },
                { label: 'Người dùng', value: dateBounds ? stats?.users.toLocaleString('vi-VN') ?? '—' : '—', change: dateRangeLabel, icon: Users, tone: 'blue', tab: 'users' as const },
                { label: 'Báo cáo mới', value: adminReports.length.toLocaleString('vi-VN'), change: 'Cần xem xét', icon: CircleAlert, tone: 'red', tab: 'reports' as const },
              ].map(({ label, value, change, icon: Icon, tone, tab }) => <button type="button" className="admin-stat-card" key={label} onClick={() => setActiveTab(tab)}><span className={`admin-stat-icon admin-stat-${tone}`}><Icon size={19} /></span><span>{label}</span><strong>{value}</strong><small>{change}</small></button>)}
            </div>
            <div className="admin-stats-updated" aria-live="polite"><span className="admin-status-dot" /> Đồng hồ trực tiếp: {formatTime(now)}{statsUpdatedAt && <> · Số liệu cập nhật lúc {formatTime(statsUpdatedAt)}</>}</div>
            <div className="admin-overview-grid">
              <section className="admin-panel">
                <div className="admin-panel-heading"><div><h2>Tin đăng gần đây</h2><p>Hoạt động mới nhất trên nền tảng.</p></div><button onClick={() => setActiveTab('listings')}>Xem tất cả <ChevronRight size={15} /></button></div>
                <div className="admin-mini-list">{listings.filter((item) => item.status === 'PENDING' || item.status === 'ACTIVE').slice(0, 5).map((listing) => <div key={listing.id}><img src={formatImageUrl(listing.image, 400)} alt="" /><span><strong>{listing.title}</strong><small>{listing.seller} · {listing.category}</small></span><span className={`status-pill status-${listing.status.toLowerCase()}`}><i />{listing.status === 'PENDING' ? 'Chờ duyệt' : 'Đang hiển thị'}</span></div>)}</div>
              </section>
              <section className="admin-panel admin-quick-panel">
                <div className="admin-panel-heading"><div><h2>Việc cần làm</h2><p>Các mục đang chờ bạn xử lý.</p></div></div>
                <button onClick={() => setActiveTab('review')}><span className="quick-task-icon"><ShieldCheck size={18} /></span><span><strong>Duyệt tin đăng mới</strong><small>{pendingListings.length} tin chờ kiểm duyệt</small></span><ChevronRight size={16} /></button>
                <button onClick={() => setActiveTab('reports')}><span className="quick-task-icon quick-task-report"><CircleAlert size={18} /></span><span><strong>Xem báo cáo vi phạm</strong><small>{adminReports.length} báo cáo cần xem xét</small></span><ChevronRight size={16} /></button>
                <button onClick={() => setActiveTab('users')}><span className="quick-task-icon quick-task-users"><Users size={18} /></span><span><strong>Quản lý người dùng</strong><small>Theo dõi tài khoản thành viên</small></span><ChevronRight size={16} /></button>
              </section>
            </div>
          </>}

          {activeTab === 'listings' && <>
            <div className="admin-page-heading"><div><span className="section-eyebrow">DANH SÁCH TOÀN BỘ</span><h1>Tin đang hiển thị</h1><p>{activeListings.length} tin đang công khai trên Chợ Hời.</p></div><span className="pending-count">{activeListings.length} tin</span></div>
            <div className="admin-panel report-table">
              <div className="admin-table-heading listing-admin-row"><span>TIN ĐĂNG</span><span>NGƯỜI BÁN</span><span>ĐỊA ĐIỂM</span><span>GIÁ</span><span>CHI TIẾT</span></div>
              {activeListings.map((listing) => <div className="admin-table-row listing-admin-row" key={listing.id}><span className="listing-admin-title"><img src={formatImageUrl(listing.image, 400)} alt="" /><span><strong>{listing.title}</strong><small>{listing.category}</small></span></span><span>{listing.seller}</span><span>{listing.location}</span><strong>{listing.priceLabel}</strong><button className="review-detail-link" onClick={() => onOpen(listing)}>Xem tin</button></div>)}
              {!activeListings.length && <div className="empty-state"><h3>Chưa có tin đang hiển thị</h3><p>Các tin được duyệt sẽ xuất hiện ở đây.</p></div>}
            </div>
          </>}

          {activeTab === 'review' && <><div className="admin-page-heading"><div><span className="section-eyebrow">KIỂM DUYỆT NỘI DUNG</span><h1>Hàng đợi duyệt tin</h1><p>Kiểm tra kỹ thông tin trước khi tin được hiển thị công khai.</p></div><span className="pending-count">{pendingListings.length} tin đang chờ</span></div><div className="review-queue">{pendingListings.map((listing) => <article className="review-queue-card" key={listing.id}><button className="review-queue-image" onClick={() => onOpen(listing)}>          <img src={formatImageUrl(listing.image, 400)} alt={listing.title} /></button><div className="review-queue-info"><span className="review-queue-category">{listing.category} · {listing.conditionLabel}</span><button className="review-queue-title" onClick={() => onOpen(listing)}>{listing.title}</button><strong>{listing.priceLabel}</strong><span>Người đăng: {listing.seller} · {listing.location}</span><p>{listing.description}</p></div><div className="review-queue-actions"><button className="approve-button" onClick={() => onStatusChange(listing.id, 'ACTIVE')}><Check size={16} /> Duyệt tin</button><input aria-label={`Lý do từ chối ${listing.title}`} placeholder="Lý do từ chối..." value={rejectReasons[listing.id] ?? ''} onChange={(event) => setRejectReasons((current) => ({ ...current, [listing.id]: event.target.value }))} /><button className="reject-button" disabled={!rejectReasons[listing.id]?.trim()} onClick={() => onStatusChange(listing.id, 'REJECTED', rejectReasons[listing.id])}><X size={16} /> Từ chối</button><button className="review-detail-link" onClick={() => onOpen(listing)}>Xem chi tiết</button></div></article>)}{!pendingListings.length && <div className="empty-state"><span>✓</span><h3>Không còn tin chờ duyệt</h3><p>Hàng đợi của bạn đã được xử lý hết.</p></div>}</div></>}

          {activeTab === 'categories' && <><div className="admin-page-heading"><div><span className="section-eyebrow">CẤU TRÚC NỘI DUNG</span><h1>Danh mục & thuộc tính</h1><p>Quản lý danh mục để người mua dễ tìm đúng món đồ.</p></div><button className="button-primary" onClick={() => document.getElementById('new-category')?.focus()}>+ Thêm danh mục</button></div><div className="category-admin-layout"><section className="admin-panel category-tree"><div className="admin-panel-heading"><div><h2>Cây danh mục</h2><p>{categoryNames.length} danh mục đang hoạt động</p></div></div>{categoryNames.map((name, index) => <button className="category-tree-item" key={name}><ChevronDown size={14} /><span className={`tree-category-dot tree-dot-${index % 5}`} />{name}<span className="category-tree-count">{[24, 18, 12, 16, 11, 8, 6, 10][index % 8]}</span></button>)}<form className="add-category-form" onSubmit={addCategory}><input id="new-category" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Tên danh mục mới" /><button type="submit">Thêm</button></form></section><section className="admin-panel attributes-panel"><div className="admin-panel-heading"><div><h2>Thuộc tính danh mục</h2><p>Thiết lập trường thông tin cho Điện tử.</p></div><button className="button-secondary">+ Thuộc tính</button></div><div className="attributes-table"><div className="attributes-row attributes-head"><span>MÃ</span><span>TÊN HIỂN THỊ</span><span>KIỂU</span><span>LỌC</span></div>{[['brand', 'Hãng', 'SELECT'], ['storage', 'Dung lượng', 'SELECT'], ['warranty', 'Bảo hành', 'NUMBER'], ['color', 'Màu sắc', 'TEXT']].map(([code, name, type]) => <div className="attributes-row" key={code}><code>{code}</code><strong>{name}</strong><span>{type}</span><span><Check size={15} /></span></div>)}</div></section></div></>}

          {activeTab === 'reports' && <>
            <div className="admin-page-heading"><div><span className="section-eyebrow">AN TOÀN CỘNG ĐỒNG</span><h1>Báo cáo vi phạm</h1><p>Toàn bộ báo cáo hiện có để quản trị viên xem xét.</p></div><span className="pending-count">{adminReports.length} báo cáo</span></div>
            <div className="admin-panel report-table">
              <div className="admin-table-heading"><span>NGƯỜI BÁO CÁO</span><span>NỘI DUNG</span><span>LÝ DO</span><span>TRẠNG THÁI</span><span>THAO TÁC</span></div>
              {adminReports.map(([reporter, target, reason], index) => <div className="admin-table-row" key={reporter}><strong>{reporter}</strong><span>{target}</span><span>{reason}</span><span className="report-open-status">Chưa xử lý</span><div className="report-actions"><button onClick={() => void showAlert('Đã ghi nhận xử lý báo cáo.')}>Bỏ qua</button><button className="report-resolve" onClick={() => void showAlert('Đã gỡ nội dung được báo cáo.')}>{index === 1 ? <LockKeyhole size={13} /> : <X size={13} />}{index === 1 ? 'Khóa TK' : 'Gỡ tin'}</button></div></div>)}
            </div>
          </>}

          {activeTab === 'users' && <>
            <div className="admin-page-heading"><div><span className="section-eyebrow">THÀNH VIÊN CHỢ HỜI</span><h1>Quản lý người dùng</h1><p>{adminUsers.length} tài khoản thành viên và quản trị viên.</p></div><label className="admin-user-search"><Search size={16} /><input placeholder="Tìm tên hoặc email" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} /></label></div>
            {usersError && <div className="admin-stats-error" role="alert">Không thể tải người dùng: {usersError}<button onClick={() => setUsersReload((value) => value + 1)}>Thử lại</button></div>}
            {userActionError && <div className="admin-stats-error" role="alert">{userActionError}</div>}
            <div className="admin-panel report-table">
              <div className="admin-table-heading user-table-heading"><span>THÀNH VIÊN</span><span>EMAIL</span><span>VAI TRÒ</span><span>TRẠNG THÁI</span><span>TIN ĐĂNG</span><span>THAO TÁC</span></div>
              {usersLoading && <div className="empty-state"><p>Đang tải danh sách người dùng...</p></div>}
              {!usersLoading && adminUsers.filter((user) => `${user.fullName} ${user.email}`.toLocaleLowerCase('vi').includes(userSearch.toLocaleLowerCase('vi'))).map((user) => <div className="admin-table-row user-table-row" key={user.id}><strong>{user.fullName}</strong><span>{user.email}</span><span>{user.role === 'ADMIN' ? 'Quản trị viên' : 'Thành viên'}</span><span className={user.status === 'LOCKED' ? 'user-locked' : 'user-active'}>{user.status === 'LOCKED' ? 'Đã khóa' : 'Hoạt động'}</span><span>{user.listingCount}</span><button className="user-status-button" disabled={userActionId !== null || (user.role === 'ADMIN' && user.status === 'ACTIVE')} onClick={() => void changeUserStatus(user)}>{userActionId === user.id ? 'Đang lưu...' : user.status === 'LOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}</button></div>)}
              {!usersLoading && !usersError && adminUsers.filter((user) => `${user.fullName} ${user.email}`.toLocaleLowerCase('vi').includes(userSearch.toLocaleLowerCase('vi'))).length === 0 && <div className="empty-state"><h3>Không tìm thấy người dùng</h3><p>Hãy thử tên hoặc email khác.</p></div>}
            </div>
          </>}
        </div>
      </section>
    </div>
  )
}
