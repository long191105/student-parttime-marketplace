import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, ImagePlus, Info, Star, X } from 'lucide-react'
import type { ListingData } from '../domain/Listing'
import { categories } from '../data/categories'

interface SellPageProps {
  onCancel: () => void
  onSubmit: (data: Omit<ListingData, 'id' | 'status' | 'views' | 'postedAt'> & { contactPhone: string }) => Promise<void> | void
}

interface ProductPhoto {
  id: string
  src: string
}

export function SellPage({ onCancel, onSubmit }: SellPageProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Điện tử')
  const [price, setPrice] = useState('')
  const [condition, setCondition] = useState<'NEW' | 'USED'>('USED')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('Quận 3, TP. Hồ Chí Minh')
  const [phone, setPhone] = useState('')
  const [negotiable, setNegotiable] = useState(true)
  const [photos, setPhotos] = useState<ProductPhoto[]>([])
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(null)
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return
    const availableSlots = 10 - photos.length
    if (availableSlots <= 0) {
      setErrorMessage('Bạn đã thêm tối đa 10 ảnh cho tin đăng.')
      return
    }

    const filesToProcess = files.slice(0, availableSlots)
    const nextPhotos: ProductPhoto[] = []
    let firstError = files.length > availableSlots ? 'Mỗi tin đăng chỉ được thêm tối đa 10 ảnh.' : ''
    setIsProcessingPhotos(true)
    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) {
        firstError ||= `${file.name}: vui lòng chọn tệp hình ảnh.`
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        firstError ||= `${file.name}: ảnh có dung lượng tối đa 5 MB.`
        continue
      }

      let bitmap: ImageBitmap | undefined
      try {
        bitmap = await createImageBitmap(file)
        const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(bitmap.width * scale)
        canvas.height = Math.round(bitmap.height * scale)
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Không thể xử lý ảnh trên trình duyệt này.')
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        nextPhotos.push({ id: crypto.randomUUID(), src: canvas.toDataURL('image/jpeg', 0.72) })
      } catch (error) {
        console.error(`Không thể tải ảnh "${file.name}".`, error)
        firstError ||= error instanceof Error ? `${file.name}: ${error.message}` : `Không thể xử lý ảnh "${file.name}".`
      } finally {
        bitmap?.close()
      }
    }

    if (nextPhotos.length > 0) {
      setPhotos((current) => [...current, ...nextPhotos])
      setCoverPhotoId((current) => current ?? nextPhotos[0].id)
    }
    setIsProcessingPhotos(false)
    setErrorMessage(firstError)
  }

  function removePhoto(photoId: string) {
    const nextPhotos = photos.filter((photo) => photo.id !== photoId)
    setPhotos(nextPhotos)
    if (coverPhotoId === photoId) setCoverPhotoId(nextPhotos[0]?.id ?? null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isProcessingPhotos) {
      setErrorMessage('Vui lòng đợi ảnh được xử lý xong trước khi đăng tin.')
      return
    }
    if (title.trim().length < 10) {
      setErrorMessage('Tiêu đề cần có ít nhất 10 ký tự.')
      return
    }
    if (description.trim().length < 20) {
      setErrorMessage('Mô tả cần có ít nhất 20 ký tự.')
      return
    }
    if (!Number(price) || Number(price) < 0) {
      setErrorMessage('Vui lòng nhập mức giá hợp lệ.')
      return
    }
    if (!/^\d{10,11}$/.test(phone.replace(/\D/g, ''))) {
      setErrorMessage('Số điện thoại cần có 10 hoặc 11 chữ số.')
      return
    }
    const user = { name: 'Long Nguyễn', id: 'long', initials: 'LN' }
    const coverPhoto = photos.find((photo) => photo.id === coverPhotoId) ?? photos[0]
    const listingImages = coverPhoto
      ? [coverPhoto, ...photos.filter((photo) => photo.id !== coverPhoto.id)].map((photo) => photo.src)
      : ['https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=900&q=85']
    try {
      await onSubmit({
        title: title.trim(), category, price: Number(price), condition, location, contactPhone: phone.replace(/\D/g, ''), image: listingImages[0], images: listingImages,
        seller: user.name, sellerId: user.id, sellerInitials: user.initials, sellerRating: 4.9, sellerReviews: 12,
        description: description.trim(), negotiable, specs: [condition === 'NEW' ? 'Hàng mới' : 'Đã sử dụng'],
      })
    } catch (error) {
      console.error('Không thể đăng tin.', error)
      setErrorMessage(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lưu tin đăng.')
    }
  }

  return (
    <div className="sell-page">
      <div className="breadcrumbs"><button onClick={onCancel}><ArrowLeft size={14} /> Trang chủ</button><span>/</span><strong>Đăng tin</strong></div>
      <div className="sell-heading"><span className="section-eyebrow">BÁN ĐỒ, TRAO NIỀM VUI</span><h1>Đăng tin mới</h1><p>Chia sẻ món đồ bạn không còn dùng với người đang cần.</p></div>
      <form className="sell-form" onSubmit={handleSubmit}>
        <div className="form-section"><div className="form-section-heading"><span className="form-step">01</span><div><h2>Danh mục sản phẩm</h2><p>Chọn danh mục phù hợp để người mua dễ tìm thấy tin của bạn.</p></div></div><div className="form-grid"><label>Danh mục <select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item.name}>{item.name}</option>)}</select></label><label>Tiêu đề tin <input required minLength={10} maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: iPhone 13 128GB còn bảo hành" /><small>{title.length}/150 ký tự</small></label></div></div>
        <div className="form-section"><div className="form-section-heading"><span className="form-step">02</span><div><h2>Thông tin món đồ</h2><p>Mô tả rõ ràng giúp bạn tìm đúng người mua hơn.</p></div></div><div className="form-grid form-grid-two"><label>Giá bán (đ) <input required type="number" min="0" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Nhập giá bạn mong muốn" /></label><label>Tình trạng <select value={condition} onChange={(event) => setCondition(event.target.value as 'NEW' | 'USED')}><option value="USED">Đã sử dụng</option><option value="NEW">Mới</option></select></label></div><label className="form-full-label">Mô tả chi tiết <textarea required minLength={20} maxLength={2000} rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Mô tả tình trạng, đặc điểm nổi bật và lý do bạn muốn nhượng lại..." /><small>{description.length}/2000 ký tự</small></label><label className="checkbox-label"><input type="checkbox" checked={negotiable} onChange={(event) => setNegotiable(event.target.checked)} /> Có thể thương lượng giá</label></div>
        <div className="form-section"><div className="form-section-heading"><span className="form-step">03</span><div><h2>Hình ảnh sản phẩm</h2><p>Ảnh rõ nét giúp tin đăng được quan tâm hơn. Tối đa 10 ảnh, 5 MB mỗi ảnh.</p></div></div><div className="upload-gallery">
          {photos.length > 0 && <div className="upload-cover-preview"><img src={(photos.find((photo) => photo.id === coverPhotoId) ?? photos[0]).src} alt="Ảnh bìa xem trước" /><span><Check size={13} /> Ảnh bìa</span></div>}
          <div className="upload-thumbnails">
            {photos.map((photo, index) => <div className={`upload-thumbnail${photo.id === coverPhotoId ? ' upload-thumbnail-cover' : ''}`} key={photo.id}>
              <button className="upload-thumbnail-select" type="button" aria-label={photo.id === coverPhotoId ? `Ảnh bìa, ảnh ${index + 1}` : `Chọn ảnh ${index + 1} làm ảnh bìa`} aria-pressed={photo.id === coverPhotoId} onClick={() => setCoverPhotoId(photo.id)}><img src={photo.src} alt="" />{photo.id === coverPhotoId && <span><Star size={11} fill="currentColor" /> Ảnh bìa</span>}</button>
              <button className="upload-thumbnail-remove" type="button" aria-label={`Xóa ảnh ${index + 1}`} onClick={() => removePhoto(photo.id)}><X size={12} /></button>
            </div>)}
            {photos.length < 10 && <label className={`upload-box${photos.length > 0 ? ' upload-box-small' : ''}`}><input type="file" accept="image/*" multiple disabled={isProcessingPhotos} onChange={(event) => void handlePhotoChange(event)} /><ImagePlus size={20} /><strong>{isProcessingPhotos ? 'Đang xử lý...' : photos.length > 0 ? 'Thêm ảnh' : 'Tải ảnh lên'}</strong>{photos.length === 0 && <span>JPG, PNG · tối đa 5 MB</span>}</label>}
          </div>
          <small className="upload-photo-count">{photos.length}/10 ảnh · Nhấn ảnh nhỏ để chọn ảnh bìa</small>
        </div></div>
        <div className="form-section"><div className="form-section-heading"><span className="form-step">04</span><div><h2>Khu vực & liên hệ</h2><p>Chia sẻ khu vực giao dịch để người mua gần bạn dễ kết nối.</p></div></div><div className="form-grid form-grid-two"><label>Tỉnh / thành phố, quận / huyện <select value={location} onChange={(event) => setLocation(event.target.value)}><option>Quận 3, TP. Hồ Chí Minh</option><option>Quận 1, TP. Hồ Chí Minh</option><option>Bình Thạnh, TP. Hồ Chí Minh</option><option>Cầu Giấy, Hà Nội</option><option>Đống Đa, Hà Nội</option><option>Hải Châu, Đà Nẵng</option></select></label><label>Số điện thoại liên hệ <input required inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09xx xxx xxx" /></label></div><div className="review-notice"><Info size={17} /><span>Tin đăng sẽ được gửi đến quản trị viên kiểm duyệt trước khi hiển thị công khai.</span></div></div>
        {errorMessage && <div className="form-error" role="alert">{errorMessage}</div>}
        <div className="form-actions"><button type="button" className="button-secondary" onClick={onCancel}>Hủy</button><button type="submit" className="button-primary" disabled={isProcessingPhotos}>{isProcessingPhotos ? 'Đang xử lý ảnh...' : 'Gửi tin chờ duyệt'} {!isProcessingPhotos && <ArrowRight size={16} />}</button></div>
      </form>
    </div>
  )
}
