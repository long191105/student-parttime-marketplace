import { useState } from 'react'
import { ArrowLeft, Heart, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import type { Listing } from '../domain/Listing'
import { ListingCard } from '../components/ListingCard'
import { ReportButton } from '../components/ReportButton'
import type { MarketplaceApi } from '../services/MarketplaceApi'
import { formatImageUrl } from '../services/ImageUrl'

interface ListingDetailPageProps {
  listing: Listing
  related: Listing[]
  saved: boolean
  currentUserId: string | null
  onBack: () => void
  onToggleSaved: (id: string) => void
  onOpen: (listing: Listing) => void
  onContact: () => void
  onSeller: () => void
  api: MarketplaceApi
  onRequireAuth: () => void
  onRevealPhone: (id: string) => Promise<string>
}

export function ListingDetailPage({ listing, related, saved, currentUserId, onBack, onToggleSaved, onOpen, onContact, onSeller, api, onRequireAuth, onRevealPhone }: ListingDetailPageProps) {
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [isLoadingPhone, setIsLoadingPhone] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const gallery = listing.images
  const conditionSpec = listing.specs.find((spec) => spec === 'Hàng mới' || spec === 'Đã sử dụng')
  const productSpecs = listing.specs.filter((spec) => spec !== conditionSpec)

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

  return (
    <div className="detail-page">
      <div className="breadcrumbs"><button onClick={onBack}><ArrowLeft size={14} /> Quay lại</button><span>/</span><span>{listing.category}</span><span>/</span><strong>{listing.title}</strong></div>
      <div className="detail-layout">
        <section className="detail-main">
          <div className="detail-gallery">
            <div className="detail-main-image"><img src={formatImageUrl(gallery[activeImage], 800)} alt={listing.title} /><span className="image-count">{activeImage + 1} / {gallery.length}</span></div>
            {gallery.length > 1 && <div className="detail-thumbnails">{gallery.map((image, index) => <button key={`${index}-${image}`} type="button" className={index === activeImage ? 'thumbnail-active' : ''} aria-label={`Xem ảnh ${index + 1} của ${listing.title}`} aria-pressed={index === activeImage} onClick={() => setActiveImage(index)}><img src={formatImageUrl(image, 400)} alt="" /></button>)}</div>}
          </div>
          <div className="detail-info-card">
            <div className="detail-category-row"><span>{listing.category}</span><span>{conditionSpec ?? listing.conditionLabel}</span><span>Đăng {listing.postedAt}</span></div>
            <h1>{listing.title}</h1>
            <div className="detail-price-row"><strong>{listing.priceLabel}</strong>{listing.giveaway ? <span className="giveaway-badge">Tặng miễn phí</span> : listing.negotiable && <span>Có thể thương lượng</span>}</div>
            <div className="detail-location-row"><MapPin size={16} />{listing.location}<span>·</span><span>{listing.views.toLocaleString('vi-VN')} lượt xem</span></div>
            <div className="detail-divider" />
            <h3>Mô tả chi tiết</h3>
            <p className="detail-description">{listing.description}</p>
            {productSpecs.length > 0 && <>
              <h3>Chi tiết sản phẩm</h3>
              <div className="specs-grid">{productSpecs.map((spec, index) => <div key={spec}><span>{['Chi tiết', 'Đặc điểm', 'Màu sắc'][index % 3]}</span><strong>{spec}</strong></div>)}</div>
            </>}
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
            {currentUserId !== listing.sellerId
              ? <button className="contact-chat" onClick={onContact}><MessageCircle size={18} /> Chat với người bán</button>
              : <span className="contact-chat-owner">Đây là tin đăng của bạn</span>}
            <button className={`detail-save ${saved ? 'detail-save-active' : ''}`} onClick={() => onToggleSaved(listing.id)}><Heart size={17} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Đã lưu tin' : 'Lưu tin này'}</button>
          </div>
          <ReportButton
            api={api}
            currentUserId={currentUserId}
            onRequireAuth={onRequireAuth}
            className="report-link"
            context={{
              sourceType: 'POST',
              label: `Báo cáo người dùng từ Tin đăng #${listing.id}`,
              reportedUserId: Number(listing.sellerId),
              postId: Number(listing.id),
            }}
          />
          <div className="buyer-tip"><span>✦ MẸO NHỎ</span><p>Đừng chuyển tiền trước khi xem hàng. Hẹn gặp ở nơi công cộng để giao dịch an toàn nhé!</p></div>
        </aside>
      </div>
    </div>
  )
}
