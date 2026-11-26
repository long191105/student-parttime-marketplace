import { useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3, Check, ChevronDown, ChevronRight, CircleAlert, FolderTree, LayoutDashboard, List, LockKeyhole, LogOut, Search, ShieldCheck, Users, X } from 'lucide-react'
import { ChoHoiWordmark } from '../components/ChoHoiWordmark'
import { ScrollToTopButton } from '../components/ScrollToTopButton'
import type { Listing, ListingStatus } from '../domain/Listing'
import { categories } from '../data/categories'
import { formatImageUrl } from '../services/ImageUrl'
import type { AdminCategory, AdminReport, AdminReportAction, AdminReportStatus, AdminStats, AdminUser, AdminUserStatus } from '../services/MarketplaceApi'

interface AdminPageProps {
  listings: Listing[]
  onStatusChange: (id: string, status: ListingStatus, reason?: string) => void
  onOpen: (listing: Listing) => void
  onExit: () => void
  onHome: () => void
  onSignOut: () => void
  onLoadStats: (from: string, to: string) => Promise<AdminStats>
  onLoadUsers: () => Promise<AdminUser[]>
  onUserStatusChange: (id: number, status: AdminUserStatus) => Promise<AdminUser>
  onLoadReports: () => Promise<AdminReport[]>
  onReportAction: (id: number, action: AdminReportAction) => Promise<AdminReport>
  onLoadCategories: () => Promise<AdminCategory[]>
  onCreateCategory: (name: string) => Promise<AdminCategory>
}

type AdminTab = 'overview' | 'listings' | 'review' | 'categories' | 'reports' | 'users'
type DateRange = 'today' | '7days' | '30days' | '90days' | 'custom'
type AttributeType = 'Lựa chọn' | 'Văn bản' | 'Số' | 'Có/Không'

interface CategoryAttribute {
  code: string
  label: string
  type: AttributeType
  required: boolean
  filterable: boolean
  description: string
}

