import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Bell, Bookmark, BriefcaseBusiness, ChevronDown, CircleHelp, FileText, Gauge, LayoutDashboard, LogOut, Search, ShieldCheck, Users } from 'lucide-react'
import type { AuthUser, UserRole } from '../../services/auth'
import type { JobDraft, MarketplaceApplication, MarketplaceJob, WorkspaceView } from '../../types/marketplace'
import { useMarketplace } from '../../hooks/useMarketplace'
import { BrandLockup } from '../shared/BrandLockup'
import { AdminPage } from './AdminPage'
import { EmployerPages } from './EmployerPages'
import { ExplorePage } from './ExplorePage'
import { JobDetailsDialog, JobFormDialog, ReviewDialog } from './JobDialogs'
import { StudentPages } from './StudentPages'
import { NotificationsPanel } from '../shared/NotificationsPanel'

type MarketplaceWorkspaceProps = { user: AuthUser; onLogout: () => void }
type NavigationItem = { view: WorkspaceView; label: string; icon: typeof Search }

const roleNames: Record<UserRole, string> = { STUDENT: 'Sinh viên', EMPLOYER: 'Nhà tuyển dụng', ADMIN: 'Quản trị viên' }
const navigation: Record<UserRole, NavigationItem[]> = {
  STUDENT: [
    { view: 'explore', label: 'Tìm việc làm', icon: Search },
    { view: 'applications', label: 'Hồ sơ ứng tuyển', icon: FileText },
    { view: 'saved', label: 'Việc đã lưu', icon: Bookmark },
    { view: 'notifications', label: 'Thông báo', icon: Bell },
  ],
  EMPLOYER: [
    { view: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { view: 'jobs', label: 'Tin tuyển dụng', icon: BriefcaseBusiness },
    { view: 'candidates', label: 'Ứng viên', icon: Users },
    { view: 'notifications', label: 'Thông báo', icon: Bell },
  ],
  ADMIN: [
    { view: 'overview', label: 'Tổng quan', icon: Gauge },
    { view: 'moderation', label: 'Kiểm duyệt tin', icon: ShieldCheck },
    { view: 'people', label: 'Tài khoản', icon: Users },
    { view: 'notifications', label: 'Thông báo', icon: Bell },
  ],
}

function initials(name: string) {
  return name.split(/\s+/).slice(-2).map((part) => part[0]).join('').toLocaleUpperCase('vi')
}

export function MarketplaceWorkspace({ user, onLogout }: MarketplaceWorkspaceProps) {
  const [activeView, setActiveView] = useState<WorkspaceView>(user.role === 'STUDENT' ? 'explore' : 'overview')
  const [selectedJob, setSelectedJob] = useState<MarketplaceJob | null>(null)
  const [showJobForm, setShowJobForm] = useState(false)
  const [reviewing, setReviewing] = useState<{ job: MarketplaceJob; targetId: number | null; targetName: string; authorRole: 'STUDENT' | 'EMPLOYER' } | null>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const profileTriggerRef = useRef<HTMLButtonElement>(null)
  const { state, createJob, submitApplication, updateApplicationStatus, updateJobStatus, removeJob, toggleSavedJob, addReview, markNotificationsRead } = useMarketplace()

  useEffect(() => {
    function navigate(event: Event) {
      const detail = (event as CustomEvent<WorkspaceView>).detail
      if (detail) setActiveView(detail)
    }
    document.addEventListener('marketplace:navigate', navigate)
    return () => document.removeEventListener('marketplace:navigate', navigate)
  }, [])

  useEffect(() => {
    if (!profileMenuOpen) return
    function handlePointerDown(event: PointerEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) setProfileMenuOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false)
        profileTriggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileMenuOpen])

  const visibleNotifications = state.notifications.filter((item) => item.userId === user.id || (item.userId === null && item.audienceRole === user.role))
  const unreadCount = visibleNotifications.filter((item) => !item.read).length
  const studentApplications = state.applications.filter((item) => item.studentId === user.id)
  const savedJobs = state.jobs.filter((job) => state.savedJobIds.includes(job.id))
  const ownedJobs = state.jobs.filter((job) => job.employerId === user.id)
  const ownedJobIds = new Set(ownedJobs.map((job) => job.id))
  const employerApplications = state.applications.filter((application) => ownedJobIds.has(application.jobId))
  const appliedJobIds = studentApplications.map((item) => item.jobId)
  const reviewedJobIds = state.reviews.filter((review) => review.authorId === user.id).map((review) => review.jobId)
  const headerMenus = [
    {
      label: 'Việc làm',
      items: [
        { label: 'Khám phá việc làm', description: 'Tìm công việc phù hợp với lịch học.', action: () => setActiveView(user.role === 'STUDENT' ? 'explore' : user.role === 'EMPLOYER' ? 'jobs' : 'moderation') },
        ...(user.role === 'STUDENT'
          ? [
              { label: 'Việc làm đã lưu', description: 'Xem lại những cơ hội bạn quan tâm.', action: () => setActiveView('saved' as WorkspaceView) },
              { label: 'Hồ sơ ứng tuyển', description: 'Theo dõi các công việc đã ứng tuyển.', action: () => setActiveView('applications' as WorkspaceView) },
            ]
          : user.role === 'EMPLOYER'
            ? [{ label: 'Ứng viên', description: 'Xem và quản lý hồ sơ ứng tuyển.', action: () => setActiveView('candidates' as WorkspaceView) }]
            : [{ label: 'Tài khoản', description: 'Quản lý tài khoản trên nền tảng.', action: () => setActiveView('people' as WorkspaceView) }]),
      ],
    },
    {
      label: 'Tạo CV',
      items: user.role === 'STUDENT'
        ? [
            { label: 'Bắt đầu ứng tuyển', description: 'Gửi hồ sơ của bạn tới nhà tuyển dụng.', action: () => setActiveView('explore' as WorkspaceView) },
            { label: 'Theo dõi hồ sơ', description: 'Xem trạng thái các đơn ứng tuyển.', action: () => setActiveView('applications' as WorkspaceView) },
          ]
        : [{ label: 'Hồ sơ ứng viên', description: 'Khám phá hồ sơ và tiến trình tuyển dụng.', action: () => setActiveView(user.role === 'EMPLOYER' ? 'candidates' : 'people') }],
    },
    {
      label: 'Công cụ',
      items: [
        { label: user.role === 'STUDENT' ? 'Việc làm đã lưu' : 'Thông báo', description: user.role === 'STUDENT' ? 'Lưu cơ hội để xem lại sau.' : 'Cập nhật mới trong không gian làm việc.', action: () => setActiveView(user.role === 'STUDENT' ? 'saved' : 'notifications') },
        { label: 'Lọc việc theo ngành nghề', description: 'Đi tới danh sách việc làm và bộ lọc.', action: () => { setActiveView('explore'); window.setTimeout(() => document.getElementById('job-results')?.scrollIntoView({ behavior: 'smooth' }), 0) } },
      ],
    },
    {
      label: 'Cẩm nang nghề nghiệp',
      items: [
        { label: 'Cơ hội nổi bật', description: 'Những công việc được quan tâm trong tuần.', action: () => { setActiveView('explore'); window.setTimeout(() => document.getElementById('featured-title')?.scrollIntoView({ behavior: 'smooth' }), 0) } },
        { label: 'Khám phá ngành nghề', description: 'Xem các lĩnh vực đang tuyển dụng.', action: () => { setActiveView('explore'); window.setTimeout(() => document.getElementById('job-results')?.scrollIntoView({ behavior: 'smooth' }), 0) } },
      ],
    },
    {
      label: 'DHL Pro',
      badge: 'Pro',
      items: user.role === 'EMPLOYER'
        ? [{ label: 'Đăng tin tuyển dụng', description: 'Tạo tin mới và tiếp cận ứng viên.', action: () => setShowJobForm(true) }]
        : [{ label: 'Cơ hội dành cho bạn', description: 'Tìm công việc linh hoạt quanh lịch học.', action: () => setActiveView(user.role === 'STUDENT' ? 'explore' : 'overview') }],
    },
  ]

  function handleCreateJob(draft: JobDraft) {
    createJob(user.id, draft)
    setActiveView('jobs')
  }

  function handleApply(jobId: string, introduction: string, resumeName: string) {
    return submitApplication(jobId, user.id, user.fullName, user.email, introduction, resumeName)
  }

  function handleReview(rating: number, comment: string) {
    if (!reviewing) return false
    return addReview({ jobId: reviewing.job.id, authorId: user.id, authorRole: reviewing.authorRole, targetId: reviewing.targetId, targetName: reviewing.targetName, rating, comment })
  }

  const currentPage = activeView === 'notifications'
    ? <NotificationsPanel notifications={visibleNotifications} onMarkRead={() => markNotificationsRead(user.id, user.role)} />
    : user.role === 'STUDENT'
      ? activeView === 'explore'
        ? <ExplorePage jobs={state.jobs} savedJobIds={state.savedJobIds} appliedJobIds={appliedJobIds} onOpenJob={setSelectedJob} onToggleSaved={toggleSavedJob} />
        : <StudentPages view={activeView === 'saved' ? 'saved' : 'applications'} applications={studentApplications} savedJobs={savedJobs} jobs={state.jobs} reviewedJobIds={reviewedJobIds} onOpenJob={setSelectedJob} onReview={(job) => setReviewing({ job, targetId: job.employerId, targetName: job.company, authorRole: 'STUDENT' })} />
      : user.role === 'EMPLOYER'
        ? <EmployerPages view={activeView} user={user} jobs={ownedJobs} applications={employerApplications} reviewedJobIds={reviewedJobIds} onCreateJob={() => setShowJobForm(true)} onNavigate={setActiveView} onReview={(job, application: MarketplaceApplication) => setReviewing({ job, targetId: application.studentId, targetName: application.applicantName, authorRole: 'EMPLOYER' })} onUpdateJob={updateJobStatus} onUpdateApplication={updateApplicationStatus} />
        : <AdminPage view={activeView} jobs={state.jobs} reviewCount={state.reviews.length} onRemoveJob={removeJob} />

  return (
    <div className="marketplace-shell">
      <main className="workspace-main">
        <header className="workspace-header">
          <div className="workspace-header-inner">
            <BrandLockup className="header-brand" />
            <nav className="header-nav" aria-label="Điều hướng chính">{headerMenus.map((menu) => <details className="header-menu-group" key={menu.label}>
              <summary className="header-nav-item"><span>{menu.label}</span>{menu.badge && <span className="header-pro-badge">{menu.badge}</span>}<ChevronDown aria-hidden="true" size={15} /></summary>
              <div className="header-dropdown">{menu.items.map((item) => <button className="header-dropdown-item" key={item.label} type="button" onClick={(event) => { item.action(); event.currentTarget.closest('details')?.removeAttribute('open') }}><strong>{item.label}</strong><span>{item.description}</span></button>)}</div>
            </details>)}</nav>
            <div className="header-actions">
              <button className={`icon-button header-notifications ${unreadCount ? 'has-unread' : ''}`} type="button" onClick={() => setActiveView('notifications')} aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}><Bell size={19} />{unreadCount > 0 && <span>{unreadCount}</span>}</button>
              {user.role === 'EMPLOYER' && <button className="header-post-job" type="button" onClick={() => setShowJobForm(true)}><span>Bạn là nhà tuyển dụng?</span><strong>Đăng tin ngay <ArrowRight size={15} /></strong></button>}
              <div className="profile-menu-anchor" ref={profileMenuRef}>
                <button aria-controls="profile-navigation-menu" aria-expanded={profileMenuOpen} aria-haspopup="true" className={`profile-trigger ${profileMenuOpen ? 'is-open' : ''}`} onClick={() => setProfileMenuOpen((open) => !open)} ref={profileTriggerRef} type="button">
                  <span className="avatar">{initials(user.fullName)}</span><span className="profile-trigger-copy"><strong>{user.fullName}</strong><small>{roleNames[user.role]}</small></span><ChevronDown aria-hidden="true" className="profile-chevron" size={15} />
                </button>
                {profileMenuOpen && <div className="profile-menu" id="profile-navigation-menu">
                  <div className="profile-menu-heading"><span className="avatar avatar-large">{initials(user.fullName)}</span><div><strong>{user.fullName}</strong><span>{roleNames[user.role]}</span><small>{user.email}</small></div></div>
                  <p className="profile-menu-label">KHÔNG GIAN LÀM VIỆC</p>
                  <nav className="profile-menu-nav" aria-label="Các mục trong không gian làm việc">{navigation[user.role].map((item) => {
                    const Icon = item.icon
                    return <button className={`profile-menu-item ${activeView === item.view ? 'is-active' : ''}`} type="button" key={item.view} onClick={() => { setActiveView(item.view); setProfileMenuOpen(false) }}><Icon size={17} /><span>{item.label}</span>{item.view === 'notifications' && unreadCount > 0 && <span className="nav-count">{unreadCount}</span>}</button>
                  })}</nav>
                  {user.role === 'STUDENT' && <div className="profile-menu-tip"><span className="tip-index">MỘT CHÚT GỢI Ý</span><strong>Học tốt, làm vừa sức.</strong><span>Ưu tiên công việc có lịch linh hoạt để bạn luôn giữ nhịp học tập.</span></div>}
                  <div className="profile-menu-footer"><button className="profile-menu-item" type="button" onClick={() => { setActiveView('notifications'); setProfileMenuOpen(false) }}><CircleHelp size={17} /><span>Trợ giúp</span></button><button className="profile-menu-item logout-nav" type="button" onClick={onLogout}><LogOut size={17} /><span>Đăng xuất</span></button><span className="sidebar-version">DHL · 1.0.0</span></div>
                </div>}
              </div>
            </div>
          </div>
        </header>
        <div className={`workspace-body role-${user.role.toLowerCase()}`}>{currentPage}</div>
      </main>
      {selectedJob && <JobDetailsDialog job={selectedJob} user={user} alreadyApplied={appliedJobIds.includes(selectedJob.id)} onClose={() => setSelectedJob(null)} onApply={handleApply} />}
      {showJobForm && <JobFormDialog companyName={user.fullName} onClose={() => setShowJobForm(false)} onCreate={handleCreateJob} />}
      {reviewing && <ReviewDialog targetName={reviewing.targetName} jobTitle={reviewing.job.title} onClose={() => setReviewing(null)} onSubmit={handleReview} />}
    </div>
  )
}