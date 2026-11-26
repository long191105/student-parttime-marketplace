import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, ImagePlus, Info, Lightbulb, Megaphone, ShieldCheck, Star, X } from 'lucide-react'
import { ListingDetailPreview } from '../components/ListingDetailPreview'
import type { ListingData } from '../domain/Listing'
import { categories, locations } from '../data/categories'
import { SellDropdown } from '../components/SellDropdown'
import { getProvinceWards, type LocationOption } from '../services/AdministrativeLocationApi'
import type { ListingFormDraft } from '../services/MarketplaceApi'
import { uploadImagesToCloudinary } from '../services/CloudinaryUpload'
import { formatImageUrl } from '../services/ImageUrl'

interface SellPageProps {
  restoreDraft: boolean
  onCancel: () => void
  onSubmit: (data: Omit<ListingData, 'id' | 'status' | 'views' | 'postedAt'> & { contactPhone: string }) => Promise<void> | void
  onLoadDraft: () => Promise<ListingFormDraft | null>
  onSaveDraft: (draft: ListingFormDraft) => Promise<void>
  sellerName: string
}

interface ProductPhoto {
  id: string
  src: string
}

const maxLocationLength = 160
const sellSteps = [
  { id: 1, title: 'Thông tin cơ bản', description: 'Sản phẩm và hình ảnh' },
  { id: 2, title: 'Chi tiết sản phẩm', description: 'Giá bán và tình trạng' },
  { id: 3, title: 'Khu vực & liên hệ', description: 'Địa chỉ và số điện thoại' },
  { id: 4, title: 'Kiểm tra & hoàn tất', description: 'Xem trước tin đăng' },
]

