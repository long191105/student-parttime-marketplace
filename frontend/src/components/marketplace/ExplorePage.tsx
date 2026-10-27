import { useDeferredValue, useState } from 'react'
import { ArrowLeft, ArrowRight, MapPin, Search, Sparkles } from 'lucide-react'
import heroPhoto from '../../assets/hero.png'
import { Dropdown } from '../shared/Dropdown'
import type { MarketplaceJob } from '../../types/marketplace'
import { JobCard } from './JobCard'

const categories = ['Tất cả ngành nghề', 'Marketing / Truyền thông', 'Nhà hàng / Khách sạn', 'Giáo dục / Đào tạo', 'Bán lẻ / Bán hàng', 'Thiết kế / Sáng tạo', 'Sự kiện / Giải trí']
const cities = ['Tất cả địa điểm', 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng']
const bannerSlides = [
  { image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=85', alt: 'Đồng nghiệp trẻ cùng lên kế hoạch cho một dự án', label: 'MÔI TRƯỜNG TỬ TẾ', title: 'Bắt đầu từ một đội ngũ tốt' },
  { image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=85', alt: 'Nhóm sinh viên làm việc cùng nhau trong không gian sáng tạo', label: 'LINH HOẠT CHO SINH VIÊN', title: 'Việc làm hợp với lịch học' },
  { image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=85', alt: 'Nhóm cộng sự trao đổi ý tưởng trong buổi làm việc', label: 'TRẢI NGHIỆM MỚI', title: 'Thêm kinh nghiệm, mở lối đi riêng' },
]

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
  const [activeBanner, setActiveBanner] = useState(0)
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
        <div className="hero-copy hero-copy-centered">
          <h1>Đi làm thêm,<br /><span>đúng nhịp của bạn.</span></h1>
          <p className="hero-description">Tìm những công việc linh hoạt quanh lịch học. Tử tế, rõ ràng, và đáng để bắt đầu.</p>
          <div className="hero-search hero-search-wide">
            <div className="search-category-wrap"><Dropdown ariaLabel="Danh mục nghề" className="dropdown-search" options={categories.map((item) => ({ label: item, value: item }))} value={category} onValueChange={setCategory} /></div>
            <label className="search-input-wrap"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Vị trí, kỹ năng hoặc công ty" aria-label="Tìm vị trí, kỹ năng hoặc công ty" /></label>
            <div className="search-select-wrap"><MapPin size={17} /><Dropdown ariaLabel="Địa điểm" className="dropdown-search" options={cities.map((item) => ({ label: item, value: item }))} value={city} onValueChange={setCity} /></div>
            <button className="button-primary search-submit" type="button" onClick={() => document.getElementById('job-results')?.scrollIntoView({ behavior: 'smooth' })}>Tìm việc <ArrowRight size={17} /></button>
          </div>
          <div className="hero-footnote"><span>Đang có <strong>{openJobs.length} cơ hội</strong> dành cho sinh viên</span><span className="hero-footnote-divider" /><span>Lọc theo lịch, địa điểm & mức lương</span></div>
        </div>
        <div className="hero-promo-grid">
          <aside className="hero-category-panel" aria-label="Danh mục việc làm">
            <div className="hero-category-heading"><strong>Khám phá ngành nghề</strong><span>{categories.length - 1} lĩnh vực</span></div>
            <div className="hero-category-list">{categories.slice(1).map((item) => <button className={`hero-category-item ${category === item ? 'is-active' : ''}`} type="button" key={item} onClick={() => setCategory(item)}><span>{item}</span><span>{openJobs.filter((job) => job.category === item).length}</span></button>)}</div>
            <button className="hero-category-all" type="button" onClick={() => setCategory(categories[0])}>Tất cả ngành nghề <ArrowRight size={15} /></button>
          </aside>
          <div className="hero-carousel" aria-roledescription="carousel" aria-label="Cơ hội việc làm nổi bật">
            {bannerSlides.map((slide, index) => <div className={`hero-carousel-slide ${index === activeBanner ? 'is-active' : ''}`} key={slide.image} aria-hidden={index !== activeBanner}>
              <img src={slide.image} alt={slide.alt} onError={(event) => { event.currentTarget.src = heroPhoto }} />
              <div className="hero-carousel-shade" />
              <div className="hero-carousel-copy"><span>{slide.label}</span><h2>{slide.title}</h2><p>Khám phá một công việc mới, bắt đầu một trải nghiệm đáng giá.</p><button type="button" onClick={() => document.getElementById('job-results')?.scrollIntoView({ behavior: 'smooth' })}>Khám phá việc làm <ArrowRight size={16} /></button></div>
            </div>)}
            <button className="hero-carousel-arrow hero-carousel-previous" type="button" aria-label="Ảnh trước" onClick={() => setActiveBanner((index) => (index - 1 + bannerSlides.length) % bannerSlides.length)}><ArrowLeft size={19} /></button>
            <button className="hero-carousel-arrow hero-carousel-next" type="button" aria-label="Ảnh tiếp theo" onClick={() => setActiveBanner((index) => (index + 1) % bannerSlides.length)}><ArrowRight size={19} /></button>
            <div className="hero-carousel-dots" aria-label="Chọn ảnh banner">{bannerSlides.map((slide, index) => <button className={index === activeBanner ? 'is-active' : ''} type="button" key={slide.image} aria-label={`Hiện ảnh ${index + 1}: ${slide.title}`} aria-current={index === activeBanner ? 'true' : undefined} onClick={() => setActiveBanner(index)} />)}</div>
          </div>
        </div>
      </section>

      <section className="featured-section" aria-labelledby="featured-title">
        <div className="section-heading-row compact-heading"><div><p className="eyebrow">ĐƯỢC SINH VIÊN QUAN TÂM</p><h2 id="featured-title">Cơ hội nổi bật</h2></div><span className="text-link">Chọn lọc trong tuần <ArrowRight size={15} /></span></div>
        <div className="featured-strip">{featuredJobs.map((job, index) => <button className={`featured-job featured-job-${index + 1}`} type="button" key={job.id} onClick={() => onOpenJob(job)}><span className={`company-mark tone-${job.tone}`}>{job.initials}</span><span className="featured-job-copy"><strong>{job.title}</strong><span>{job.company} · {job.city}</span><b>{new Intl.NumberFormat('vi-VN').format(job.payMin)} – {new Intl.NumberFormat('vi-VN').format(job.payMax)}đ/{job.payUnit}</b></span><ArrowRight size={17} /></button>)}</div>
      </section>

      <section className="jobs-section" id="job-results" aria-labelledby="jobs-title">
        <div className="section-heading-row jobs-heading"><div><p className="eyebrow">TÌM MỘT CA LÀM MỚI</p><h2 id="jobs-title">Việc làm dành cho bạn</h2></div><span className="results-count">{filteredJobs.length} việc phù hợp</span></div>
        <div className="filter-bar">
          <div className="filter-control"><Dropdown ariaLabel="Lọc theo mức lương tối thiểu" className="dropdown-filter" options={[{ label: 'Mọi mức lương', value: '' }, { label: 'Từ 25.000đ/giờ', value: '25000:giờ' }, { label: 'Từ 30.000đ/giờ', value: '30000:giờ' }, { label: 'Từ 180.000đ/ca', value: '180000:ca' }, { label: 'Từ 4.000.000đ/tháng', value: '4000000:tháng' }]} value={minimumPay} onValueChange={setMinimumPay} /></div>
          <button className="filter-reset" type="button" onClick={() => { setCategory(categories[0]); setCity(cities[0]); setMinimumPay(''); setQuery('') }}>Xóa bộ lọc</button>
        </div>
        <div className="job-list">{filteredJobs.length ? filteredJobs.map((job) => <div className="job-list-item" key={job.id}><JobCard job={job} saved={savedJobIds.includes(job.id)} onOpen={onOpenJob} onToggleSaved={onToggleSaved} /><span className={`match-indicator ${appliedJobIds.includes(job.id) ? 'applied' : ''}`}>{appliedJobIds.includes(job.id) ? 'Đã ứng tuyển' : job.postedAt}</span></div>) : <div className="empty-state"><span className="empty-icon"><Search size={20} /></span><h2>Chưa tìm thấy việc phù hợp</h2><p>Thử một từ khóa hoặc bộ lọc khác nhé.</p></div>}</div>
      </section>
    </div>
  )
}