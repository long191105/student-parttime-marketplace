import { useEffect, useMemo, useState } from 'react'
import { Eye, FilePenLine, Plus, Send, ShieldAlert, Trash2 } from 'lucide-react'
import type { Listing, ListingStatus } from '../domain/Listing'
import type { ListingFormDraft } from '../services/MarketplaceApi'
import { useAppDialog } from '../components/AppDialogContext'
import { formatImageUrl } from '../services/ImageUrl'

interface MyListingsPageProps {
  listings: Listing[]
  onStatusChange: (id: string, status: ListingStatus) => void
  onDeleteListing: (id: string) => Promise<void>
  onOpen: (listing: Listing) => void
  onSell: () => void
  onEditDraft: () => void
  sellerId: string
  onLoadDraft: () => Promise<ListingFormDraft | null>
  onDeleteDraft: () => Promise<void>
  onPublishDraft: (draft: ListingFormDraft) => Promise<void>
}

type ListingsTab = ListingStatus | 'ALL' | 'DRAFTS'

const tabs: { status: ListingsTab; label: string }[] = [
  { status: 'ALL', label: 'Tất cả tin' },
  { status: 'DRAFTS', label: 'Tin lưu nháp' },
  { status: 'PENDING', label: 'Chờ duyệt' },
  { status: 'ACTIVE', label: 'Đang hiển thị' },
  { status: 'REJECTED', label: 'Bị từ chối' },
  { status: 'SOLD', label: 'Đã bán / Ẩn' },
]

const statusNames: Record<ListingStatus, string> = {
  ACTIVE: 'Đang hiển thị', PENDING: 'Chờ duyệt', REJECTED: 'Bị từ chối', SOLD: 'Đã bán', HIDDEN: 'Đã ẩn', EXPIRED: 'Hết hạn', DELETED: 'Đã xóa',
}

