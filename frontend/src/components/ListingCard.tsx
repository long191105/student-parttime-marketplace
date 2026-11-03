import { Heart, MapPin, Star } from 'lucide-react'
import type { Listing } from '../domain/Listing'

interface ListingCardProps {
  listing: Listing
  saved: boolean
  onOpen: (listing: Listing) => void
  onToggleSaved: (id: string) => void
}

export function ListingCard({ listing, saved, onOpen, onToggleSaved }: ListingCardProps) {
  return (
    <article className="listing-card">
      <button className="listing-image-button" type="button" onClick={() => onOpen(listing)} aria-label={`Xem ${listing.title}`}>
        <img src={listing.image} alt={listing.title} loading="lazy" />
        {listing.condition === 'NEW' && <span className="condition-tag">Mới</span>}
      </button>
      <button className={`save-button ${saved ? 'is-saved' : ''}`} type="button" aria-label={saved ? 'Bỏ lưu tin' : 'Lưu tin'} onClick={() => onToggleSaved(listing.id)}><Heart size={18} fill={saved ? 'currentColor' : 'none'} /></button>
      <button className="listing-card-info" type="button" onClick={() => onOpen(listing)}>
        <span className="listing-category">{listing.category}<span>·</span>{listing.conditionLabel}</span>
        <strong className="listing-title">{listing.title}</strong>
        <span className="listing-price">{listing.priceLabel}</span>
        <span className="listing-card-meta"><MapPin size={13} />{listing.location} <span>·</span> {listing.postedAt}</span>
        <span className="listing-seller"><span className="avatar avatar-small">{listing.sellerInitials}</span>{listing.seller}<span className="seller-rating"><Star size={12} fill="currentColor" />{listing.sellerRating.toFixed(1)}</span></span>
      </button>
    </article>
  )
}
