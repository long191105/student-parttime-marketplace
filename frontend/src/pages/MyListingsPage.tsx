import { useMemo, useState } from 'react'
import { ArrowUpRight, Eye, Pencil, Plus, ShieldAlert } from 'lucide-react'
import type { Listing, ListingStatus } from '../domain/Listing'

interface MyListingsPageProps {
  listings: Listing[]
  onStatusChange: (id: string, status: ListingStatus) => void
  onOpen: (listing: Listing) => void
  onSell: () => void
  sellerId: string
}

const tabs: { status: ListingStatus | 'ALL'; label: string }[] = [
  { status: 'ALL', label: 'Tất cả tin' },
  { status: 'PENDING', label: 'Chờ duyệt' },
  { status: 'ACTIVE', label: 'Đang hiển thị' },
  { status: 'REJECTED', label: 'Bị từ chối' },
  { status: 'SOLD', label: 'Đã bán / Ẩn' },
]

const statusNames: Record<ListingStatus, string> = {
  ACTIVE: 'Đang hiển thị', PENDING: 'Chờ duyệt', REJECTED: 'Bị từ chối', SOLD: 'Đã bán', HIDDEN: 'Đã ẩn', EXPIRED: 'Hết hạn',
}

export function MyListingsPage({ listings, onStatusChange, onOpen, onSell, sellerId }: MyListingsPageProps) {
  const [activeTab, setActiveTab] = useState<ListingStatus | 'ALL'>('ALL')
  const myListings = listings.filter((listing) => listing.sellerId === sellerId)
  const visibleListings = useMemo(() => activeTab === 'ALL' ? myListings : myListings.filter((item) => item.status === activeTab || (activeTab === 'SOLD' && item.status === 'HIDDEN')), [activeTab, myListings])

  return (
    <div className="my-listings-page">
      <div className="workspace-heading"><div><span className="section-eyebrow">GÓC CỦA BẠN</span><h1>Tin đăng của tôi</h1><p>Theo dõi và quản lý những món đồ bạn đang trao tay.</p></div><button className="button-primary" onClick={onSell}><Plus size={17} /> Đăng tin mới</button></div>
      <div className="management-tabs">{tabs.map((tab) => <button key={tab.status} className={activeTab === tab.status ? 'management-tab-active' : ''} onClick={() => setActiveTab(tab.status)}>{tab.label}<span>{tab.status === 'ALL' ? myListings.length : myListings.filter((item) => item.status === tab.status || (tab.status === 'SOLD' && item.status === 'HIDDEN')).length}</span></button>)}</div>
      <div className="my-listings-list">
        {visibleListings.map((listing) => <article className="my-listing-row" key={listing.id}>
          <button className="my-listing-image" onClick={() => onOpen(listing)}><img src={listing.image} alt={listing.title} /></button>
          <div className="my-listing-content"><span className={`status-pill status-${listing.status.toLowerCase()}`}><i />{statusNames[listing.status]}</span><button className="my-listing-title" onClick={() => onOpen(listing)}>{listing.title}</button><strong>{listing.priceLabel}</strong><span className="my-listing-date">{listing.postedAt} <span>·</span> <Eye size={14} /> {listing.views} lượt xem</span>{listing.status === 'REJECTED' && <span className="reject-reason"><ShieldAlert size={14} /> {listing.reviewReason ?? 'Tin đăng chưa đạt tiêu chuẩn, vui lòng chỉnh sửa và gửi lại.'}</span>}</div>
          <div className="my-listing-actions">{listing.status === 'REJECTED' ? <button className="row-action-primary" onClick={() => onStatusChange(listing.id, 'PENDING')}><Pencil size={14} /> Sửa & gửi lại</button> : listing.status === 'ACTIVE' ? <><button className="row-action-primary" onClick={() => onStatusChange(listing.id, 'SOLD')}>Đánh dấu đã bán</button><button className="row-action" onClick={() => onStatusChange(listing.id, 'HIDDEN')}>Ẩn tin</button><button className="row-action" onClick={() => onStatusChange(listing.id, 'ACTIVE')}><ArrowUpRight size={14} /> Đẩy tin</button></> : listing.status === 'PENDING' ? <span className="muted-status">Đang được kiểm duyệt</span> : <button className="row-action" onClick={() => onStatusChange(listing.id, 'ACTIVE')}>Hiển thị lại</button>}</div>
        </article>)}
        {!visibleListings.length && <div className="empty-state"><span>♡</span><h3>Chưa có tin trong mục này</h3><p>Đăng món đồ đầu tiên để bắt đầu nhé.</p><button className="button-primary" onClick={onSell}>Đăng tin ngay</button></div>}
      </div>
      <div className="listings-tip"><span>✦</span><div><strong>Mẹo nhỏ để tin bán nhanh hơn</strong><p>Thêm ảnh sáng rõ và mô tả chi tiết giúp người mua dễ hình dung món đồ.</p></div></div>
    </div>
  )
}