export function MyListingsPage({ listings, onStatusChange, onDeleteListing, onOpen, onSell, onEditDraft, sellerId, onLoadDraft, onDeleteDraft, onPublishDraft }: MyListingsPageProps) {
  const { showConfirm } = useAppDialog()
  const [activeTab, setActiveTab] = useState<ListingsTab>('ALL')
  const [draft, setDraft] = useState<ListingFormDraft | null>(null)
  const [isLoadingDraft, setIsLoadingDraft] = useState(true)
  const [draftError, setDraftError] = useState('')
  const [draftActionError, setDraftActionError] = useState('')
  const [isDeletingDraft, setIsDeletingDraft] = useState(false)
  const [isPublishingDraft, setIsPublishingDraft] = useState(false)
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null)
  const [listingActionError, setListingActionError] = useState('')
  const myListings = listings.filter((listing) => listing.sellerId === sellerId)
  const visibleListings = useMemo(() => activeTab === 'ALL' ? myListings : myListings.filter((item) => item.status === activeTab || (activeTab === 'SOLD' && item.status === 'HIDDEN')), [activeTab, myListings])

  useEffect(() => {
    let active = true
    void onLoadDraft().then((loadedDraft) => {
      if (active) setDraft(loadedDraft)
    }).catch((error: unknown) => {
      if (!active) return
      console.error('Không thể tải bản nháp trong mục tin của tôi.', error)
      setDraftError(error instanceof Error ? error.message : 'Không thể tải tin lưu nháp.')
    }).finally(() => {
      if (active) setIsLoadingDraft(false)
    })
    return () => { active = false }
  }, [onLoadDraft])

  async function deleteDraft() {
    if (!await showConfirm('Bạn có chắc muốn xóa bản nháp này?', 'Xóa bản nháp', 'Xóa nháp')) return
    setIsDeletingDraft(true)
    setDraftActionError('')
    try {
      await onDeleteDraft()
      setDraft(null)
    } catch (error) {
      console.error('Không thể xóa bản nháp.', error)
      setDraftActionError(error instanceof Error ? error.message : 'Không thể xóa bản nháp.')
    } finally {
      setIsDeletingDraft(false)
    }
  }

  async function publishDraft() {
    if (!draft) return
    if (!await showConfirm('Gửi bản nháp này để quản trị viên kiểm duyệt?', 'Gửi tin đăng', 'Gửi chờ duyệt')) return
    setIsPublishingDraft(true)
    setDraftActionError('')
    try {
      await onPublishDraft(draft)
      setDraft(null)
    } catch (error) {
      console.error('Không thể gửi bản nháp chờ duyệt.', error)
      setDraftActionError(error instanceof Error ? error.message : 'Không thể gửi bản nháp. Hãy kiểm tra và bổ sung thông tin.')
    } finally {
      setIsPublishingDraft(false)
    }
  }

  async function deleteHiddenListing(listing: Listing) {
    if (!await showConfirm(`Xóa tin “${listing.title}” khỏi danh sách của bạn?`, 'Xóa tin đã ẩn', 'Xóa tin')) return
    setDeletingListingId(listing.id)
    setListingActionError('')
    try {
      await onDeleteListing(listing.id)
    } catch (error) {
      console.error('Không thể xóa tin đã ẩn.', error)
      setListingActionError(error instanceof Error ? error.message : 'Không thể xóa tin đăng. Vui lòng thử lại.')
    } finally {
      setDeletingListingId(null)
    }
  }

  const draftImage = draft?.photos?.find((photo) => photo.id === draft.coverPhotoId)?.src ?? draft?.photos?.[0]?.src
  const draftPrice = Number(draft?.price)
  const draftPriceLabel = draft?.giveaway
    ? 'Miễn phí'
    : !draft?.price?.trim()
    ? 'Chưa nhập giá'
    : Number.isFinite(draftPrice)
      ? draftPrice === 0 ? 'Thỏa thuận' : `${new Intl.NumberFormat('vi-VN').format(draftPrice)} đ`
      : 'Giá chưa hợp lệ'

  return (
    <div className="my-listings-page">
      <div className="workspace-heading"><div><span className="section-eyebrow">GÓC CỦA BẠN</span><h1>Tin đăng của tôi</h1><p>Theo dõi và quản lý những món đồ bạn đang trao tay.</p></div><button className="button-primary" onClick={onSell}><Plus size={17} /> Đăng tin mới</button></div>
      <div className="management-tabs">{tabs.map((tab) => <button key={tab.status} className={activeTab === tab.status ? 'management-tab-active' : ''} onClick={() => setActiveTab(tab.status)}>{tab.label}<span>{tab.status === 'ALL' ? myListings.length : tab.status === 'DRAFTS' ? draft ? 1 : 0 : myListings.filter((item) => item.status === tab.status || (tab.status === 'SOLD' && item.status === 'HIDDEN')).length}</span></button>)}</div>
      {activeTab === 'DRAFTS' && <div className="my-listings-list">
        {isLoadingDraft && <div className="empty-state"><p>Đang tải tin lưu nháp...</p></div>}
        {!isLoadingDraft && draftError && <div className="draft-list-error" role="alert">{draftError}</div>}
        {!isLoadingDraft && draftActionError && <div className="draft-list-error" role="alert">{draftActionError}</div>}
        {!isLoadingDraft && draft && <article className="my-listing-row draft-listing-row">
          <button className="my-listing-image" type="button" onClick={onEditDraft} aria-label="Mở bản nháp để chỉnh sửa">
            {draftImage ? <img src={draftImage} alt={draft.title || 'Ảnh bản nháp'} /> : <span className="draft-image-placeholder">Chưa có ảnh</span>}
          </button>
          <div className="my-listing-content">
            <span className="draft-status-pill">Bản nháp</span>
            <strong className="draft-listing-title">{draft.title.trim() || 'Tin chưa có tiêu đề'}</strong>
            <span className="draft-listing-meta">{draft.category || 'Chưa chọn danh mục'} · {draft.location || 'Chưa chọn khu vực'}</span>
            <strong>{draftPriceLabel}</strong>
          </div>
          <div className="my-listing-actions draft-listing-actions">
            <button type="button" className="row-action-primary" disabled={isDeletingDraft || isPublishingDraft} onClick={onEditDraft}><FilePenLine size={13} /> Sửa nháp</button>
            <button type="button" className="row-action-primary" disabled={isDeletingDraft || isPublishingDraft} onClick={() => void publishDraft()}><Send size={13} /> {isPublishingDraft ? 'Đang gửi...' : 'Gửi chờ duyệt'}</button>
            <button type="button" disabled={isDeletingDraft || isPublishingDraft} onClick={() => void deleteDraft()}><Trash2 size={13} /> {isDeletingDraft ? 'Đang xóa...' : 'Xóa'}</button>
          </div>
        </article>}
        {!isLoadingDraft && !draftError && !draft && <div className="empty-state"><span>✎</span><h3>Chưa có tin lưu nháp</h3><p>Bạn có thể lưu thông tin đang điền để hoàn thiện và đăng sau.</p><button className="button-primary" onClick={onSell}>Tạo tin mới</button></div>}
      </div>}
      {activeTab !== 'DRAFTS' && <>
      {listingActionError && <div className="draft-list-error" role="alert">{listingActionError}</div>}
      <div className="my-listings-list">
        {visibleListings.map((listing) => <article className="my-listing-row" key={listing.id}>
          <button className="my-listing-image" onClick={() => onOpen(listing)}><img src={formatImageUrl(listing.image, 400)} alt={listing.title} /></button>
          <div className="my-listing-content"><span className={`status-pill status-${listing.status.toLowerCase()}`}><i />{statusNames[listing.status]}</span><button className="my-listing-title" onClick={() => onOpen(listing)}>{listing.title}</button><strong>{listing.priceLabel}</strong><span className="my-listing-date">{listing.postedAt} <span>·</span> <Eye size={14} /> {listing.views} lượt xem</span>{listing.status === 'REJECTED' && <span className="reject-reason"><ShieldAlert size={14} /> {listing.reviewReason ?? 'Tin đăng chưa đạt tiêu chuẩn, vui lòng chỉnh sửa và gửi lại.'}</span>}</div>
          {(listing.status === 'ACTIVE' || listing.status === 'HIDDEN' || listing.status === 'PENDING') && <div className="my-listing-actions">
            {listing.status === 'ACTIVE' && <>
              <span className="muted-status">Xác nhận đã bán cho người mua trong cuộc trò chuyện để mở đánh giá.</span>
              <button className="row-action" onClick={() => onStatusChange(listing.id, 'HIDDEN')}>Ẩn tin</button>
            </>}
            {listing.status === 'HIDDEN' && <>
              <button className="row-action" disabled={deletingListingId === listing.id} onClick={() => onStatusChange(listing.id, 'ACTIVE')}>Hiển thị lại</button>
              <button className="row-action" disabled={deletingListingId === listing.id} onClick={() => void deleteHiddenListing(listing)}><Trash2 size={12} />{deletingListingId === listing.id ? 'Đang xóa...' : 'Xóa'}</button>
            </>}
            {listing.status === 'PENDING' && <span className="muted-status">Đang được kiểm duyệt</span>}
          </div>}
        </article>)}
        {!visibleListings.length && <div className="empty-state"><span>♡</span><h3>Chưa có tin trong mục này</h3><p>Đăng món đồ đầu tiên để bắt đầu nhé.</p><button className="button-primary" onClick={onSell}>Đăng tin ngay</button></div>}
      </div>
      </>}
      <div className="listings-tip"><span>✦</span><div><strong>Mẹo nhỏ để tin bán nhanh hơn</strong><p>Thêm ảnh sáng rõ và mô tả chi tiết giúp người mua dễ hình dung món đồ.</p></div></div>
    </div>
  )
}
