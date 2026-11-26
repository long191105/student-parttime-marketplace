import { ArrowRight, ArrowUpRight, BadgeCheck, HeartHandshake, ShieldCheck } from 'lucide-react'
import { categories } from '../data/categories'
import { ChoHoiWordmark } from '../components/ChoHoiWordmark'
import type { Listing } from '../domain/Listing'
import { ListingCard } from '../components/ListingCard'

interface ExplorePageProps {
  listings: Listing[]
  savedIds: string[]
  categoryCounts: Map<string, number>
  onOpen: (listing: Listing) => void
  onToggleSaved: (id: string) => void
  onCategory: (category: string) => void
}

export function ExplorePage({ listings, savedIds, categoryCounts, onOpen, onToggleSaved, onCategory }: ExplorePageProps) {
  return (
    <div className="explore-page">
      <section className="trust-strip" aria-label="Cam kết của Chợ Hời">
        <span><ShieldCheck size={19} /><span><strong>Mua bán an tâm</strong><small>Tin đăng qua kiểm duyệt</small></span></span>
        <span><HeartHandshake size={20} /><span><strong>Gặp người gần bạn</strong><small>Giao dịch trực tiếp, tiện lợi</small></span></span>
        <span><BadgeCheck size={19} /><span><strong>Cộng đồng tử tế</strong><small>Đánh giá người bán rõ ràng</small></span></span>
        <button onClick={() => onCategory('Tất cả')}>Tìm hiểu thêm <ArrowUpRight size={15} /></button>
      </section>

      <section className="category-section">
        <div className="section-title-row"><div><span className="section-eyebrow">CHOHOI · TÌM THEO DANH MỤC</span><h2>Có gì bạn đang tìm?</h2></div><button className="section-link" onClick={() => onCategory('Tất cả')}>Tất cả danh mục <ArrowRight size={15} /></button></div>
        <div className="category-grid">
          {categories.map(({ name, icon: Icon, image }, index) => (
            <button className={`category-tile category-tone-${index + 1}`} key={name} onClick={() => onCategory(name)}>
              <span className="category-icon">{image ? <img src={image} alt="" loading="lazy" /> : <Icon size={24} strokeWidth={1.7} />}</span><span className="category-name">{name}</span><small>{categoryCounts.get(name) ?? 0} tin</small>
            </button>
          ))}
        </div>
      </section>

      <section className="latest-section" id="latest-listings">
        <div className="section-title-row"><div><span className="section-eyebrow">VỪA LÊN KỆ</span><h2>Món hời mới nhất</h2><p className="section-description">Những món đồ vừa tìm thấy chủ nhân mới quanh bạn.</p></div><button className="section-link" onClick={() => onCategory('Tất cả')}>Xem tất cả <ArrowRight size={15} /></button></div>
        <div className="listing-grid">
          {listings.slice(0, 8).map((listing) => <ListingCard key={listing.id} listing={listing} saved={savedIds.includes(listing.id)} onOpen={onOpen} onToggleSaved={onToggleSaved} />)}
        </div>
        <button className="load-more-button" onClick={() => onCategory('Tất cả')}>Khám phá thêm tin đăng <ArrowRight size={16} /></button>
      </section>

      <section className="seller-banner">
        <div><span className="section-eyebrow">MÓN ĐỒ CỦA BẠN CŨNG XỨNG ĐÁNG ĐƯỢC YÊU THƯƠNG</span><h2>Dọn nhà một chút.<br />Niềm vui thêm nhiều.</h2><p>Đăng tin miễn phí, kết nối với người đang cần món đồ bạn có.</p></div>
        <div className="seller-banner-note"><ChoHoiWordmark className="seller-wordmark" /><strong>Điều tốt<br />được trao tay.</strong><span className="banner-spark">✳</span></div>
      </section>
    </div>
  )
}
