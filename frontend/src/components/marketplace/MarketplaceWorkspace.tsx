import { useEffect, useState } from 'react'
import { Bell, Bookmark, BriefcaseBusiness, ChevronDown, CircleHelp, FileText, Gauge, LayoutDashboard, LogOut, Menu, Search, ShieldCheck, Users, X } from 'lucide-react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { state, createJob, submitApplication, updateApplicationStatus, updateJobStatus, removeJob, toggleSavedJob, addReview, markNotificationsRead } = useMarketplace()

  useEffect(() => {
    function navigate(event: Event) {
      const detail = (event as CustomEvent<WorkspaceView>).detail
      if (detail) setActiveView(detail)
    }
    document.addEventListener('marketplace:navigate', navigate)
    return () => document.removeEventListener('marketplace:navigate', navigate)
  }, [])

  const visibleNotifications = state.notifications.filter((item) => item.userId === user.id || (item.userId === null && item.audienceRole === user.role))
  const unreadCount = visibleNotifications.filter((item) => !item.read).length
  const studentApplications = state.applications.filter((item) => item.studentId === user.id)
  const savedJobs = state.jobs.filter((job) => state.savedJobIds.includes(job.id))
  const ownedJobs = state.jobs.filter((job) => job.employerId === user.id)
  const ownedJobIds = new Set(ownedJobs.map((job) => job.id))
  const employerApplications = state.applications.filter((application) => ownedJobIds.has(application.jobId))
  const appliedJobIds = studentApplications.map((item) => item.jobId)
  const reviewedJobIds = state.reviews.filter((review) => review.authorId === user.id).map((review) => review.jobId)

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
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand-row"><BrandLockup /><button className="icon-button sidebar-close" type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Đóng menu"><X size={18} /></button></div>
        <div className="sidebar-account"><span className="avatar avatar-large">{initials(user.fullName)}</span><div><strong>{user.fullName}</strong><span>{roleNames[user.role]}</span></div><ChevronDown size={15} /></div>
        <p className="sidebar-label">{user.role === 'STUDENT' ? 'KHÁM PHÁ' : user.role === 'EMPLOYER' ? 'KHÔNG GIAN TUYỂN DỤNG' : 'QUẢN TRỊ'}</p>
        <nav className="sidebar-nav" aria-label="Điều hướng chính">{navigation[user.role].map((item) => {
          const Icon = item.icon
          return <button className={`nav-item ${activeView === item.view ? 'nav-item-active' : ''}`} type="button" key={item.view} onClick={() => { setActiveView(item.view); setMobileMenuOpen(false) }}><Icon size={18} /><span>{item.label}</span>{item.view === 'notifications' && unreadCount > 0 && <span className="nav-count">{unreadCount}</span>}</button>
        })}</nav>
        {user.role === 'STUDENT' && <div className="sidebar-tip"><span className="tip-index">MỘT CHÚT GỢI Ý</span><h3>Học tốt, làm vừa sức.</h3><p>Ưu tiên công việc có lịch linh hoạt để bạn luôn giữ nhịp học tập.</p></div>}
        <div className="sidebar-bottom"><button className="nav-item" type="button" onClick={() => setActiveView('notifications')}><CircleHelp size={18} /><span>Trợ giúp</span></button><button className="nav-item logout-nav" type="button" onClick={onLogout}><LogOut size={18} /><span>Đăng xuất</span></button><span className="sidebar-version">DHL · 1.0.0</span></div>
      </aside>

      <main className="workspace-main">
        <header className="workspace-header"><button className="icon-button mobile-menu-button" type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Mở menu"><Menu size={20} /></button><div className="breadcrumb"><span>{roleNames[user.role]}</span><span>/</span><strong>{navigation[user.role].find((item) => item.view === activeView)?.label ?? 'Tổng quan'}</strong></div><div className="header-actions"><button className={`icon-button header-notifications ${unreadCount ? 'has-unread' : ''}`} type="button" onClick={() => setActiveView('notifications')} aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}><Bell size={19} />{unreadCount > 0 && <span>{unreadCount}</span>}</button><span className="header-divider" /><span className="avatar">{initials(user.fullName)}</span></div></header>
        <div className={`workspace-body role-${user.role.toLowerCase()}`}>{currentPage}</div>
      </main>
      {mobileMenuOpen && <button className="mobile-menu-backdrop" type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Đóng menu" />}
      {selectedJob && <JobDetailsDialog job={selectedJob} user={user} alreadyApplied={appliedJobIds.includes(selectedJob.id)} onClose={() => setSelectedJob(null)} onApply={handleApply} />}
      {showJobForm && <JobFormDialog companyName={user.fullName} onClose={() => setShowJobForm(false)} onCreate={handleCreateJob} />}
      {reviewing && <ReviewDialog targetName={reviewing.targetName} jobTitle={reviewing.job.title} onClose={() => setReviewing(null)} onSubmit={handleReview} />}
    </div>
  )
}