export function SellPage({ restoreDraft, onCancel, onSubmit, onLoadDraft, onSaveDraft, sellerName }: SellPageProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Điện tử')
  const [price, setPrice] = useState('')
  const [condition, setCondition] = useState<'NEW' | 'USED'>('USED')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('TP. Hồ Chí Minh')
  const [provinceCode, setProvinceCode] = useState('')
  const [wardCode, setWardCode] = useState('')
  const [detailAddress, setDetailAddress] = useState('')
  const [wards, setWards] = useState<LocationOption[]>([])
  const [isLoadingWards, setIsLoadingWards] = useState(true)
  const [locationError, setLocationError] = useState('')
  const [wardLoadAttempt, setWardLoadAttempt] = useState(0)
  const [phone, setPhone] = useState('')
  const [negotiable, setNegotiable] = useState(true)
  const [giveaway, setGiveaway] = useState(false)
  const [photos, setPhotos] = useState<ProductPhoto[]>([])
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(null)
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeStep, setActiveStep] = useState(1)
  const [isLoadingDraft, setIsLoadingDraft] = useState(restoreDraft)
  const [draftLoadAttempt, setDraftLoadAttempt] = useState(0)
  const [draftLoadError, setDraftLoadError] = useState('')
  const [draftRestored, setDraftRestored] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [draftNotice, setDraftNotice] = useState('')
  const [draftSaveError, setDraftSaveError] = useState('')
  const hasResumedDraft = useRef(false)
  const selectedWard = wards.find((ward) => String(ward.code) === wardCode)
  const baseLocation = selectedWard
    ? `${selectedWard.name}, ${location}`
    : ''
  const maxDetailAddressLength = Math.max(0, maxLocationLength - baseLocation.length - (baseLocation ? 2 : 0))
  const previewLocation = [detailAddress.trim(), baseLocation || location].filter(Boolean).join(', ')
  const parsedPreviewPrice = Number(price)
  const previewPrice = !price.trim()
    ? 'Giá chưa nhập'
    : !Number.isFinite(parsedPreviewPrice)
      ? 'Giá chưa hợp lệ'
      : parsedPreviewPrice === 0
        ? 'Thỏa thuận'
        : `${new Intl.NumberFormat('vi-VN').format(parsedPreviewPrice)} đ`

  useEffect(() => {
    if (!restoreDraft) return

    let active = true
    void onLoadDraft().then((draft) => {
      if (!active || !draft) return
      setTitle(draft.title ?? '')
      setCategory(draft.category ?? 'Điện tử')
      setPrice((draft.price ?? '').replace(/\D/g, ''))
      setCondition(draft.condition ?? 'USED')
      setDescription(draft.description ?? '')
      setLocation(draft.location ?? 'TP. Hồ Chí Minh')
      setProvinceCode(draft.provinceCode ?? '')
      setWardCode(draft.provinceCode ? draft.wardCode ?? '' : '')
      setDetailAddress(draft.detailAddress ?? '')
      setPhone(draft.phone ?? '')
      setNegotiable(draft.negotiable ?? true)
      setGiveaway(draft.giveaway ?? false)
      const savedPhotos = (draft.photos ?? []).filter((photo) => !photo.src.startsWith('data:image/'))
      setPhotos(savedPhotos)
      setCoverPhotoId(draft.coverPhotoId
        ? savedPhotos.find((photo) => photo.id === draft.coverPhotoId)?.id ?? savedPhotos[0]?.id ?? null
        : savedPhotos[0]?.id ?? null)
      setActiveStep(Math.min(4, Math.max(1, draft.activeStep ?? 1)))
      setDraftRestored(true)
    }).catch((error: unknown) => {
      if (!active) return
      console.error('Không thể tải bản nháp tin đăng.', error)
      setDraftLoadError(error instanceof Error ? error.message : 'Không thể tải bản nháp đã lưu.')
    }).finally(() => {
      if (active) setIsLoadingDraft(false)
    })

    return () => {
      active = false
    }
  }, [onLoadDraft, draftLoadAttempt, restoreDraft])

  useEffect(() => {
    if (isLoadingDraft) return
    if (typeof IntersectionObserver === 'undefined') return

    const sections = document.querySelectorAll('[data-sell-step]')
    const observer = new IntersectionObserver((entries) => {
      const currentSection = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0]
      const step = Number(currentSection?.target.getAttribute('data-sell-step'))
      if (Number.isInteger(step) && step > 0) setActiveStep(step)
    }, { rootMargin: '-18% 0px -62% 0px' })

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [isLoadingDraft])

  useEffect(() => {
    if (isLoadingDraft || !draftRestored || hasResumedDraft.current) return
    hasResumedDraft.current = true
    document.getElementById(`sell-step-${activeStep}`)?.scrollIntoView({ behavior: 'auto', block: 'start' })
  }, [activeStep, draftRestored, isLoadingDraft])

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    void getProvinceWards(location, controller.signal).then(({ province, wards: nextWards }) => {
      if (!active) return
      setProvinceCode(String(province.code))
      setWards(nextWards)
      setWardCode((current) => nextWards.some((ward) => String(ward.code) === current) ? current : '')
    }).catch((error: unknown) => {
      if (!active || isAbortError(error)) return
      console.error('Không thể tải danh sách phường/xã.', error)
      setLocationError(error instanceof Error ? error.message : 'Không thể tải danh sách phường/xã.')
    }).finally(() => {
      if (active) setIsLoadingWards(false)
    })

    return () => {
      active = false
      controller.abort()
    }
  }, [location, wardLoadAttempt])

  function navigateToStep(step: number) {
    setActiveStep(step)
    document.getElementById(`sell-step-${step}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handlePriceChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const cursorPosition = input.selectionStart ?? input.value.length
    const digitsBeforeCursor = input.value.slice(0, cursorPosition).replace(/\D/g, '').length
    const nextPrice = input.value.replace(/\D/g, '')
    setPrice(nextPrice)
    window.requestAnimationFrame(() => {
      const nextCursor = findCursorAfterDigits(formatCurrencyAmount(nextPrice), digitsBeforeCursor)
      input.setSelectionRange(nextCursor, nextCursor)
    })
  }

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
    try {
      const uploadedUrls = await uploadImagesToCloudinary(filesToProcess)
      uploadedUrls.forEach((src) => {
        nextPhotos.push({ id: crypto.randomUUID(), src })
      })
    } catch (error) {
      console.error('Không thể tải ảnh lên Cloudinary.', error)
      firstError ||= error instanceof Error ? error.message : 'Không thể tải ảnh lên Cloudinary.'
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

  function retryDraftLoad() {
    setDraftLoadError('')
    setIsLoadingDraft(true)
    setDraftLoadAttempt((attempt) => attempt + 1)
  }

  async function handleSaveDraft() {
    if (isProcessingPhotos) {
      setDraftSaveError('Vui lòng đợi ảnh được xử lý xong trước khi lưu nháp.')
      return
    }

    setIsSavingDraft(true)
    setDraftSaveError('')
    setDraftNotice('')
    try {
      const uploadablePhotos = photos.filter((photo) => photo.src.startsWith('https://'))
      if (uploadablePhotos.length !== photos.length) {
        setDraftSaveError('Chỉ lưu được ảnh đã upload lên Cloudinary. Hãy tải lại ảnh Base64.')
        setIsSavingDraft(false)
        return
      }
      await onSaveDraft({
        title,
        category,
        price,
        condition,
        location,
        fullLocation: previewLocation,
        provinceCode,
        wardCode,
        detailAddress,
        phone,
        description,
        negotiable,
        giveaway,
        photos,
        coverPhotoId,
        activeStep,
      })
      setDraftNotice('Bản nháp đã được lưu. Nếu tiếp tục chỉnh sửa, hãy lưu lại trước khi rời đi.')
    } catch (error) {
      console.error('Không thể lưu bản nháp tin đăng.', error)
      setDraftSaveError(error instanceof Error ? error.message : 'Không thể lưu bản nháp. Vui lòng thử lại.')
    } finally {
      setIsSavingDraft(false)
    }
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
    if (!giveaway && (!price.trim() || !Number.isFinite(Number(price)) || Number(price) < 0)) {
      setErrorMessage('Vui lòng nhập mức giá hợp lệ.')
      return
    }
    if (!/^\d{10,11}$/.test(phone.replace(/\D/g, ''))) {
      setErrorMessage('Số điện thoại cần có 10 hoặc 11 chữ số.')
      return
    }
    if (!provinceCode || !selectedWard) {
      setErrorMessage('Vui lòng chọn đầy đủ tỉnh/thành và phường/xã.')
      return
    }
    const fullLocation = [detailAddress.trim(), baseLocation].filter(Boolean).join(', ')
    if (fullLocation.length > maxLocationLength) {
      setErrorMessage(`Địa chỉ đầy đủ không được vượt quá ${maxLocationLength} ký tự. Vui lòng rút gọn phần chi tiết.`)
      return
    }
    const coverPhoto = photos.find((photo) => photo.id === coverPhotoId) ?? photos[0]
    const listingImages = coverPhoto
      ? [coverPhoto, ...photos.filter((photo) => photo.id !== coverPhoto.id)]
          .map((photo) => photo.src.trim())
          .filter((src) => src.startsWith('https://'))
      : []
    if (listingImages.length === 0) {
      setErrorMessage('Vui lòng tải ảnh sản phẩm mới lên. Không gửi dữ liệu ảnh cũ dạng Base64.')
      return
    }
    const sellerInitials = sellerName.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase()
    try {
      await onSubmit({
        title: title.trim(), category, price: giveaway ? 0 : Number(price), condition, location: fullLocation, contactPhone: phone.replace(/\D/g, ''), image: listingImages[0], images: listingImages,
        seller: sellerName, sellerId: 'long', sellerInitials: sellerInitials || 'BN', sellerRating: 4.9, sellerReviews: 12,
        description: description.trim(), negotiable: giveaway ? false : negotiable, giveaway, specs: [condition === 'NEW' ? 'Hàng mới' : 'Đã sử dụng'],
      })
    } catch (error) {
      console.error('Không thể đăng tin.', error)
      setErrorMessage(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lưu tin đăng.')
    }
  }

  return (
    <div className="sell-page">
      <div className="breadcrumbs"><button onClick={onCancel}><ArrowLeft size={14} /> Trang chủ</button><span>/</span><strong>Đăng tin</strong></div>
      <header className="sell-page-heading">
        <span className="sell-page-heading-icon"><Megaphone size={24} /></span>
        <div><h1>Đăng tin mới</h1><p>Điền thông tin sản phẩm để kết nối với người mua phù hợp.</p></div>
      </header>
      <form className="sell-form" onSubmit={handleSubmit}>
        <aside className="sell-step-nav" aria-label="Các bước đăng tin">
          <span className="sell-step-nav-heading">QUY TRÌNH ĐĂNG TIN</span>
          <ol>
            {sellSteps.map((step) => (
              <li key={step.id}>
                <button className={activeStep === step.id ? 'sell-step-link sell-step-link-active' : 'sell-step-link'} type="button" disabled={isLoadingDraft} aria-current={activeStep === step.id ? 'step' : undefined} onClick={() => navigateToStep(step.id)}>
                  <span className="sell-step-number">{step.id}</span>
                  <span><strong>{step.title}</strong><small>{step.description}</small></span>
                </button>
              </li>
            ))}
          </ol>
          <div className="sell-privacy-note"><ShieldCheck size={18} /><span>Thông tin của bạn được bảo mật.</span></div>
        </aside>
        <div className="sell-main">
          {isLoadingDraft && <div className="sell-draft-loading" role="status">Đang kiểm tra bản nháp đã lưu...</div>}
          {!isLoadingDraft && draftLoadError && <div className="form-error" role="alert">{draftLoadError}<button type="button" onClick={retryDraftLoad}>Thử tải lại</button></div>}
          {!isLoadingDraft && draftRestored && <div className="sell-draft-status" role="status">Đã khôi phục bản nháp trong tài khoản của bạn.</div>}
          {!isLoadingDraft && draftNotice && <div className="sell-draft-status" role="status">{draftNotice}</div>}
          {!isLoadingDraft && draftSaveError && <div className="form-error" role="alert">{draftSaveError}</div>}
          {!isLoadingDraft && <>
          <section className="form-section sell-step-section" id="sell-step-1" data-sell-step="1">
            <div className="form-section-heading"><span className="form-step">1</span><div><h2>Thông tin cơ bản</h2><p>Giúp người mua nhận biết món đồ của bạn.</p></div></div>
            <div className="form-grid">
              <SellDropdown id="listing-category" label="Danh mục sản phẩm" value={category} options={categories.map((item) => ({ value: item.name, label: item.name }))} required onChange={setCategory} />
              <label>Tiêu đề tin <input required minLength={10} maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: iPhone 13 128GB còn bảo hành" /><small>Nêu tên sản phẩm, thương hiệu hoặc mẫu mã; tối thiểu 10 ký tự.</small></label>
            </div>
            <div className="sell-field-block">
              <div className="sell-field-heading"><strong>Hình ảnh sản phẩm</strong><span>Tối đa 10 ảnh, 5 MB mỗi ảnh</span></div>
              <div className="upload-gallery">
                {photos.length > 0 && <div className="upload-cover-preview"><img src={formatImageUrl((photos.find((photo) => photo.id === coverPhotoId) ?? photos[0]).src, 800)} alt="Ảnh bìa xem trước" /><span><Check size={13} /> Ảnh bìa</span></div>}
                <div className="upload-thumbnails">
                  {photos.map((photo, index) => <div className={`upload-thumbnail${photo.id === coverPhotoId ? ' upload-thumbnail-cover' : ''}`} key={photo.id}>
                    <button className="upload-thumbnail-select" type="button" aria-label={photo.id === coverPhotoId ? `Ảnh bìa, ảnh ${index + 1}` : `Chọn ảnh ${index + 1} làm ảnh bìa`} aria-pressed={photo.id === coverPhotoId} onClick={() => setCoverPhotoId(photo.id)}>
                      <img src={formatImageUrl(photo.src, 400)} alt="" />
                      {photo.id === coverPhotoId && <span><Star size={11} fill="currentColor" /> Ảnh bìa</span>}
                    </button>
                    <button className="upload-thumbnail-remove" type="button" aria-label={`Xóa ảnh ${index + 1}`} onClick={() => removePhoto(photo.id)}><X size={12} /></button>
                  </div>)}
                  {photos.length < 10 && <label className={`upload-box${photos.length > 0 ? ' upload-box-small' : ''}`}><input type="file" accept="image/*" multiple disabled={isProcessingPhotos} onChange={(event) => void handlePhotoChange(event)} /><ImagePlus size={20} /><strong>{isProcessingPhotos ? 'Đang xử lý...' : photos.length > 0 ? 'Thêm ảnh' : 'Tải ảnh lên'}</strong>{photos.length === 0 && <span>JPG, PNG · tối đa 5 MB</span>}</label>}
                </div>
                <small className="upload-photo-count">{photos.length}/10 ảnh · Nhấn ảnh nhỏ để chọn ảnh bìa</small>
              </div>
            </div>
            <label className="form-full-label">Mô tả chi tiết <textarea required minLength={20} maxLength={2000} rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Mô tả tình trạng, đặc điểm nổi bật và lý do bạn muốn nhượng lại..." /><small>Ghi tình trạng, đặc điểm, phụ kiện đi kèm và lưu ý cho người mua; tối thiểu 20 ký tự.</small></label>
          </section>
          <section className="form-section sell-step-section" id="sell-step-2" data-sell-step="2">
            <div className="form-section-heading"><span className="form-step">2</span><div><h2>Chi tiết sản phẩm</h2><p>Thông tin rõ ràng giúp người mua dễ quyết định.</p></div></div>
            <div className="listing-type-choice" role="group" aria-label="Hình thức đăng tin">
              <button type="button" className={!giveaway ? 'listing-type-choice-active' : ''} aria-pressed={!giveaway} onClick={() => setGiveaway(false)}>Bán</button>
              <button type="button" className={giveaway ? 'listing-type-choice-active' : ''} aria-pressed={giveaway} onClick={() => setGiveaway(true)}>Tặng miễn phí</button>
            </div>
            <div className="form-grid form-grid-two">
              <label>Giá bán (đ) <input required={!giveaway} type="text" inputMode="numeric" disabled={giveaway} value={giveaway ? '0' : formatCurrencyAmount(price)} onChange={handlePriceChange} placeholder={giveaway ? 'Món đồ sẽ được tặng miễn phí' : 'Nhập giá bạn mong muốn'} /><small>{giveaway ? 'Đã chọn tặng miễn phí; không cần nhập giá.' : 'Nhập giá bằng số; dấu chấm phân cách hàng nghìn sẽ tự thêm.'}</small></label>
              <SellDropdown id="listing-condition" label="Tình trạng" value={condition} options={[{ value: 'USED', label: 'Đã sử dụng' }, { value: 'NEW', label: 'Mới' }]} required onChange={(value) => { if (value === 'USED' || value === 'NEW') setCondition(value) }} />
            </div>
            <label className="checkbox-label"><input type="checkbox" checked={negotiable} onChange={(event) => setNegotiable(event.target.checked)} /> Có thể thương lượng giá</label>
          </section>
          <section className="form-section sell-step-section" id="sell-step-3" data-sell-step="3">
            <div className="form-section-heading"><span className="form-step">3</span><div><h2>Khu vực & liên hệ</h2><p>Chọn địa điểm để người mua gần bạn dễ tìm thấy tin đăng.</p></div></div>
            <div className="form-grid form-grid-two">
              <SellDropdown id="listing-province" label="Tỉnh / thành phố" value={location} options={locations.filter((item) => item !== 'Toàn quốc').map((item) => ({ value: item, label: item }))} required onChange={(value) => { setLocation(value); setProvinceCode(''); setWards([]); setWardCode(''); setLocationError(''); setIsLoadingWards(true) }} />
              <SellDropdown id="listing-ward" label="Phường / xã" value={wardCode} options={wards.map((ward) => ({ value: String(ward.code), label: ward.name }))} placeholder={isLoadingWards ? 'Đang tải phường/xã...' : 'Chọn phường/xã'} disabled={isLoadingWards || wards.length === 0} required onChange={setWardCode} />
              <label>Số điện thoại liên hệ <input required inputMode="tel" maxLength={50} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09xx xxx xxx" /><small>Nhập số điện thoại có thể liên hệ, gồm 10–11 chữ số.</small></label>
            </div>
            <label className="form-full-label">Địa chỉ chi tiết (không bắt buộc) <textarea rows={2} maxLength={maxDetailAddressLength} value={detailAddress} onChange={(event) => setDetailAddress(event.target.value)} placeholder="Tên đường, khu dân cư, tòa nhà..." /><small>Nhập tên đường, khu dân cư hoặc tòa nhà; phường/xã và tỉnh/thành đã được chọn riêng. Có thể bỏ trống.</small></label>
            {locationError && <p className="form-error" role="alert">{locationError}<button type="button" onClick={() => { setLocationError(''); setIsLoadingWards(true); setWardLoadAttempt((attempt) => attempt + 1) }}>Thử tải lại</button></p>}
          </section>
          <section className="form-section sell-step-section" id="sell-step-4" data-sell-step="4">
            <div className="form-section-heading"><span className="form-step">4</span><div><h2>Kiểm tra & hoàn tất</h2><p>Tin đăng sẽ được kiểm duyệt trước khi hiển thị công khai.</p></div></div>
            <div className="review-notice"><Info size={17} /><span>Hãy xem lại cách tin xuất hiện trước khi gửi. Tin đăng sẽ được kiểm duyệt trước khi hiển thị công khai.</span></div>
            <div className="listing-preview-panel">
              <div className="listing-preview-heading"><div><strong>Bản xem trước chi tiết tin đăng</strong><span>Kiểm tra hình ảnh, mô tả, khu vực và thông tin liên hệ</span></div></div>
              <ListingDetailPreview
                key={coverPhotoId ?? 'no-cover'}
                title={title.trim() || 'Tiêu đề tin của bạn'}
                category={category}
                condition={condition}
                price={previewPrice}
                giveaway={giveaway}
                location={previewLocation || 'Khu vực giao dịch'}
                description={description}
                negotiable={negotiable}
                images={photos}
                coverPhotoId={coverPhotoId}
                sellerName={sellerName}
                phone={phone}
              />
            </div>
          </section>
          {errorMessage && <div className="form-error" role="alert">{errorMessage}</div>}
          </>}
        </div>
        <aside className="sell-sidebar">
          <section className="sell-side-card">
            <h2><Lightbulb size={17} /> Mẹo đăng tin hiệu quả</h2>
            <ul className="sell-tips">
              <li><Check size={15} /> Chọn đúng danh mục sản phẩm.</li>
              <li><Check size={15} /> Chụp ảnh rõ nét, đủ góc.</li>
              <li><Check size={15} /> Mô tả trung thực tình trạng.</li>
              <li><Check size={15} /> Đặt mức giá phù hợp.</li>
            </ul>
          </section>
          <section className="sell-side-card sell-side-promise">
            <h2><ShieldCheck size={17} /> Cam kết Chợ Hời</h2>
            <p>Tin đăng được kiểm duyệt để giữ môi trường mua bán an toàn và minh bạch.</p>
          </section>
          <div className="sell-side-actions">
            <button type="button" className="button-secondary sell-save-draft-button" disabled={isLoadingDraft || isSavingDraft || isProcessingPhotos} onClick={() => void handleSaveDraft()}>{isSavingDraft ? 'Đang lưu nháp...' : 'Lưu nháp'}</button>
            <button type="submit" className="button-primary" disabled={isLoadingDraft || isProcessingPhotos || activeStep !== 4}>{isProcessingPhotos ? 'Đang xử lý ảnh...' : activeStep === 4 ? 'Gửi tin chờ duyệt' : 'Xem trước ở bước 4'} {!isProcessingPhotos && activeStep === 4 && <ArrowRight size={16} />}</button>
            <button type="button" className="button-secondary" onClick={onCancel}>Hủy đăng tin</button>
          </div>
        </aside>
      </form>
    </div>
  )
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function formatCurrencyAmount(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function findCursorAfterDigits(value: string, digitCount: number): number {
  if (digitCount === 0) return 0
  let digitsFound = 0
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) digitsFound += 1
    if (digitsFound === digitCount) return index + 1
  }
  return value.length
}
