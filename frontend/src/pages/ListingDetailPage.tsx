import { useState } from 'react'
import { ArrowLeft, Flag, Heart, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import type { Listing } from '../domain/Listing'
import { ListingCard } from '../components/ListingCard'

interface ListingDetailPageProps {
  listing: Listing
  related: Listing[]
  saved: boolean
  onBack: () => void
  onToggleSaved: (id: string) => void
  onOpen: (listing: Listing) => void
  onContact: () => void
  onSeller: () => void
  onRevealPhone: (id: string) => Promise<string>
}

export function ListingDetailPage({ listing, related, saved, onBack, onToggleSaved, onOpen, onContact, onSeller, onRevealPhone }: ListingDetailPageProps) {
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [isLoadingPhone, setIsLoadingPhone] = useState(false)
  const [reported, setReported] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const gallery = listing.images

  async function revealPhone() {
    if (phone) {
      setPhone('')
      return
    }
    setPhoneError('')
    setIsLoadingPhone(true)
    try {
      setPhone(await onRevealPhone(listing.id))
    } catch (error) {
      setPhoneError(error instanceof Error ? error.message : 'Không thể lấy số điện thoại người bán.')
    } finally {
      setIsLoadingPhone(false)
    }
  }

  function reportListing() {
    const reason = window.prompt('Bạn muốn báo cáo tin này vì lý do gì?')
    if (reason?.trim()) setReported(true)
  }

  return (
    <div className="detail-page">
      <div className="breadcrumbs"><button onClick={onBack}><ArrowLeft size={14} /> Quay lại</button><span>/</span><span>{listing.category}</span><span>/</span><strong>{listing.title}</strong></div>
      <div className="detail-layout">
        <section className="detail-main">
          <div className="detail-gallery">
            <div className="detail-main-image"><img src={gallery[activeImage]} alt={listing.title} /><span className="image-count">{activeImage + 1} / {gallery.length}</span></div>
            {gallery.length > 1 && <div className="detail-thumbnails">{gallery.map((image, index) => <button key={`${index}-${image}`} type="button" className={index === activeImage ? 'thumbnail-active' : ''} aria-label={`Xem ảnh ${index + 1} của ${listing.title}`} aria-pressed={index === activeImage} onClick={() => setActiveImage(index)}><img src={image} alt="" /></button>)}</div>}
          </div>
          <div className="detail-info-card">
            <div className="detail-category-row"><span>{listing.category}</span><span>{listing.conditionLabel}</span><span>Đăng {listing.postedAt}</span></div>
            <h1>{listing.title}</h1>
            <div className="detail-price-row"><strong>{listing.priceLabel}</strong>{listing.negotiable && <span>Có thể thương lượng</span>}</div>
            <div className="detail-location-row"><MapPin size={16} />{listing.location}<span>·</span><span>{listing.views.toLocaleString('vi-VN')} lượt xem</span></div>
            <div className="detail-divider" />
            <h3>Mô tả chi tiết</h3>
            <p className="detail-description">{listing.description}</p>
            <h3>Thông tin sản phẩm</h3>
            <div className="specs-grid">{listing.specs.map((spec, index) => <div key={spec}><span>{['Thông tin', 'Chi tiết', 'Đặc điểm', 'Màu sắc'][index % 4]}</span><strong>{spec}</strong></div>)}</div>
            <div className="detail-safe-note"><ShieldCheck size={18} /><span><strong>Giao dịch an toàn</strong> · Hẹn gặp nơi công cộng, kiểm tra kỹ món đồ trước khi thanh toán.</span></div>
          </div>
          <section className="related-section"><div className="section-title-row"><div><span className="section-eyebrow">CÓ THỂ BẠN CŨNG THÍCH</span><h2>Tin đăng tương tự</h2></div></div><div className="listing-grid">{related.slice(0, 4).map((item) => <ListingCard key={item.id} listing={item} saved={false} onOpen={onOpen} onToggleSaved={onToggleSaved} />)}</div></section>
        </section>
        <aside className="seller-sidebar">
          <div className="seller-card">
            <span className="seller-card-eyebrow">NGƯỜI BÁN</span>
            <button className="seller-profile-link" onClick={onSeller}><span className="avatar avatar-seller">{listing.sellerInitials}</span><span><strong>{listing.seller}</strong><small>Thành viên Chợ Hời</small></span></button>
            <div className="seller-stats"><span>Thông tin liên hệ chỉ hiển thị với thành viên đã đăng nhập.</span></div>
            <button className="seller-more-link" onClick={onSeller}>Xem hồ sơ & tin khác <span>→</span></button>
            <button className="contact-phone" onClick={() => void revealPhone()} disabled={isLoadingPhone}><Phone size={18} /><span><small>{isLoadingPhone ? 'Đang tải...' : phone ? 'Số điện thoại người bán' : 'Hiện số điện thoại'}</small><strong>{phone || '••• ••• •••'}</strong></span></button>
            {phoneError && <span className="contact-phone-error" role="alert">{phoneError}</span>}
            <button className="contact-chat" onClick={onContact}><MessageCircle size={18} /> Chat với người bán</button>
            <button className={`detail-save ${saved ? 'detail-save-active' : ''}`} onClick={() => onToggleSaved(listing.id)}><Heart size={17} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Đã lưu tin' : 'Lưu tin này'}</button>
          </div>
          <button className={`report-link ${reported ? 'report-sent' : ''}`} onClick={reportListing}><Flag size={14} />{reported ? 'Đã gửi báo cáo' : 'Báo cáo tin này'}</button>
          <div className="buyer-tip"><span>✦ MẸO NHỎ</span><p>Đừng chuyển tiền trước khi xem hàng. Hẹn gặp ở nơi công cộng để giao dịch an toàn nhé!</p></div>
        </aside>
      </div>
    </div>
  )
}
