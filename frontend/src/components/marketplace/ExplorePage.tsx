import { useDeferredValue, useState } from 'react'
import { ArrowRight, BriefcaseBusiness, ChevronDown, MapPin, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import heroPhoto from '../../assets/hero.png'
import type { MarketplaceJob } from '../../types/marketplace'
import { JobCard } from './JobCard'

const categories = ['Tất cả ngành nghề', 'Marketing / Truyền thông', 'Nhà hàng / Khách sạn', 'Giáo dục / Đào tạo', 'Bán lẻ / Bán hàng', 'Thiết kế / Sáng tạo', 'Sự kiện / Giải trí']
const cities = ['Tất cả địa điểm', 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng']

type ExplorePageProps = {
  jobs: MarketplaceJob[]
  savedJobIds: string[]
  appliedJobIds: string[]
  onOpenJob: (job: MarketplaceJob) => void
  onToggleSaved: (jobId: string) => void
}

export function ExplorePage({ jobs, savedJobIds, appliedJobIds, onOpenJob, onToggleSaved }: ExplorePageProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [city, setCity] = useState(cities[0])
  const [minimumPay, setMinimumPay] = useState('')
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase('vi'))
  const openJobs = jobs.filter((job) => job.status === 'OPEN')
  const filteredJobs = openJobs.filter((job) => {
    const searchable = `${job.title} ${job.company} ${job.category} ${job.city} ${job.description}`.toLocaleLowerCase('vi')
    return (!deferredQuery || searchable.includes(deferredQuery))
      && (category === categories[0] || job.category === category)
      && (city === cities[0] || job.city === city)
      && (!minimumPay || (() => {
        const [minimum, unit] = minimumPay.split(':')
        return job.payUnit === unit && job.payMin >= Number(minimum)
      })())
  })
  const featuredJobs = openJobs.filter((job) => job.featured).slice(0, 3)

  return (
    <div className="explore-workspace">
      <section className="explore-hero">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={14} /> CÔNG VIỆC HỢP VỚI LỊCH CỦA BẠN</p>
          <h1>Đi làm thêm,<br /><span>đúng nhịp của bạn.</span></h1>
          <p className="hero-description">Tìm những công việc linh hoạt quanh lịch học. Tử tế, rõ ràng, và đáng để bắt đầu.</p>
          <div className="hero-search">
            <label className="search-input-wrap"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Vị trí, kỹ năng hoặc công ty" aria-label="Tìm vị trí, kỹ năng hoặc công ty" /></label>
            <label className="search-select-wrap"><MapPin size={17} /><select aria-label="Địa điểm" value={city} onChange={(event) => setCity(event.target.value)}>{cities.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label>
            <button className="button-primary search-submit" type="button" onClick={() => document.getElementById('job-results')?.scrollIntoView({ behavior: 'smooth' })}>Tìm việc <ArrowRight size={17} /></button>
          </div>
          <div className="hero-footnote"><span>Đang có <strong>{openJobs.length} cơ hội</strong> dành cho sinh viên</span><span className="hero-footnote-divider" /><span>Lọc theo lịch, địa điểm & mức lương</span></div>
        </div>
        <div className="hero-aside">
          <div className="hero-photo-card"><img src={heroPhoto} alt="Sinh viên cùng làm việc trong một không gian sáng tạo" /><div className="hero-photo-caption"><span className="note-marker"><BriefcaseBusiness size={15} /></span><div><strong>Việc nhỏ, bước tiến lớn</strong><span>Mỗi trải nghiệm đều có giá trị.</span></div></div></div>
          <div className="hero-aside-numbers"><div className="hero-aside-number"><span>01</span><div><strong>Chọn lịch bạn rảnh</strong><small>Học vẫn là ưu tiên.</small></div></div><div className="hero-aside-number"><span>02</span><div><strong>Gặp nơi làm phù hợp</strong><small>Tìm công việc đáng tin.</small></div></div><div className="hero-aside-number"><span>03</span><div><strong>Thêm kinh nghiệm thật</strong><small>Từng ca làm đều có ích.</small></div></div></div>
        </div>
      </section>

      <section className="featured-section" aria-labelledby="featured-title">
        <div className="section-heading-row compact-heading"><div><p className="eyebrow">ĐƯỢC SINH VIÊN QUAN TÂM</p><h2 id="featured-title">Cơ hội nổi bật</h2></div><span className="text-link">Chọn lọc trong tuần <ArrowRight size={15} /></span></div>
        <div className="featured-strip">{featuredJobs.map((job, index) => <button className={`featured-job featured-job-${index + 1}`} type="button" key={job.id} onClick={() => onOpenJob(job)}><span className={`company-mark tone-${job.tone}`}>{job.initials}</span><span className="featured-job-copy"><strong>{job.title}</strong><span>{job.company} · {job.city}</span><b>{new Intl.NumberFormat('vi-VN').format(job.payMin)} – {new Intl.NumberFormat('vi-VN').format(job.payMax)}đ/{job.payUnit}</b></span><ArrowRight size={17} /></button>)}</div>
      </section>

      <section className="jobs-section" id="job-results" aria-labelledby="jobs-title">
        <div className="section-heading-row jobs-heading"><div><p className="eyebrow">TÌM MỘT CA LÀM MỚI</p><h2 id="jobs-title">Việc làm dành cho bạn</h2></div><span className="results-count">{filteredJobs.length} việc phù hợp</span></div>
        <div className="filter-bar">
          <label className="filter-control"><SlidersHorizontal size={15} /><select aria-label="Lọc theo ngành nghề" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label>
          <label className="filter-control"><select aria-label="Lọc theo mức lương tối thiểu" value={minimumPay} onChange={(event) => setMinimumPay(event.target.value)}><option value="">Mọi mức lương</option><option value="25000:giờ">Từ 25.000đ/giờ</option><option value="30000:giờ">Từ 30.000đ/giờ</option><option value="180000:ca">Từ 180.000đ/ca</option><option value="4000000:tháng">Từ 4.000.000đ/tháng</option></select><ChevronDown size={14} /></label>
          <button className="filter-reset" type="button" onClick={() => { setCategory(categories[0]); setCity(cities[0]); setMinimumPay(''); setQuery('') }}>Xóa bộ lọc</button>
        </div>
        <div className="job-list">{filteredJobs.length ? filteredJobs.map((job) => <div className="job-list-item" key={job.id}><JobCard job={job} saved={savedJobIds.includes(job.id)} onOpen={onOpenJob} onToggleSaved={onToggleSaved} /><span className={`match-indicator ${appliedJobIds.includes(job.id) ? 'applied' : ''}`}>{appliedJobIds.includes(job.id) ? 'Đã ứng tuyển' : job.postedAt}</span></div>) : <div className="empty-state"><span className="empty-icon"><Search size={20} /></span><h2>Chưa tìm thấy việc phù hợp</h2><p>Thử một từ khóa hoặc bộ lọc khác nhé.</p></div>}</div>
      </section>
    </div>
  )
}