const categoryAttributePresets: Record<string, CategoryAttribute[]> = {
  'Điện tử': [
    { code: 'brand', label: 'Thương hiệu', type: 'Lựa chọn', required: true, filterable: true, description: 'Hãng sản xuất của thiết bị.' },
    { code: 'model', label: 'Dòng sản phẩm', type: 'Văn bản', required: false, filterable: true, description: 'Tên model hoặc mã sản phẩm.' },
    { code: 'condition', label: 'Tình trạng', type: 'Lựa chọn', required: true, filterable: true, description: 'Mới hoặc đã qua sử dụng.' },
    { code: 'storage', label: 'Dung lượng', type: 'Lựa chọn', required: false, filterable: true, description: 'Dung lượng lưu trữ của thiết bị.' },
    { code: 'warranty', label: 'Bảo hành', type: 'Số', required: false, filterable: false, description: 'Số tháng bảo hành còn lại.' },
  ],
  'Xe cộ': [
    { code: 'vehicle_type', label: 'Loại phương tiện', type: 'Lựa chọn', required: true, filterable: true, description: 'Xe máy, ô tô hoặc xe đạp.' },
    { code: 'brand', label: 'Thương hiệu', type: 'Lựa chọn', required: true, filterable: true, description: 'Hãng sản xuất phương tiện.' },
    { code: 'year', label: 'Năm sản xuất', type: 'Số', required: false, filterable: true, description: 'Năm đăng ký hoặc sản xuất.' },
    { code: 'mileage', label: 'Số kilomet', type: 'Số', required: false, filterable: true, description: 'Quãng đường phương tiện đã đi.' },
  ],
  'Bất động sản': [
    { code: 'property_type', label: 'Loại bất động sản', type: 'Lựa chọn', required: true, filterable: true, description: 'Căn hộ, nhà ở, phòng trọ hoặc đất.' },
    { code: 'area', label: 'Diện tích', type: 'Số', required: true, filterable: true, description: 'Diện tích sử dụng tính theo m².' },
    { code: 'bedrooms', label: 'Số phòng ngủ', type: 'Số', required: false, filterable: true, description: 'Tổng số phòng ngủ.' },
    { code: 'legal_status', label: 'Pháp lý', type: 'Lựa chọn', required: false, filterable: true, description: 'Tình trạng giấy tờ pháp lý.' },
  ],
  'Thời trang': [
    { code: 'brand', label: 'Thương hiệu', type: 'Văn bản', required: false, filterable: true, description: 'Nhãn hiệu của sản phẩm.' },
    { code: 'size', label: 'Kích cỡ', type: 'Lựa chọn', required: false, filterable: true, description: 'Kích thước theo nhãn sản phẩm.' },
    { code: 'color', label: 'Màu sắc', type: 'Lựa chọn', required: false, filterable: true, description: 'Màu chính của sản phẩm.' },
    { code: 'condition', label: 'Tình trạng', type: 'Lựa chọn', required: true, filterable: true, description: 'Mới hoặc đã qua sử dụng.' },
  ],
  'Đồ gia dụng': [
    { code: 'brand', label: 'Thương hiệu', type: 'Văn bản', required: false, filterable: true, description: 'Hãng sản xuất đồ gia dụng.' },
    { code: 'material', label: 'Chất liệu', type: 'Văn bản', required: false, filterable: true, description: 'Chất liệu chính của sản phẩm.' },
    { code: 'condition', label: 'Tình trạng', type: 'Lựa chọn', required: true, filterable: true, description: 'Mới hoặc đã qua sử dụng.' },
  ],
  'Thú cưng': [
    { code: 'species', label: 'Loài vật', type: 'Lựa chọn', required: true, filterable: true, description: 'Chó, mèo hoặc loài vật khác.' },
    { code: 'age', label: 'Độ tuổi', type: 'Số', required: false, filterable: true, description: 'Tuổi của thú cưng tính theo tháng.' },
    { code: 'vaccinated', label: 'Đã tiêm phòng', type: 'Có/Không', required: false, filterable: true, description: 'Tình trạng tiêm phòng.' },
  ],
  'Khác': [
    { code: 'condition', label: 'Tình trạng', type: 'Lựa chọn', required: true, filterable: true, description: 'Mới hoặc đã qua sử dụng.' },
    { code: 'origin', label: 'Xuất xứ', type: 'Văn bản', required: false, filterable: true, description: 'Nguồn gốc của sản phẩm.' },
  ],
}

const categoryDescriptions: Record<string, string> = {
  'Điện tử': 'Điện thoại, máy tính, thiết bị gia dụng thông minh và phụ kiện công nghệ.',
  'Xe cộ': 'Xe máy, ô tô, xe đạp và các phương tiện đi lại.',
  'Bất động sản': 'Nhà ở, phòng trọ, căn hộ và mặt bằng cho thuê.',
  'Thời trang': 'Quần áo, giày dép, túi xách và phụ kiện.',
  'Đồ gia dụng': 'Đồ dùng nhà bếp, nội thất và thiết bị sinh hoạt.',
  'Thú cưng': 'Thú cưng, vật phẩm chăm sóc và phụ kiện.',
  'Khác': 'Các sản phẩm chưa thuộc nhóm danh mục cụ thể.',
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function reportStatusLabel(status: AdminReportStatus): string {
  if (status === 'OPEN') return 'Chưa xử lý'
  return status === 'DISMISSED' ? 'Đã bỏ qua' : 'Đã xử lý'
}

const adminNavigation: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'listings', label: 'Tin hiển thị', icon: List },
  { id: 'review', label: 'Duyệt tin', icon: ShieldCheck },
  { id: 'categories', label: 'Danh mục & thuộc tính', icon: FolderTree },
  { id: 'reports', label: 'Báo cáo vi phạm', icon: CircleAlert },
  { id: 'users', label: 'Người dùng', icon: Users },
]

