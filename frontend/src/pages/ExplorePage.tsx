import { Armchair, ArrowRight, ArrowUpRight, BadgeCheck, Camera, CircleCheck, HeartHandshake, PackageCheck, ShieldCheck, Smartphone, Sparkles } from 'lucide-react'
import { categories } from '../data/categories'
import { ChoHoiWordmark } from '../components/ChoHoiWordmark'
import type { Listing } from '../domain/Listing'
import { ListingCard } from '../components/ListingCard'

interface ExplorePageProps {
  listings: Listing[]
  savedIds: string[]
  onOpen: (listing: Listing) => void
  onToggleSaved: (id: string) => void
  onCategory: (category: string) => void
}

export function ExplorePage({ listings, savedIds, onOpen, onToggleSaved, onCategory }: ExplorePageProps) {
  return (
    <div className="explore-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-kicker"><span className="kicker-sparkle"><Sparkles size={14} /></span><ChoHoiWordmark className="hero-wordmark" /><span className="hero-kicker-divider">/</span><span className="hero-kicker-tagline">MUA BÁN QUANH BẠN</span></div>
          <h1>Món đồ tốt.<br /><span className="hero-headline-highlight">Giá hời.</span> Gặp nhau<br className="hero-mobile-break" /> gần nhà.</h1>
          <p>Đồ cũ vẫn có câu chuyện mới. Tìm món bạn cần, trao tay điều bạn không còn dùng.</p>
          <div className="hero-benefits"><span><CircleCheck size={16} /> Tin đăng được kiểm duyệt</span><span><CircleCheck size={16} /> Gặp gỡ gần bạn</span></div>
          <button className="hero-cta" onClick={() => document.getElementById('latest-listings')?.scrollIntoView({ behavior: 'smooth' })}>Khám phá tin mới <ArrowRight size={17} /></button>
          <div className="hero-social-proof"><div className="proof-avatars"><span>MA</span><span>QH</span><span>TH</span></div><div><strong>8.400+</strong><span>món đồ đang tìm chủ mới</span></div></div>
        </div>
        <div className="hero-art">
          <span className="hero-floating-item hero-floating-sofa"><Armchair size={21} /><small>Đồ xinh</small></span>
          <span className="hero-floating-item hero-floating-phone"><Smartphone size={20} /><small>Đồ tốt</small></span>
          <span className="hero-floating-item hero-floating-camera"><Camera size={19} /></span>
          <span className="hero-orbit-spark hero-orbit-spark-one" aria-hidden="true">✦</span>
          <span className="hero-orbit-spark hero-orbit-spark-two" aria-hidden="true">✳</span>
          <div className="hero-photo-main"><img src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1200&q=90" alt="Góc phòng sáng với những món đồ nội thất được yêu thích" /></div>
          <div className="hero-image-label"><span className="label-sparkle"><PackageCheck size={16} /></span><span><strong>Món tốt tìm đúng người</strong><small>Gần bạn · giao dịch an tâm</small></span></div>
          <div className="floating-price"><span><Sparkles size={10} /> MÓN HỜI ĐANG HOT</span><strong>Góc decor vintage</strong><b>từ 250.000đ</b></div>
          <div className="hero-sticker">MUA<br />KHÉO<br /><span>SỐNG</span><br />XANH</div>
        </div>
        <div className="hero-scribble" aria-hidden="true">✳</div>
      </section>

      <section className="trust-strip" aria-label="Cam kết của Chợ Hời">
        <span><ShieldCheck size={19} /><span><strong>Mua bán an tâm</strong><small>Tin đăng qua kiểm duyệt</small></span></span>
        <span><HeartHandshake size={20} /><span><strong>Gặp người gần bạn</strong><small>Giao dịch trực tiếp, tiện lợi</small></span></span>
        <span><BadgeCheck size={19} /><span><strong>Cộng đồng tử tế</strong><small>Đánh giá người bán rõ ràng</small></span></span>
        <button onClick={() => onCategory('Tất cả')}>Tìm hiểu thêm <ArrowUpRight size={15} /></button>
      </section>

      <section className="category-section">
        <div className="section-title-row"><div><span className="section-eyebrow">CHOHOI · TÌM THEO DANH MỤC</span><h2>Có gì bạn đang tìm?</h2></div><button className="section-link" onClick={() => onCategory('Tất cả')}>Tất cả danh mục <ArrowRight size={15} /></button></div>
        <div className="category-grid">
          {categories.map(({ name, icon: Icon, amount, image }, index) => (
            <button className={`category-tile category-tone-${index + 1}`} key={name} onClick={() => onCategory(name)}>
              <span className="category-icon">{image ? <img src={image} alt="" loading="lazy" /> : <Icon size={24} strokeWidth={1.7} />}</span><span className="category-name">{name}</span><small>{amount}</small>
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
        <div><span className="section-eyebrow">MÓN ĐỒ CỦA BẠN CŨNG XỨNG ĐÁNG ĐƯỢC YÊU</span><h2>Dọn nhà một chút.<br />Niềm vui thêm nhiều.</h2><p>Đăng tin miễn phí, kết nối với người đang cần món đồ bạn có.</p></div>
        <div className="seller-banner-note"><ChoHoiWordmark className="seller-wordmark" /><strong>Điều tốt<br />được trao tay.</strong><span className="banner-spark">✳</span></div>
      </section>
    </div>
  )
}
