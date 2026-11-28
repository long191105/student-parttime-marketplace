import { useEffect, useState, type FormEvent } from 'react'
import { Flag, ImagePlus, X } from 'lucide-react'
import { useAppDialog } from './AppDialogContext'
import type {
  CreateUserReportRequest,
  MarketplaceApi,
  UserReportReason,
  UserReportSourceType,
} from '../services/MarketplaceApi'
import { uploadImagesToCloudinary } from '../services/CloudinaryUpload'
import '../report.css'

interface ReportContext {
  sourceType: UserReportSourceType
  label: string
  reportedUserId: number
  postId?: number
  chatRoomId?: number
}

interface ReportButtonProps {
  api: MarketplaceApi
  context: ReportContext
  currentUserId: string | null
  onRequireAuth: () => void
  className?: string
}

const reasons: Array<{ value: UserReportReason; label: string }> = [
  { value: 'SCAM', label: 'Lừa đảo / Chiếm đoạt tài sản' },
  { value: 'PROHIBITED_ITEM', label: 'Đăng bán hàng cấm / Vi phạm quy định' },
  { value: 'HARASSMENT', label: 'Ngôn từ xúc phạm / Quấy rối' },
  { value: 'SPAM', label: 'Spam / Tài khoản giả mạo' },
  { value: 'OTHER', label: 'Lý do khác' },
]

