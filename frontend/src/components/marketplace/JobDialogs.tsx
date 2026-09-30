import { useState, type FormEvent } from 'react'
import { ArrowUpRight, Check, FileText, MapPin, Star, UploadCloud } from 'lucide-react'
import type { AuthUser } from '../../services/auth'
import type { JobDraft, MarketplaceJob } from '../../types/marketplace'
import { Dropdown } from '../shared/Dropdown'
import { CompanyAvatar, formatSalary } from './JobCard'
import { Dialog } from '../shared/Dialog'

type JobDetailsDialogProps = {
  job: MarketplaceJob
  user: AuthUser
  alreadyApplied: boolean
  onClose: () => void
  onApply: (jobId: string, introduction: string, resumeName: string) => boolean
}

export function JobDetailsDialog({ job, user, alreadyApplied, onClose, onApply }: JobDetailsDialogProps) {
  const [applying, setApplying] = useState(false)
  const [introduction, setIntroduction] = useState('')
  const [resumeName, setResumeName] = useState('')
  const [error, setError] = useState('')
  const isStudent = user.role === 'STUDENT'

  function handleApply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!resumeName) {
      setError('Vui lòng đính kèm CV hoặc hồ sơ giới thiệu.')
      return
    }
    if (onApply(job.id, introduction, resumeName)) onClose()
    else setError('Bạn đã ứng tuyển công việc này hoặc tin không còn nhận hồ sơ.')
  }

  return (
    <Dialog title={applying ? 'Hoàn thiện hồ sơ' : 'Thông tin công việc'} eyebrow="CƠ HỘI PART-TIME" onClose={onClose} size="wide">
      {applying ? (
        <form className="application-form" onSubmit={handleApply}>
          <div className="application-job-summary"><CompanyAvatar job={job} /><div><strong>{job.title}</strong><span>{job.company} · {formatSalary(job)}</span></div></div>
          <label className="dialog-label" htmlFor="introduction">Giới thiệu ngắn với nhà tuyển dụng</label>
          <textarea id="introduction" value={introduction} onChange={(event) => setIntroduction(event.target.value)} rows={5} maxLength={1200} placeholder="Chia sẻ lịch rảnh, kinh nghiệm hoặc lý do bạn phù hợp với công việc này..." required />
          <label className="dialog-label" htmlFor="resume">CV hoặc hồ sơ cá nhân</label>
          <label className={`upload-zone ${resumeName ? 'has-file' : ''}`} htmlFor="resume"><input id="resume" type="file" accept=".pdf,.doc,.docx" onChange={(event) => setResumeName(event.target.files?.[0]?.name ?? '')} /><span className="upload-icon"><UploadCloud size={20} /></span><span><strong>{resumeName || 'Chọn tệp CV của bạn'}</strong><small>PDF hoặc Word · tối đa 10 MB</small></span>{resumeName && <Check size={17} />}</label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <p className="form-footnote">Hồ sơ sẽ được gửi đến {job.company}. Bản demo lưu thông tin tệp, chưa tải tệp lên máy chủ.</p>
          <div className="dialog-actions"><button className="quiet-button" type="button" onClick={() => setApplying(false)}>Quay lại</button><button className="button-primary" type="submit">Gửi hồ sơ <ArrowUpRight size={16} /></button></div>
        </form>
      ) : (
        <div className="job-detail-content">
          <div className="job-detail-company"><CompanyAvatar job={job} /><div><h3>{job.company}</h3><span>{job.category} <i /> {job.city}</span></div><span className="verified-label"><Check size={13} /> Đối tác</span></div>
          <h2 className="job-detail-title">{job.title}</h2>
          <div className="job-detail-facts"><div><span>MỨC LƯƠNG</span><strong>{formatSalary(job)}</strong></div><div><span>THỜI GIAN</span><strong>{job.schedule}</strong></div><div><span>HÌNH THỨC</span><strong>{job.employmentType}</strong></div></div>
          <div className="job-detail-address"><MapPin size={16} /><span>{job.address}</span></div>
          <section className="job-detail-section"><h3>Mô tả công việc</h3><p>{job.description}</p></section>
          <section className="job-detail-section"><h3>Bạn phù hợp nếu</h3><ul>{job.requirements.map((item) => <li key={item}>{item}</li>)}</ul></section>
          <div className="job-detail-footer"><span>{job.applicantCount} bạn đã quan tâm <i /> Đăng {job.postedAt}</span>{isStudent && (alreadyApplied ? <span className="applied-confirmation"><Check size={15} /> Đã gửi hồ sơ</span> : job.status === 'OPEN' ? <button className="button-primary" type="button" onClick={() => setApplying(true)}>Ứng tuyển ngay <ArrowUpRight size={17} /></button> : <span className="status-pill">Tin đã đóng</span>)}</div>
        </div>
      )}
    </Dialog>
  )
}

type JobFormDialogProps = { companyName: string; onClose: () => void; onCreate: (draft: JobDraft) => void }