export function AdminPage({ listings, onStatusChange, onOpen, onExit, onHome, onSignOut, onLoadStats, onLoadUsers, onUserStatusChange, onLoadReports, onReportAction, onLoadCategories, onCreateCategory }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const [adminCategories, setAdminCategories] = useState<AdminCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState('')
  const [categoryActionError, setCategoryActionError] = useState('')
  const [categoriesReload, setCategoriesReload] = useState(0)
  const [newCategory, setNewCategory] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({})
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [userActionError, setUserActionError] = useState('')
  const [userActionId, setUserActionId] = useState<number | null>(null)
  const [usersReload, setUsersReload] = useState(0)
  const [adminReports, setAdminReports] = useState<AdminReport[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState('')
  const [reportActionError, setReportActionError] = useState('')
  const [reportActionId, setReportActionId] = useState<number | null>(null)
  const [reportsReload, setReportsReload] = useState(0)
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
  const filteredCategories = useMemo(
    () => adminCategories.filter((category) => category.name.toLocaleLowerCase('vi').includes(categorySearch.toLocaleLowerCase('vi'))),
    [adminCategories, categorySearch],
  )
  const selectedCategoryAttributes = categoryAttributePresets[selectedCategory] ?? []
  const selectedCategoryListings = listings.filter((listing) => listing.category === selectedCategory)
  const selectedCategoryActiveCount = selectedCategoryListings.filter((listing) => listing.status === 'ACTIVE').length
  const selectedCategoryPendingCount = selectedCategoryListings.filter((listing) => listing.status === 'PENDING').length
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
    if (activeTab !== 'overview') return
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [activeTab])

  useEffect(() => {
    if (!accountMenuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setAccountMenuOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [accountMenuOpen])

  useEffect(() => {
    if (activeTab !== 'overview' || !dateBounds) return
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
  }, [activeTab, dateBounds, onLoadStats, statsRetry])

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

  useEffect(() => {
    if (activeTab !== 'reports') return
    let active = true
    async function loadReports() {
      setReportsLoading(true)
      setReportsError('')
      try {
        const reports = await onLoadReports()
        if (active) setAdminReports(reports)
      } catch (error) {
        if (active) setReportsError(error instanceof Error ? error.message : 'Không thể tải báo cáo vi phạm.')
      } finally {
        if (active) setReportsLoading(false)
      }
    }
    void loadReports()
    return () => {
      active = false
    }
  }, [activeTab, onLoadReports, reportsReload])

  useEffect(() => {
    if (activeTab !== 'categories') return
    let active = true
    async function loadCategories() {
      setCategoriesLoading(true)
      setCategoriesError('')
      try {
        const nextCategories = await onLoadCategories()
        if (!active) return
        setAdminCategories(nextCategories)
        setSelectedCategory((current) => nextCategories.some((category) => category.name === current)
          ? current
          : nextCategories[0]?.name ?? '')
      } catch (error) {
        if (active) setCategoriesError(error instanceof Error ? error.message : 'Không thể tải danh mục.')
      } finally {
        if (active) setCategoriesLoading(false)
      }
    }
    void loadCategories()
    return () => {
      active = false
    }
  }, [activeTab, categoriesReload, onLoadCategories])

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

  async function addCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = newCategory.trim()
    if (!name) return
    setCategoryActionError('')
    try {
      const createdCategory = await onCreateCategory(name)
      setAdminCategories((current) => [...current, createdCategory].sort((a, b) => a.name.localeCompare(b.name, 'vi')))
      setSelectedCategory(createdCategory.name)
      setNewCategory('')
    } catch (error) {
      setCategoryActionError(error instanceof Error ? error.message : 'Không thể tạo danh mục.')
    }
  }

  async function applyReportAction(reportId: number, action: AdminReportAction) {
    setReportActionId(reportId)
    setReportActionError('')
    try {
      const updatedReport = await onReportAction(reportId, action)
      setAdminReports((current) => current.map((report) => report.id === reportId ? updatedReport : report))
    } catch (error) {
      setReportActionError(error instanceof Error ? error.message : 'Không thể cập nhật báo cáo.')
    } finally {
      setReportActionId(null)
    }
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
    <>
    <div className="admin-app admin-app-standalone">
      <aside className="admin-sidebar"><button type="button" className="admin-brand" aria-label="Về trang chủ Chợ Hời" onClick={onHome}><span className="brand-icon"><ShieldCheck size={19} /></span><span className="admin-brand-copy"><ChoHoiWordmark className="admin-wordmark" /><small>TRUNG TÂM QUẢN TRỊ</small></span></button><div className="admin-nav-label">KHÔNG GIAN LÀM VIỆC</div><nav>{adminNavigation.map(({ id, label, icon: Icon }) => <button key={id} className={activeTab === id ? 'admin-nav-active' : ''} onClick={() => setActiveTab(id)}><Icon size={17} />{label}{id === 'review' && pendingListings.length > 0 && <span className="admin-nav-count">{pendingListings.length}</span>}</button>)}</nav><div className="admin-account-area" ref={accountMenuRef}><button type="button" className="admin-sidebar-bottom" aria-haspopup="menu" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)}><span className="admin-avatar">AD</span><span><strong>Quản trị viên</strong><small>admin@chohoi.vn</small></span><ChevronDown size={15} /></button>{accountMenuOpen && <div className="admin-account-menu" role="menu"><button type="button" role="menuitem" onClick={onSignOut}><LogOut size={15} />Đăng xuất</button></div>}</div></aside>
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
                { label: 'Báo cáo mới', value: dateBounds ? stats?.openReports?.toLocaleString('vi-VN') ?? '—' : '—', change: dateRangeLabel, icon: CircleAlert, tone: 'red', tab: 'reports' as const },
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
                <button onClick={() => setActiveTab('reports')}><span className="quick-task-icon quick-task-report"><CircleAlert size={18} /></span><span><strong>Xem báo cáo vi phạm</strong><small>{stats?.openReports?.toLocaleString('vi-VN') ?? '—'} báo cáo cần xem xét</small></span><ChevronRight size={16} /></button>
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

          {activeTab === 'categories' && <>
            <div className="admin-page-heading category-page-heading">
              <div><span className="section-eyebrow">CẤU TRÚC NỘI DUNG</span><h1>Danh mục & thuộc tính</h1><p>Tổ chức sản phẩm và chuẩn hóa thông tin để người mua tìm kiếm dễ dàng.</p></div>
              <button className="button-primary" onClick={() => document.getElementById('new-category')?.focus()}><FolderTree size={15} /> Tạo danh mục</button>
            </div>
            <div className="category-summary-grid">
              <article><span className="category-summary-icon"><FolderTree size={17} /></span><span>Danh mục đang hoạt động</span><strong>{adminCategories.length}</strong><small>Danh mục hiển thị trên sàn</small></article>
              <article><span className="category-summary-icon category-summary-listing"><List size={17} /></span><span>Tin đang hiển thị</span><strong>{activeListings.length.toLocaleString('vi-VN')}</strong><small>Tin đã được duyệt</small></article>
              <article><span className="category-summary-icon category-summary-fields"><Check size={17} /></span><span>Trường thuộc tính</span><strong>{Object.values(categoryAttributePresets).reduce((total, items) => total + items.length, 0)}</strong><small>Cấu hình tham khảo theo danh mục</small></article>
            </div>
            {categoriesError && <div className="admin-stats-error" role="alert">Không thể tải danh mục: {categoriesError}<button onClick={() => setCategoriesReload((value) => value + 1)}>Thử lại</button></div>}
            {categoryActionError && <div className="admin-stats-error" role="alert">{categoryActionError}</div>}
            <div className="category-management-layout">
              <section className="admin-panel category-directory">
                <div className="category-panel-heading"><div><span className="category-panel-kicker">DANH SÁCH</span><h2>Danh mục sản phẩm</h2><p>{adminCategories.length} danh mục · chọn để xem cấu hình</p></div><span className="category-count-badge">{adminCategories.length}</span></div>
                <label className="category-search"><Search size={15} /><input value={categorySearch} onChange={(event) => setCategorySearch(event.target.value)} placeholder="Tìm danh mục..." aria-label="Tìm danh mục" /></label>
                {categoriesLoading && <div className="category-directory-state">Đang tải danh mục...</div>}
                {!categoriesLoading && filteredCategories.map((category) => {
                  const CategoryIcon = categories.find((item) => item.name === category.name)?.icon ?? FolderTree
                  const categoryListingCount = listings.filter((listing) => listing.category === category.name).length
                  const selected = category.name === selectedCategory
                  return <button type="button" className={`category-directory-item${selected ? ' category-directory-item-selected' : ''}`} key={category.id} onClick={() => setSelectedCategory(category.name)} aria-pressed={selected}>
                    <span className="category-directory-icon"><CategoryIcon size={17} /></span>
                    <span className="category-directory-copy"><strong>{category.name}</strong><small>{category.slug}</small></span>
                    <span className="category-directory-count">{categoryListingCount}</span>
                    <ChevronRight size={15} />
                  </button>
                })}
                {!categoriesLoading && filteredCategories.length === 0 && <div className="category-directory-state">{adminCategories.length ? 'Không tìm thấy danh mục phù hợp.' : 'Chưa có danh mục nào.'}</div>}
                <form className="category-create-form" onSubmit={(event) => void addCategory(event)}>
                  <label htmlFor="new-category">Tạo danh mục mới</label>
                  <div><input id="new-category" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Ví dụ: Đồ thể thao" maxLength={80} /><button type="submit" disabled={!newCategory.trim()}><Check size={14} /> Thêm</button></div>
                  <small>Tên danh mục tối đa 80 ký tự.</small>
                </form>
              </section>
              <section className="admin-panel category-detail">
                {selectedCategory ? <>
                  {(() => {
                    const CategoryIcon = categories.find((item) => item.name === selectedCategory)?.icon ?? FolderTree
                    const category = adminCategories.find((item) => item.name === selectedCategory)
                    return <div className="category-detail-heading">
                      <span className="category-detail-icon"><CategoryIcon size={21} /></span>
                      <div><span className="category-panel-kicker">CHI TIẾT DANH MỤC</span><h2>{selectedCategory}</h2><p>{categoryDescriptions[selectedCategory] ?? 'Danh mục sản phẩm trên Chợ Hời.'}</p></div>
                      <span className="category-active-badge"><i /> Đang hoạt động</span>
                      <small className="category-slug">/{category?.slug ?? ''}</small>
                    </div>
                  })()}
                  <div className="category-detail-stats">
                    <div><span>Tin đang hiển thị</span><strong>{selectedCategoryActiveCount}</strong></div>
                    <div><span>Chờ kiểm duyệt</span><strong>{selectedCategoryPendingCount}</strong></div>
                    <div><span>Thuộc tính</span><strong>{selectedCategoryAttributes.length}</strong></div>
                  </div>
                  <div className="category-attributes-heading"><div><span className="category-panel-kicker">THÔNG TIN SẢN PHẨM</span><h3>Thuộc tính danh mục</h3><p>Các trường dữ liệu giúp mô tả và lọc sản phẩm.</p></div><span className="category-count-badge">{selectedCategoryAttributes.length} trường</span></div>
                  {selectedCategoryAttributes.length ? <div className="category-attributes-table">
                    <div className="category-attribute-row category-attribute-header"><span>THUỘC TÍNH</span><span>MÃ TRƯỜNG</span><span>KIỂU DỮ LIỆU</span><span>YÊU CẦU</span><span>BỘ LỌC</span></div>
                    {selectedCategoryAttributes.map((attribute) => <div className="category-attribute-row" key={attribute.code}>
                      <span className="category-attribute-label"><strong>{attribute.label}</strong><small>{attribute.description}</small></span>
                      <code>{attribute.code}</code>
                      <span><i className="attribute-type-dot" />{attribute.type}</span>
                      <span className={attribute.required ? 'attribute-state attribute-state-required' : 'attribute-state'}>{attribute.required ? 'Bắt buộc' : 'Tùy chọn'}</span>
                      <span className={attribute.filterable ? 'attribute-filter-enabled' : 'attribute-filter-disabled'}>{attribute.filterable ? <><Check size={13} /> Có</> : 'Không'}</span>
                    </div>)}
                  </div> : <div className="category-directory-state category-attribute-empty">Danh mục này chưa có cấu hình thuộc tính.</div>}
                  <div className="category-detail-note"><CircleAlert size={15} /><span>Thuộc tính giúp chuẩn hóa thông tin đăng tin và tạo bộ lọc phù hợp cho người mua.</span></div>
                </> : <div className="empty-state"><h3>Chọn một danh mục</h3><p>Chọn danh mục bên trái để xem thông tin và thuộc tính chi tiết.</p></div>}
              </section>
            </div>
          </>}

          {activeTab === 'reports' && <>
            <div className="admin-page-heading"><div><span className="section-eyebrow">AN TOÀN CỘNG ĐỒNG</span><h1>Báo cáo vi phạm</h1><p>Báo cáo được gửi bởi người dùng và đồng bộ trực tiếp từ cơ sở dữ liệu.</p></div><span className="pending-count">{adminReports.length} báo cáo</span></div>
            {reportsError && <div className="admin-stats-error" role="alert">Không thể tải báo cáo: {reportsError}<button onClick={() => setReportsReload((value) => value + 1)}>Thử lại</button></div>}
            {reportActionError && <div className="admin-stats-error" role="alert">{reportActionError}</div>}
            <div className="admin-panel report-table">
              <div className="admin-table-heading admin-report-heading"><span>NGƯỜI BÁO CÁO</span><span>TIN ĐƯỢC BÁO CÁO</span><span>LÝ DO</span><span>TRẠNG THÁI</span><span>THAO TÁC</span></div>
              {reportsLoading && <div className="empty-state"><p>Đang tải báo cáo...</p></div>}
              {!reportsLoading && !reportsError && adminReports.map((report) => <div className="admin-table-row admin-report-row" key={report.id}>
                <span className="report-reporter"><strong>{report.reporterName}</strong><small>{new Date(report.createdAt).toLocaleString('vi-VN')}</small></span>
                <span className="report-target"><strong>{report.listingTitle}</strong><small>#{report.listingId} · {report.sellerName}</small></span>
                <span>{report.reason}</span>
                <span className={report.status === 'OPEN' ? 'report-open-status' : 'report-closed-status'}>{reportStatusLabel(report.status)}</span>
                <div className="report-actions">
                  {report.status === 'OPEN' ? <>
                    <button disabled={reportActionId !== null} onClick={() => void applyReportAction(report.id, 'DISMISS')}>Bỏ qua</button>
                    <button className="report-resolve" disabled={reportActionId !== null} onClick={() => void applyReportAction(report.id, 'REMOVE_LISTING')}><X size={13} />Gỡ tin</button>
                    <button className="report-resolve" disabled={reportActionId !== null} onClick={() => void applyReportAction(report.id, 'LOCK_USER')}><LockKeyhole size={13} />Khóa TK</button>
                  </> : <span>—</span>}
                </div>
              </div>)}
              {!reportsLoading && !reportsError && adminReports.length === 0 && <div className="empty-state"><span>✓</span><h3>Chưa có báo cáo vi phạm</h3><p>Báo cáo do người dùng gửi sẽ xuất hiện tại đây.</p></div>}
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
    <ScrollToTopButton />
    </>
  )
}
