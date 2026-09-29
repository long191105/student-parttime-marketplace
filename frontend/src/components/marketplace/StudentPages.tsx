import { ArrowUpRight, BriefcaseBusiness, Check, Clock3, FileText, Star, X } from 'lucide-react'
import type { MarketplaceApplication, MarketplaceJob } from '../../types/marketplace'
import { formatSalary } from './JobCard'

type StudentPagesProps = {
  view: 'applications' | 'saved'
  applications: MarketplaceApplication[]
  savedJobs: MarketplaceJob[]
  jobs: MarketplaceJob[]
  reviewedJobIds: string[]
  onOpenJob: (job: MarketplaceJob) => void
  onReview: (job: MarketplaceJob) => void
}

const applicationStatus = {
  PENDING: { label: 'Đang xem xét', className: 'pending', icon: Clock3 },
  ACCEPTED: { label: 'Được chọn', className: 'accepted', icon: Check },
  REJECTED: { label: 'Chưa phù hợp', className: 'rejected', icon: X },
}

export function StudentPages({ view, applications, savedJobs, jobs, reviewedJobIds, onOpenJob, onReview }: StudentPagesProps) {
  if (view === 'saved') {
    return <section className="workspace-section"><div className="section-heading-row"><div><p className="eyebrow">DANH SÁCH CỦA BẠN</p><h1>Việc làm đã lưu</h1><p className="section-subtitle">Những cơ hội bạn muốn xem lại sau.</p></div><span className="results-count">{savedJobs.length} việc đã lưu</span></div>{savedJobs.length ? <div className="activity-job-grid">{savedJobs.map((job) => <button className="activity-job-card" key={job.id} type="button" onClick={() => onOpenJob(job)}><span className="activity-job-company">{job.initials}</span><span className="activity-job-main"><strong>{job.title}</strong><span>{job.company} · {job.city}</span><b>{formatSalary(job)}</b></span><ArrowUpRight size={17} /></button>)}</div> : <div className="empty-state"><span className="empty-icon"><BriefcaseBusiness size={21} /></span><h2>Chưa lưu công việc nào</h2><p>Lưu những tin bạn quan tâm để dễ dàng quay lại ứng tuyển.</p></div>}</section>
  }

  return (
    <section className="workspace-section"><div className="section-heading-row"><div><p className="eyebrow">HÀNH TRÌNH CỦA BẠN</p><h1>Hồ sơ ứng tuyển</h1><p className="section-subtitle">Theo dõi tiến độ và cập nhật mới nhất từ nhà tuyển dụng.</p></div><span className="results-count">{applications.length} hồ sơ</span></div>
      {applications.length ? <div className="application-list">{applications.map((application) => {
        const job = jobs.find((item) => item.id === application.jobId)
        const status = applicationStatus[application.status]
        const StatusIcon = status.icon
        if (!job) return null
        return <article className="application-card" key={application.id}><div className={`company-mark tone-${job.tone}`}>{job.initials}</div><div className="application-card-main"><button className="job-title-button" type="button" onClick={() => onOpenJob(job)}>{job.title}</button><span className="job-company">{job.company}</span><div className="application-details"><span className={`status-pill status-${status.className}`}><StatusIcon size={13} />{status.label}</span><span><FileText size={14} />{application.resumeName}</span><span><Clock3 size={14} />{application.createdAt}</span></div></div>{job.status === 'COMPLETED' && !reviewedJobIds.includes(job.id) ? <button className="review-button" type="button" onClick={() => onReview(job)}><Star size={15} /> Đánh giá</button> : <span className="application-salary">{formatSalary(job)}</span>}</article>
      })}</div> : <div className="empty-state"><span className="empty-icon"><FileText size={21} /></span><h2>Hồ sơ đầu tiên đang chờ bạn</h2><p>Chọn một công việc phù hợp và gửi lời giới thiệu đến nhà tuyển dụng.</p><span className="empty-tip">Mẹo nhỏ: thêm CV rõ ràng để nhà tuyển dụng hiểu thế mạnh của bạn.</span></div>}
    </section>
  )
}