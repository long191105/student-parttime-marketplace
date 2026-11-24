import { useEffect, useState } from 'react'
import { BadgeCheck, CalendarDays, MapPin, ShieldCheck, Star } from 'lucide-react'
import type { Listing } from '../domain/Listing'
import { ListingCard } from '../components/ListingCard'
import type { ChatReview, MarketplaceApi } from '../services/MarketplaceApi'

interface ProfilePageProps {
  listings: Listing[]
  onOpen: (listing: Listing) => void
  onToggleSaved: (id: string) => void
  onAuth: () => void
  fullName: string
  sellerId: string
  api: MarketplaceApi
}

export function ProfilePage({ listings, onOpen, onToggleSaved, onAuth, fullName, sellerId, api }: ProfilePageProps) {
  const [reviewState, setReviewState] = useState<{ userId: string; reviews: ChatReview[]; error: string }>({ userId: '', reviews: [], error: '' })
  useEffect(() => {
    let active = true
    async function refreshReviews() {
      try {
        const reviews = await api.getPublishedUserReviews(sellerId)
        if (active) setReviewState({ userId: sellerId, reviews, error: '' })
      } catch (error) {
        if (active) setReviewState({ userId: sellerId, reviews: [], error: error instanceof Error ? error.message : 'Không thể tải đánh giá.' })
      }
    }
    void refreshReviews()
    const timer = window.setInterval(() => { void refreshReviews() }, 30_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [api, sellerId])

  const initials = fullName.split(/\s+/).slice(-2).map((part) => part[0]).join('').toLocaleUpperCase('vi')
  const myListings = listings.filter((item) => item.sellerId === sellerId && item.status === 'ACTIVE')
  const reviews = reviewState.userId === sellerId ? reviewState.reviews : []
  const averageRating = reviews.length ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : 0

  return (
    <div className="seller-profile-page">
      <div className="breadcrumbs"><span>Trang chủ</span><span>/</span><strong>Hồ sơ người bán</strong></div>
      <section className="seller-profile-hero"><div className="seller-profile-avatar">{initials}<span><BadgeCheck size={18} fill="currentColor" /></span></div><div className="seller-profile-copy"><span className="section-eyebrow">HỒ SƠ NGƯỜI BÁN</span><h1>{fullName} <BadgeCheck size={20} /></h1><div className="profile-rating"><Star size={16} fill="currentColor" /><strong>{reviews.length ? averageRating.toFixed(1) : '—'}</strong><span>{reviews.length} đánh giá công khai</span><i /><span>Thành viên Chợ Hời</span></div><p><MapPin size={15} /> Quận 3, TP. Hồ Chí Minh</p></div><div className="profile-actions"><button className="profile-follow-button"><span>+</span> Theo dõi</button><button className="profile-signout-button" onClick={onAuth}>Đăng xuất</button></div></section>
      <div className="profile-trust-row"><span><ShieldCheck size={19} /><strong>Email đã xác thực</strong></span><span><BadgeCheck size={19} /><strong>{reviews.length} đánh giá công khai</strong></span><span><CalendarDays size={19} /><strong>Phản hồi trong ngày</strong></span></div>
      <section className="profile-listings"><div className="section-title-row"><div><span className="section-eyebrow">ĐANG TÌM CHỦ MỚI</span><h2>Tin đăng của {fullName} <small>{myListings.length}</small></h2></div></div><div className="listing-grid">{myListings.map((listing) => <ListingCard key={listing.id} listing={listing} saved={false} onOpen={onOpen} onToggleSaved={onToggleSaved} />)}</div></section>
      <section className="reviews-section"><div className="section-title-row"><div><span className="section-eyebrow">CỘNG ĐỒNG NÓI GÌ</span><h2>Đánh giá gần đây</h2></div><span className="review-summary"><Star size={16} fill="currentColor" /> {reviews.length ? `${averageRating.toFixed(1)} / 5` : 'Chưa có đánh giá'}</span></div>
        {reviewState.userId === sellerId && reviewState.error && <p className="profile-review-error" role="alert">{reviewState.error}</p>}
        {reviewState.userId !== sellerId && <p className="profile-review-empty">Đang tải đánh giá...</p>}
        {reviewState.userId === sellerId && reviews.length === 0 && !reviewState.error && <p className="profile-review-empty">Chưa có đánh giá công khai.</p>}
        <div className="review-list">{reviews.map((review) => (
          <article className="review-item" key={review.id}>
            <span className="avatar">{review.reviewerName.split(/\s+/).slice(-2).map((part) => part[0]).join('').toLocaleUpperCase('vi')}</span>
            <div><strong>{review.reviewerName} <span>·</span> <span className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></strong>
              {review.tags.length > 0 && <p>{review.tags.join(' · ')}</p>}
              {review.comment && <p>{review.comment}</p>}
              <small>Giao dịch: {review.listingTitle} · {new Date(review.createdAt).toLocaleDateString('vi-VN')}</small>
              {review.images.length > 0 && <div className="profile-review-images">{review.images.map((image) => <img key={image} src={image} alt={`Ảnh kèm đánh giá ${review.listingTitle}`} />)}</div>}
            </div>
          </article>
        ))}</div>
      </section>
    </div>
  )
}
