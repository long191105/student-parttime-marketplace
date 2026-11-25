import { Bookmark, Heart } from 'lucide-react'
import type { Listing } from '../domain/Listing'
import { ListingCard } from '../components/ListingCard'

interface FavoritesPageProps {
  savedListings: Listing[]
  onOpen: (listing: Listing) => void
  onToggleSaved: (id: string) => void
}

export function FavoritesPage({ savedListings, onOpen, onToggleSaved }: FavoritesPageProps) {
  return (
    <div className="favorites-page">
      <div className="workspace-heading"><div><span className="section-eyebrow">MÓN BẠN ĐANG ĐỂ Ý</span><h1>Tin đã lưu <Heart size={25} /></h1><p>Giữ lại những món hời để dễ dàng tìm thấy sau này.</p></div><span className="favorite-count"><Bookmark size={16} /> {savedListings.length} tin</span></div>
      {savedListings.length ? <div className="listing-grid">{savedListings.map((listing) => <ListingCard key={listing.id} listing={listing} saved onOpen={onOpen} onToggleSaved={onToggleSaved} />)}</div> : <div className="empty-state"><span>♡</span><h3>Chưa có tin nào được lưu</h3><p>Chạm vào biểu tượng trái tim để lưu lại món đồ bạn yêu thích.</p></div>}
    </div>
  )
}
