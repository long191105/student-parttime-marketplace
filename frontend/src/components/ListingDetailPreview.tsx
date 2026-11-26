import { useState } from 'react'
import { Heart, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import { formatImageUrl } from '../services/ImageUrl'

interface PreviewPhoto {
  id: string
  src: string
}

interface ListingDetailPreviewProps {
  title: string
  category: string
  condition: 'NEW' | 'USED'
  price: string
  giveaway: boolean
  location: string
  description: string
  negotiable: boolean
  images: PreviewPhoto[]
  coverPhotoId: string | null
  sellerName: string
  phone: string
}

const fallbackImage = 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=900&q=85'

export function ListingDetailPreview({
  title,
  category,
  condition,
  price,
  giveaway,
  location,
  description,
  negotiable,
  images,
  coverPhotoId,
  sellerName,
  phone,
}: ListingDetailPreviewProps) {
  const [activeImage, setActiveImage] = useState(0)
  const coverPhoto = images.find((photo) => photo.id === coverPhotoId)
  const gallery = images.length
    ? coverPhoto
      ? [coverPhoto, ...images.filter((photo) => photo.id !== coverPhoto.id)]
      : images
    : [{ id: 'preview-placeholder', src: fallbackImage }]
  const activeImageIndex = Math.min(activeImage, gallery.length - 1)
  const sellerInitials = sellerName.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase()
  const conditionLabel = condition === 'NEW' ? 'Hàng mới' : 'Đã sử dụng'

  return (
    <div className="listing-detail-preview">
      <div className="detail-layout">
        <section className="detail-main">
          <div className="detail-gallery">
            <div className="detail-main-image">
              <img src={formatImageUrl(gallery[activeImageIndex].src, 800)} alt={title || 'Ảnh sản phẩm'} />
              <span className="image-count">{activeImageIndex + 1} / {gallery.length}</span>
            </div>
            {gallery.length > 1 && <div className="detail-thumbnails">
              {gallery.map((photo, index) => <button
                key={photo.id}
                type="button"
                className={index === activeImageIndex ? 'thumbnail-active' : ''}
                aria-label={`Xem ảnh ${index + 1} của ${title || 'tin đăng'}`}
                aria-pressed={index === activeImageIndex}
                onClick={() => setActiveImage(index)}
              >
                <img src={formatImageUrl(photo.src, 400)} alt="" />
              </button>)}
            </div>}
          </div>
          <div className="detail-info-card">
            <div className="detail-category-row"><span>{category}</span><span>{conditionLabel}</span><span>Đăng Vừa xong</span></div>
            <h1>{title || 'Tiêu đề tin của bạn'}</h1>
            <div className="detail-price-row"><strong>{giveaway ? 'Miễn phí' : price}</strong>{giveaway ? <span className="giveaway-badge">Tặng miễn phí</span> : negotiable && <span>Có thể thương lượng</span>}</div>
            <div className="detail-location-row"><MapPin size={16} />{location || 'Chưa chọn khu vực'}<span>·</span><span>0 lượt xem</span></div>
            <div className="detail-divider" />
            <h3>Mô tả chi tiết</h3>
            <p className="detail-description">{description.trim() || 'Phần mô tả sản phẩm của bạn sẽ hiển thị ở đây.'}</p>
            <div className="detail-safe-note"><ShieldCheck size={18} /><span><strong>Giao dịch an toàn</strong> · Hẹn gặp nơi công cộng, kiểm tra kỹ món đồ trước khi thanh toán.</span></div>
          </div>
        </section>
        <aside className="seller-sidebar">
          <div className="seller-card">
            <span className="seller-card-eyebrow">NGƯỜI BÁN</span>
            <div className="seller-profile-link"><span className="avatar avatar-seller">{sellerInitials || 'BN'}</span><span><strong>{sellerName || 'Người bán'}</strong><small>Thành viên Chợ Hời</small></span></div>
            <div className="seller-stats"><span>Thông tin liên hệ chỉ hiển thị với thành viên đã đăng nhập.</span></div>
            <div className="contact-phone preview-contact-phone"><Phone size={18} /><span><small>Số điện thoại bạn cung cấp</small><strong>{phone || 'Chưa nhập số điện thoại'}</strong></span></div>
            <div className="contact-chat preview-action"><MessageCircle size={18} /> Chat với người bán</div>
            <div className="detail-save preview-action"><Heart size={17} /> Lưu tin này</div>
            <p className="preview-contact-note">Các nút liên hệ đang ở chế độ xem trước.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