export function ReportButton({ api, context, currentUserId, onRequireAuth, className }: ReportButtonProps) {
  const { showAlert } = useAppDialog()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [toast, setToast] = useState('')
  const [toastIsError, setToastIsError] = useState(false)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (currentUserId === String(context.reportedUserId)) return null

  async function submit(report: Omit<CreateUserReportRequest, 'reportedUserId' | 'sourceType' | 'postId' | 'chatRoomId'>) {
    if (isSubmitting || submitted) return
    setIsSubmitting(true)
    try {
      await api.submitUserReport({
        ...report,
        reportedUserId: context.reportedUserId,
        sourceType: context.sourceType,
        ...(context.postId !== undefined ? { postId: context.postId } : {}),
        ...(context.chatRoomId !== undefined ? { chatRoomId: context.chatRoomId } : {}),
      })
      setIsOpen(false)
      setSubmitted(true)
      setToastIsError(false)
      setToast('Báo cáo đã được gửi. Cảm ơn bạn đã giúp cộng đồng an toàn hơn.')
    } catch (error) {
      setToastIsError(true)
      setToast(error instanceof Error ? error.message : 'Không thể gửi báo cáo. Vui lòng thử lại.')
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  function openReport() {
    if (!currentUserId) {
      void showAlert('Vui lòng đăng nhập để gửi báo cáo.', 'Yêu cầu đăng nhập').then(onRequireAuth)
      return
    }
    if (!submitted) setIsOpen(true)
  }

  return (
    <>
      <button
        className={className ?? 'report-button'}
        type="button"
        onClick={openReport}
        disabled={submitted || isSubmitting}
        aria-label={submitted ? 'Đã gửi báo cáo' : 'Báo cáo người dùng'}
      >
        <Flag size={15} />
        {submitted ? 'Đã gửi báo cáo' : 'Báo cáo'}
      </button>
      {toast && <div className={`report-toast${toastIsError ? ' report-toast-error' : ''}`} role={toastIsError ? 'alert' : 'status'}>{toast}</div>}
      {isOpen && (
        <ReportModal
          contextLabel={context.label}
          isSubmitting={isSubmitting}
          onClose={() => { if (!isSubmitting) setIsOpen(false) }}
          onSubmit={submit}
        />
      )}
    </>
  )
}

interface ReportModalProps {
  contextLabel: string
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (report: Omit<CreateUserReportRequest, 'reportedUserId' | 'sourceType' | 'postId' | 'chatRoomId'>) => Promise<void>
}

export function ReportModal({ contextLabel, isSubmitting, onClose, onSubmit }: ReportModalProps) {
  const [reason, setReason] = useState<UserReportReason | ''>('')
  const [description, setDescription] = useState('')
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const loading = isSubmitting || isUploading

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [loading, onClose])

  async function addEvidence(files: FileList | null, input: HTMLInputElement) {
    if (!files?.length) return
    const selected = Array.from(files)
    input.value = ''
    if (selected.length > 3 - evidenceUrls.length) {
      setError(`Bạn chỉ có thể đính kèm tối đa 3 ảnh (${3 - evidenceUrls.length} ảnh còn lại).`)
      return
    }
    setError('')
    setIsUploading(true)
    try {
      const uploaded = await uploadImagesToCloudinary(selected)
      setEvidenceUrls((current) => [...current, ...uploaded].slice(0, 3))
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Không thể tải ảnh bằng chứng lên.')
    } finally {
      setIsUploading(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedDescription = description.trim()
    if (!reason) {
      setError('Vui lòng chọn lý do báo cáo.')
      return
    }
    if (normalizedDescription.length < 20 || normalizedDescription.length > 500) {
      setError('Mô tả báo cáo phải có từ 20 đến 500 ký tự.')
      return
    }
    if (reason === 'SCAM' && evidenceUrls.length === 0) {
      setError('Vui lòng đính kèm ít nhất một ảnh bằng chứng cho báo cáo lừa đảo.')
      return
    }
    setError('')
    try {
      await onSubmit({ reason, description: normalizedDescription, evidenceUrls })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể gửi báo cáo. Vui lòng thử lại.')
    }
  }

  return (
    <div className="report-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !loading) onClose()
    }}>
      <section className="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
        <header className="report-modal-heading">
          <div><span className="section-eyebrow">BÁO CÁO VI PHẠM</span><h2 id="report-modal-title">Gửi báo cáo</h2></div>
          <button type="button" aria-label="Đóng biểu mẫu" disabled={loading} onClick={onClose}><X size={18} /></button>
        </header>
        <div className="report-context-badge">{contextLabel}</div>
        <form onSubmit={(event) => void submit(event)}>
          <label className="report-field">
            <span>Lý do vi phạm <b>*</b></span>
            <select required value={reason} onChange={(event) => setReason(reasons.find((item) => item.value === event.target.value)?.value ?? '')}>
              <option value="" disabled>Chọn lý do báo cáo</option>
              {reasons.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="report-field">
            <span>Mô tả chi tiết <b>*</b></span>
            <textarea
              required
              minLength={20}
              maxLength={500}
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Mô tả sự việc để đội ngũ kiểm duyệt có thể xem xét..."
            />
            <small>{description.trim().length}/500 ký tự (tối thiểu 20)</small>
          </label>
          <div className="report-field">
            <span>Bằng chứng hình ảnh {reason === 'SCAM' && <b>*</b>}</span>
            <label className="report-evidence-picker">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={loading || evidenceUrls.length >= 3}
                onChange={(event) => void addEvidence(event.currentTarget.files, event.currentTarget)}
              />
              <ImagePlus size={16} /> {isUploading ? 'Đang tải ảnh...' : `Thêm ảnh (${evidenceUrls.length}/3)`}
            </label>
            <div className="report-evidence-list">
              {evidenceUrls.map((url, index) => (
                <span key={url}>
                  <img src={url} alt={`Bằng chứng ${index + 1}`} />
                  <button type="button" aria-label={`Xóa ảnh bằng chứng ${index + 1}`} disabled={loading} onClick={() => setEvidenceUrls((current) => current.filter((item) => item !== url))}><X size={13} /></button>
                </span>
              ))}
            </div>
          </div>
          {error && <p className="report-form-error" role="alert">{error}</p>}
          <footer className="report-modal-actions">
            <button type="button" className="report-cancel-button" disabled={loading} onClick={onClose}>Hủy</button>
            <button type="submit" className="report-submit-button" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