export function JobFormDialog({ companyName, onClose, onCreate }: JobFormDialogProps) {
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payMin = Number(form.get('payMin'))
    const payMax = Number(form.get('payMax'))
    if (payMax < payMin) {
      setError('Mức lương tối đa cần lớn hơn hoặc bằng mức tối thiểu.')
      return
    }
    const draft: JobDraft = {
      title: String(form.get('title')).trim(),
      company: String(form.get('company')).trim(),
      category: String(form.get('category')),
      city: String(form.get('city')),
      address: String(form.get('address')).trim(),
      payMin,
      payMax,
      payUnit: String(form.get('payUnit')) as JobDraft['payUnit'],
      schedule: String(form.get('schedule')).trim(),
      employmentType: String(form.get('employmentType')),
      description: String(form.get('description')).trim(),
      requirements: String(form.get('requirements')).split('\n').map((item) => item.trim()).filter(Boolean),
    }
    onCreate(draft)
    onClose()
  }

  return (
    <Dialog title="Đăng tin tuyển dụng" eyebrow="KẾT NỐI ĐÚNG NGƯỜI" onClose={onClose} size="wide">
      <form className="job-form" onSubmit={handleSubmit}>
        <div className="form-grid"><label className="dialog-label">Tên vị trí<input name="title" placeholder="Ví dụ: Nhân viên phục vụ ca tối" required maxLength={140} /></label><label className="dialog-label">Tên cửa hàng / đơn vị<input name="company" defaultValue={companyName} placeholder="Tên nơi làm việc" required maxLength={120} /></label></div>
        <div className="form-grid"><label className="dialog-label">Ngành nghề<Dropdown ariaLabel="Ngành nghề" name="category" options={[{ label: 'Nhà hàng / Khách sạn', value: 'Nhà hàng / Khách sạn' }, { label: 'Marketing / Truyền thông', value: 'Marketing / Truyền thông' }, { label: 'Giáo dục / Đào tạo', value: 'Giáo dục / Đào tạo' }, { label: 'Bán lẻ / Bán hàng', value: 'Bán lẻ / Bán hàng' }, { label: 'Thiết kế / Sáng tạo', value: 'Thiết kế / Sáng tạo' }, { label: 'Sự kiện / Giải trí', value: 'Sự kiện / Giải trí' }]} /></label><label className="dialog-label">Thành phố<Dropdown ariaLabel="Thành phố" name="city" options={[{ label: 'TP. Hồ Chí Minh', value: 'TP. Hồ Chí Minh' }, { label: 'Hà Nội', value: 'Hà Nội' }, { label: 'Đà Nẵng', value: 'Đà Nẵng' }]} /></label></div>
        <label className="dialog-label">Địa chỉ / hình thức làm việc<input name="address" placeholder="Quận, thành phố · tại chỗ hoặc hybrid" required maxLength={180} /></label>
        <div className="form-grid form-grid-three"><label className="dialog-label">Lương tối thiểu<input name="payMin" type="number" min="1" placeholder="28000" required /></label><label className="dialog-label">Lương tối đa<input name="payMax" type="number" min="1" placeholder="35000" required /></label><label className="dialog-label">Tính theo<Dropdown ariaLabel="Tính theo" name="payUnit" options={[{ label: 'Giờ', value: 'giờ' }, { label: 'Ca', value: 'ca' }, { label: 'Tháng', value: 'tháng' }]} /></label></div>
        <div className="form-grid"><label className="dialog-label">Lịch làm việc<input name="schedule" placeholder="Ví dụ: Ca tối · 4 buổi/tuần" required maxLength={120} /></label><label className="dialog-label">Hình thức<Dropdown ariaLabel="Hình thức" name="employmentType" options={[{ label: 'Bán thời gian', value: 'Bán thời gian' }, { label: 'Theo ca', value: 'Theo ca' }, { label: 'Thời vụ', value: 'Thời vụ' }, { label: 'Thực tập bán thời gian', value: 'Thực tập bán thời gian' }]} /></label></div>
        <label className="dialog-label">Mô tả công việc<textarea name="description" rows={4} placeholder="Mô tả công việc, quyền lợi và cách ứng tuyển..." required maxLength={3000} /></label>
        <label className="dialog-label">Yêu cầu ứng viên<textarea name="requirements" rows={3} placeholder={'Mỗi yêu cầu viết trên một dòng\nKhông yêu cầu kinh nghiệm\nCó thể làm cuối tuần'} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions"><button className="quiet-button" type="button" onClick={onClose}>Hủy</button><button className="button-primary" type="submit">Đăng tin <ArrowUpRight size={16} /></button></div>
      </form>
    </Dialog>
  )
}

type ReviewDialogProps = { targetName: string; jobTitle: string; onClose: () => void; onSubmit: (rating: number, comment: string) => boolean }

export function ReviewDialog({ targetName, jobTitle, onClose, onSubmit }: ReviewDialogProps) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!onSubmit(rating, comment.trim())) setError('Bạn đã gửi đánh giá cho công việc này.')
    else onClose()
  }

  return <Dialog title="Chia sẻ trải nghiệm" eyebrow="CÔNG VIỆC ĐÃ HOÀN THÀNH" onClose={onClose}><form className="review-form" onSubmit={handleSubmit}><p className="review-target">Đánh giá <strong>{targetName}</strong> sau công việc <strong>{jobTitle}</strong>.</p><span className="dialog-label">Trải nghiệm của bạn</span><div className="rating-picker" role="radiogroup" aria-label="Số sao đánh giá">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" className={value <= rating ? 'selected' : ''} onClick={() => setRating(value)} aria-label={`${value} sao`} aria-pressed={rating === value}><Star size={25} fill="currentColor" /></button>)}</div><label className="dialog-label" htmlFor="review-comment">Lời nhắn<textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} rows={4} maxLength={800} placeholder="Điều gì khiến bạn hài lòng?" required /></label>{error && <p className="form-error">{error}</p>}<div className="dialog-actions"><button className="button-primary" type="submit">Gửi đánh giá <ArrowUpRight size={16} /></button></div></form></Dialog>
}

export function ResumeLabel({ name }: { name: string }) {
  return <span className="resume-label"><FileText size={14} />{name}</span>
}