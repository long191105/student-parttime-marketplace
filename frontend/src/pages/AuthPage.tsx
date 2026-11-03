import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck, ShoppingBag } from 'lucide-react'
import type { AuthSession } from '../services/MarketplaceApi'

interface AuthPageProps {
  onBack: () => void
  onAuthenticate: (mode: 'login' | 'register', fullName: string, email: string, password: string, phone: string) => Promise<AuthSession>
  onSuccess: (session: AuthSession) => void
}

export function AuthPage({ onBack, onAuthenticate, onSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)
    try {
      const session = await onAuthenticate(mode, fullName, email, password, phone)
      onSuccess(session)
    } catch (error) {
      console.error('Không thể xác thực tài khoản.', error)
      setErrorMessage(error instanceof Error ? error.message : 'Không thể xác thực. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-story"><button className="auth-back" onClick={onBack}><ArrowLeft size={16} /> Về trang chủ</button><div className="auth-story-content"><span className="brand-icon"><ShoppingBag size={21} /></span><span className="section-eyebrow">CHỢ HỜI · CỘNG ĐỒNG TỬ TẾ</span><h1>Gặp đúng người.<br /><span>Trao đúng món.</span></h1><p>Một tài khoản nhỏ, thật nhiều kết nối hay quanh bạn.</p><div className="auth-story-image"><img src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=800&q=85" alt="Góc nhà ấm cúng với những món đồ được yêu thích" /><span>Những món đồ tốt<br />xứng đáng được trao tay.</span></div></div><span className="auth-story-footer">MUA BÁN QUANH BẠN · SINCE 2026</span></div>
      <section className="auth-form-side"><div className="auth-form-container"><div className="auth-brand-mobile"><span className="brand-icon"><ShoppingBag size={19} /></span><strong>chợ<span>hời</span></strong></div><div className="auth-tabs"><button className={mode === 'login' ? 'auth-tab-active' : ''} onClick={() => { setMode('login'); setErrorMessage('') }}>Đăng nhập</button><button className={mode === 'register' ? 'auth-tab-active' : ''} onClick={() => { setMode('register'); setErrorMessage('') }}>Tạo tài khoản</button></div><span className="section-eyebrow">{mode === 'login' ? 'CHÀO MỪNG BẠN TRỞ LẠI' : 'BẮT ĐẦU KẾT NỐI'}</span><h2>{mode === 'login' ? 'Đăng nhập vào Chợ Hời' : 'Tạo tài khoản miễn phí'}</h2><p className="auth-subtitle">Mua bán món đồ yêu thích, ngay gần bạn.</p>
        <form className="auth-form" onSubmit={submit}>{mode === 'register' && <><label>Họ và tên<input required maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nguyễn Minh Anh" /></label><label>Số điện thoại <span className="optional-label">(không bắt buộc)</span><input inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09xx xxx xxx" /></label></>}<label>Email<input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@email.com" /></label><label>Mật khẩu<span className="password-input"><input required type={passwordVisible ? 'text' : 'password'} minLength={mode === 'register' ? 8 : 1} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'register' ? 'Ít nhất 8 ký tự' : 'Nhập mật khẩu'} /><button type="button" aria-label="Hiện hoặc ẩn mật khẩu" onClick={() => setPasswordVisible(!passwordVisible)}>{passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>{mode === 'login' && <button className="forgot-password" type="button" onClick={() => setErrorMessage('Tính năng khôi phục mật khẩu chưa được cấu hình.')}>Quên mật khẩu?</button>}{errorMessage && <span className="form-error" role="alert">{errorMessage}</span>}<button className="button-primary auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'} <ArrowRight size={16} /></button></form>
        <div className="auth-legal"><ShieldCheck size={15} /> Mật khẩu được mã hóa trước khi lưu.</div><button className="auth-return" onClick={onBack}>← Tiếp tục khám phá không cần đăng nhập</button></div></section>
    </div>
  )
}
