import { useState } from 'react'
import { ArrowLeft, Flag, Heart, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import type { Listing } from '../domain/Listing'
import { ListingCard } from '../components/ListingCard'
import { useAppDialog } from '../components/AppDialogContext'
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
  onReport: (listingId: string, reason: string) => Promise<void>
  onRevealPhone: (id: string) => Promise<string>
}

export function ListingDetailPage({ listing, related, saved, currentUserId, onBack, onToggleSaved, onOpen, onContact, onSeller, onReport, onRevealPhone }: ListingDetailPageProps) {
  const { showPrompt, showAlert } = useAppDialog()
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [isLoadingPhone, setIsLoadingPhone] = useState(false)
  const [reported, setReported] = useState(false)
  const [reportError, setReportError] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
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

  async function reportListing() {
    if (reported || isSubmittingReport) return
    if (!currentUserId) {
      setReportError('Vui lòng đăng nhập để gửi báo cáo.')
      return
    }
    if (currentUserId === listing.sellerId) {
      setReportError('Bạn không thể báo cáo tin đăng của chính mình.')
      return
    }
    setReportError('')
    setIsSubmittingReport(true)
    try {
      const reason = await showPrompt('Bạn muốn báo cáo tin này vì lý do gì?', 'Báo cáo tin đăng', 'Nhập lý do báo cáo...')
      if (!reason?.trim()) return
      await onReport(listing.id, reason.trim())
      setReported(true)
      await showAlert('Báo cáo của bạn đã được gửi đến quản trị viên.')
    } catch (error) {
      setReportError(error instanceof Error ? error.message : 'Không thể gửi báo cáo. Vui lòng thử lại.')
    } finally {
      setIsSubmittingReport(false)
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
            <div className="detail-category-row"><span>{listing.category}</span><span>{listing.conditionLabel}</span><span>Đăng {listing.postedAt}</span></div>
            <h1>{listing.title}</h1>
            <div className="detail-price-row"><strong>{listing.priceLabel}</strong>{listing.giveaway ? <span className="giveaway-badge">Tặng miễn phí</span> : listing.negotiable && <span>Có thể thương lượng</span>}</div>
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
            {currentUserId !== listing.sellerId
              ? <button className="contact-chat" onClick={onContact}><MessageCircle size={18} /> Chat với người bán</button>
              : <span className="contact-chat-owner">Đây là tin đăng của bạn</span>}
            <button className={`detail-save ${saved ? 'detail-save-active' : ''}`} onClick={() => onToggleSaved(listing.id)}><Heart size={17} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Đã lưu tin' : 'Lưu tin này'}</button>
          </div>
          <button className={`report-link ${reported ? 'report-sent' : ''}`} onClick={() => void reportListing()} disabled={reported || isSubmittingReport}><Flag size={14} />{isSubmittingReport ? 'Đang gửi báo cáo...' : reported ? 'Đã gửi báo cáo' : 'Báo cáo tin này'}</button>
          {reportError && <span className="contact-phone-error" role="alert">{reportError}</span>}
          <div className="buyer-tip"><span>✦ MẸO NHỎ</span><p>Đừng chuyển tiền trước khi xem hàng. Hẹn gặp ở nơi công cộng để giao dịch an toàn nhé!</p></div>
        </aside>
      </div>
    </div>
  )
}
