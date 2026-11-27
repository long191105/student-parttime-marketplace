import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, CalendarDays, Camera, MapPin, ShieldCheck, Star, Users } from 'lucide-react'
import type { Listing } from '../domain/Listing'
import { ListingCard } from '../components/ListingCard'
import type { ChatReview, MarketplaceApi, UserProfile } from '../services/MarketplaceApi'
import { uploadImageToCloudinary } from '../services/CloudinaryUpload'

interface ProfilePageProps {
  listings: Listing[]
  onOpen: (listing: Listing) => void
  onToggleSaved: (id: string) => void
  onRequireAuth: () => void
  onSignOut: () => void
  fullName: string
  sellerId: string
  currentUserId: string | null
  api: MarketplaceApi
}

export function ProfilePage({ listings, onOpen, onToggleSaved, onRequireAuth, onSignOut, fullName, sellerId, currentUserId, api }: ProfilePageProps) {
  const [profileState, setProfileState] = useState<{ userId: string; profile: UserProfile | null; error: string }>({ userId: '', profile: null, error: '' })
  const [followError, setFollowError] = useState('')
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false)
  const [reviewState, setReviewState] = useState<{ userId: string; reviews: ChatReview[]; error: string }>({ userId: '', reviews: [], error: '' })
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    void api.getUserProfile(sellerId).then((profile) => {
      if (active) setProfileState({ userId: sellerId, profile, error: '' })
    }).catch((error: unknown) => {
      if (active) setProfileState({
        userId: sellerId,
        profile: null,
        error: error instanceof Error ? error.message : 'Không thể tải hồ sơ người dùng.',
      })
    })
    return () => { active = false }
  }, [api, sellerId])

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

  const profile = profileState.userId === sellerId ? profileState.profile : null
  const profileName = profile?.fullName ?? (fullName || 'Hồ sơ người dùng')
  const isOwnProfile = profile?.currentUser ?? currentUserId === sellerId
  const isFollowing = profile?.following ?? false
  const initials = profileName.split(/\s+/).slice(-2).map((part) => part[0]).join('').toLocaleUpperCase('vi')
  const myListings = listings.filter((item) => item.sellerId === sellerId && item.status === 'ACTIVE')
  const reviews = reviewState.userId === sellerId ? reviewState.reviews : []
  const averageRating = reviews.length ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : 0

  async function toggleFollow() {
    if (!currentUserId) {
      onRequireAuth()
      return
    }
    if (isOwnProfile || !profile || isUpdatingFollow) return
    setIsUpdatingFollow(true)
    setFollowError('')
    try {
      const updatedProfile = isFollowing
        ? await api.unfollowUser(sellerId)
        : await api.followUser(sellerId)
      setProfileState({ userId: sellerId, profile: updatedProfile, error: '' })
    } catch (error) {
      setFollowError(error instanceof Error ? error.message : 'Không thể cập nhật theo dõi. Vui lòng thử lại.')
    } finally {
      setIsUpdatingFollow(false)
    }
  }

  async function changeAvatar(file: File | undefined) {
    if (!file || !isOwnProfile || isUpdatingAvatar) return
    setIsUpdatingAvatar(true)
    setAvatarError('')
    try {
      const avatarUrl = await uploadImageToCloudinary(file)
      const updatedProfile = await api.updateUserAvatar(sellerId, avatarUrl)
      setProfileState({ userId: sellerId, profile: updatedProfile, error: '' })
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại.')
    } finally {
      setIsUpdatingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  return (
    <div className="seller-profile-page">
      <div className="breadcrumbs"><span>Trang chủ</span><span>/</span><strong>Hồ sơ người bán</strong></div>
      <section className="seller-profile-hero"><div className="seller-profile-avatar">{profile?.avatarUrl ? <img className="seller-profile-avatar-image" src={profile.avatarUrl} alt={`Ảnh đại diện của ${profileName}`} /> : initials}{isOwnProfile && <><input ref={avatarInputRef} className="seller-profile-avatar-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Chọn ảnh đại diện" onChange={(event) => void changeAvatar(event.currentTarget.files?.[0])} /><button className="seller-profile-avatar-edit" type="button" aria-label="Thay đổi ảnh đại diện" title={isUpdatingAvatar ? 'Đang tải ảnh...' : 'Thay đổi ảnh đại diện'} disabled={isUpdatingAvatar} onClick={() => avatarInputRef.current?.click()}><Camera size={14} /></button></>}<span><BadgeCheck size={18} fill="currentColor" /></span></div><div className="seller-profile-copy"><span className="section-eyebrow">HỒ SƠ NGƯỜI BÁN</span><h1>{profileName} <BadgeCheck size={20} /></h1><div className="profile-rating"><Star size={16} fill="currentColor" /><strong>{reviews.length ? averageRating.toFixed(1) : '—'}</strong><span>{reviews.length} đánh giá công khai</span><i /><span>Thành viên Chợ Hời</span></div><p><MapPin size={15} /> Quận 3, TP. Hồ Chí Minh</p></div><div className="profile-actions">{isOwnProfile ? <button className="profile-signout-button" onClick={onSignOut}>Đăng xuất</button> : <button className="profile-follow-button" type="button" aria-pressed={isFollowing} disabled={isUpdatingFollow || !profile} onClick={() => void toggleFollow()}><span>{isFollowing ? '✓' : '+'}</span>{isUpdatingFollow ? 'Đang cập nhật...' : isFollowing ? 'Đang theo dõi' : 'Theo dõi'}</button>}</div></section>
      {isUpdatingAvatar && <p className="profile-review-empty" role="status">Đang cập nhật ảnh đại diện...</p>}
      {profileState.userId === sellerId && profileState.error && <p className="profile-review-error" role="alert">{profileState.error}</p>}
      {followError && <p className="profile-review-error" role="alert">{followError}</p>}
      {avatarError && <p className="profile-review-error" role="alert">{avatarError}</p>}
      <div className="profile-trust-row"><span><ShieldCheck size={19} /><strong>Email đã xác thực</strong></span><span><BadgeCheck size={19} /><strong>{reviews.length} đánh giá công khai</strong></span><span><Users size={19} /><strong>{profile ? `${profile.followerCount.toLocaleString('vi-VN')} người theo dõi` : 'Đang tải người theo dõi...'}</strong></span><span><CalendarDays size={19} /><strong>Phản hồi trong ngày</strong></span></div>
      <section className="profile-listings"><div className="section-title-row"><div><span className="section-eyebrow">ĐANG TÌM CHỦ MỚI</span><h2>Tin đăng của {profileName} <small>{myListings.length}</small></h2></div></div><div className="listing-grid">{myListings.map((listing) => <ListingCard key={listing.id} listing={listing} saved={false} onOpen={onOpen} onToggleSaved={onToggleSaved} />)}</div></section>
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
