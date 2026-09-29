import { ArrowUpRight, Bookmark, BriefcaseBusiness, Clock3, MapPin, Users } from 'lucide-react'
import type { MarketplaceJob } from '../../types/marketplace'

export function formatSalary(job: MarketplaceJob) {
  const compact = (value: number) => value >= 1_000_000
    ? `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`
    : `${value.toLocaleString('vi-VN')}`
  return `${compact(job.payMin)} – ${compact(job.payMax)}đ / ${job.payUnit}`
}

type JobCardProps = {
  job: MarketplaceJob
  saved: boolean
  onOpen: (job: MarketplaceJob) => void
  onToggleSaved: (jobId: string) => void
  compact?: boolean
}

export function JobCard({ job, saved, onOpen, onToggleSaved, compact = false }: JobCardProps) {
  return (
    <article className={`job-card ${compact ? 'job-card-compact' : ''}`}>
      <div className={`company-mark tone-${job.tone}`}>{job.initials}</div>
      <div className="job-card-content">
        <div className="job-card-head">
          <button className="job-title-button" type="button" onClick={() => onOpen(job)}>{job.title}</button>
          <button className={`icon-button bookmark-button ${saved ? 'is-saved' : ''}`} type="button" onClick={() => onToggleSaved(job.id)} aria-label={saved ? 'Bỏ lưu việc làm' : 'Lưu việc làm'} aria-pressed={saved}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></button>
        </div>
        <span className="job-company">{job.company}</span>
        <div className="job-meta-row"><span><MapPin size={14} />{job.city}</span><span><Clock3 size={14} />{job.schedule}</span>{!compact && <span><Users size={14} />{job.applicantCount} ứng viên</span>}</div>
        <div className="job-card-bottom">
          <div className="job-tags"><span className="job-tag">{job.category}</span><span className="job-tag">{job.employmentType}</span></div>
          <strong className="job-salary">{formatSalary(job)}</strong>
        </div>
      </div>
      {!compact && <button className="job-open-button" type="button" onClick={() => onOpen(job)} aria-label={`Xem ${job.title}`}><ArrowUpRight size={18} /></button>}
    </article>
  )
}

export function CompanyAvatar({ job }: { job: MarketplaceJob }) {
  return <div className={`company-mark company-mark-large tone-${job.tone}`}><BriefcaseBusiness size={21} /><span>{job.initials}</span></div>
}