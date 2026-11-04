import { BadgeCheck, CalendarDays, MapPin, ShieldCheck, Star } from 'lucide-react'
import type { Listing } from '../domain/Listing'
import { ListingCard } from '../components/ListingCard'

interface ProfilePageProps {
  listings: Listing[]
  onOpen: (listing: Listing) => void
  onToggleSaved: (id: string) => void
  onAuth: () => void
  fullName: string
  sellerId: string
}

export function ProfilePage({ listings, onOpen, onToggleSaved, onAuth, fullName, sellerId }: ProfilePageProps) {
  const initials = fullName.split(/\s+/).slice(-2).map((part) => part[0]).join('').toLocaleUpperCase('vi')
  const myListings = listings.filter((item) => item.sellerId === sellerId && item.status === 'ACTIVE')

  return (
    <div className="seller-profile-page">
      <div className="breadcrumbs"><span>Trang chủ</span><span>/</span><strong>Hồ sơ người bán</strong></div>
      <section className="seller-profile-hero"><div className="seller-profile-avatar">{initials}<span><BadgeCheck size={18} fill="currentColor" /></span></div><div className="seller-profile-copy"><span className="section-eyebrow">HỒ SƠ NGƯỜI BÁN</span><h1>{fullName} <BadgeCheck size={20} /></h1><div className="profile-rating"><Star size={16} fill="currentColor" /><strong>4.9</strong><span>12 đánh giá</span><i /><span>Thành viên Chợ Hời</span></div><p><MapPin size={15} /> Quận 3, TP. Hồ Chí Minh</p></div><div className="profile-actions"><button className="profile-follow-button"><span>+</span> Theo dõi</button><button className="profile-signout-button" onClick={onAuth}>Đăng xuất</button></div></section>
      <div className="profile-trust-row"><span><ShieldCheck size={19} /><strong>Email đã xác thực</strong></span><span><BadgeCheck size={19} /><strong>12 giao dịch thành công</strong></span><span><CalendarDays size={19} /><strong>Phản hồi trong ngày</strong></span></div>
      <section className="profile-listings"><div className="section-title-row"><div><span className="section-eyebrow">ĐANG TÌM CHỦ MỚI</span><h2>Tin đăng của {fullName} <small>{myListings.length}</small></h2></div></div><div className="listing-grid">{myListings.map((listing) => <ListingCard key={listing.id} listing={listing} saved={false} onOpen={onOpen} onToggleSaved={onToggleSaved} />)}</div></section>
      <section className="reviews-section"><div className="section-title-row"><div><span className="section-eyebrow">CỘNG ĐỒNG NÓI GÌ</span><h2>Đánh giá gần đây</h2></div><span className="review-summary"><Star size={16} fill="currentColor" /> 4.9 / 5</span></div><div className="review-list"><article className="review-item"><span className="avatar">MT</span><div><strong>Minh Thư <span>·</span> <span className="review-stars">★★★★★</span></strong><p>Giao dịch nhanh, hàng đúng mô tả. Người bán rất nhiệt tình!</p><small>Đã mua máy ảnh · 2 tuần trước</small></div></article><article className="review-item"><span className="avatar avatar-tone-coral">QN</span><div><strong>Quang Nam <span>·</span> <span className="review-stars">★★★★★</span></strong><p>Trao đổi rõ ràng, hẹn lấy hàng đúng giờ. Rất đáng tin cậy.</p><small>Đã mua bàn làm việc · 1 tháng trước</small></div></article></div></section>
    </div>
  )
}
