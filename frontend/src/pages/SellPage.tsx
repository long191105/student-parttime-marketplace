import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, ImagePlus, Info, X } from 'lucide-react'
import type { ListingData } from '../domain/Listing'
import { categories } from '../data/categories'

interface SellPageProps {
  onCancel: () => void
  onSubmit: (data: Omit<ListingData, 'id' | 'status' | 'views' | 'postedAt'> & { contactPhone: string }) => Promise<void> | void
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
  const [photo, setPhoto] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn tệp hình ảnh.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Mỗi ảnh có dung lượng tối đa 5 MB.')
      return
    }
    try {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Không thể xử lý ảnh trên trình duyệt này.')
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      setPhoto(canvas.toDataURL('image/jpeg', 0.72))
      setErrorMessage('')
      bitmap.close()
    } catch (error) {
      console.error('Không thể tải ảnh tin đăng.', error)
      setErrorMessage(error instanceof Error ? error.message : 'Không thể xử lý ảnh đã chọn.')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
    try {
      await onSubmit({
        title: title.trim(), category, price: Number(price), condition, location, contactPhone: phone.replace(/\D/g, ''), image: photo || 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=900&q=85',
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
        <div className="form-section"><div className="form-section-heading"><span className="form-step">03</span><div><h2>Hình ảnh sản phẩm</h2><p>Ảnh rõ nét giúp tin đăng được quan tâm hơn. Tối đa 10 ảnh, 5 MB mỗi ảnh.</p></div></div><div className="upload-row"><label className="upload-box"><input type="file" accept="image/*" onChange={handlePhotoChange} /><ImagePlus size={22} /><strong>{photo ? 'Đổi ảnh đại diện' : 'Tải ảnh lên'}</strong><span>JPG, PNG · tối đa 5 MB</span></label>{photo && <div className="upload-preview"><img src={photo} alt="Ảnh xem trước" /><button type="button" aria-label="Xóa ảnh" onClick={() => setPhoto('')}><X size={15} /></button><span><Check size={13} /> Ảnh bìa</span></div>}</div></div>
        <div className="form-section"><div className="form-section-heading"><span className="form-step">04</span><div><h2>Khu vực & liên hệ</h2><p>Chia sẻ khu vực giao dịch để người mua gần bạn dễ kết nối.</p></div></div><div className="form-grid form-grid-two"><label>Tỉnh / thành phố, quận / huyện <select value={location} onChange={(event) => setLocation(event.target.value)}><option>Quận 3, TP. Hồ Chí Minh</option><option>Quận 1, TP. Hồ Chí Minh</option><option>Bình Thạnh, TP. Hồ Chí Minh</option><option>Cầu Giấy, Hà Nội</option><option>Đống Đa, Hà Nội</option><option>Hải Châu, Đà Nẵng</option></select></label><label>Số điện thoại liên hệ <input required inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09xx xxx xxx" /></label></div><div className="review-notice"><Info size={17} /><span>Tin đăng sẽ được gửi đến quản trị viên kiểm duyệt trước khi hiển thị công khai.</span></div></div>
        {errorMessage && <div className="form-error" role="alert">{errorMessage}</div>}
        <div className="form-actions"><button type="button" className="button-secondary" onClick={onCancel}>Hủy</button><button type="submit" className="button-primary">Gửi tin chờ duyệt <ArrowRight size={16} /></button></div>
      </form>
    </div>
  )
}
