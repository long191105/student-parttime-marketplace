import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, BadgeCheck, Eye, EyeOff, Heart, LockKeyhole, Package, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react'
import { ChoHoiWordmark } from '../components/ChoHoiWordmark'
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
      <section className="auth-story">
        <button className="auth-back" onClick={onBack}><ArrowLeft size={16} /> Về trang chủ</button>
        <div className="auth-story-content">
          <div className="auth-brand"><span className="auth-brand-icon"><ShoppingBag size={20} /></span><ChoHoiWordmark className="auth-wordmark" /></div>
          <span className="auth-kicker"><Sparkles size={13} /> CHỢ HỜI · CỘNG ĐỒNG TỬ TẾ</span>
          <h1>Đồ tốt tìm<br />được <span>chủ mới.</span></h1>
          <p>Thêm một kết nối hay. Thêm một món đồ được yêu thương.</p>
          <div className="auth-art" aria-hidden="true">
            <div className="auth-art-orbit auth-art-orbit-one" />
            <div className="auth-art-orbit auth-art-orbit-two" />
            <div className="auth-art-platform auth-art-platform-back" />
            <div className="auth-art-platform auth-art-platform-front" />
            <div className="auth-art-bag auth-art-bag-back"><span /><i><Package size={23} /></i></div>
            <div className="auth-art-bag auth-art-bag-front"><span /><i><ShoppingBag size={30} /></i><b>chợ hời</b></div>
            <div className="auth-float-card auth-float-card-top"><span><BadgeCheck size={16} /></span><div><strong>Món đồ tốt</strong><small>Trao tay đúng người</small></div></div>
            <div className="auth-float-card auth-float-card-bottom"><Heart size={16} fill="currentColor" /><span>Gần bạn, thật tiện</span></div>
            <span className="auth-art-spark auth-art-spark-one">✦</span>
            <span className="auth-art-spark auth-art-spark-two">✳</span>
          </div>
          <div className="auth-story-note"><span className="auth-note-check"><ShieldCheck size={15} /></span><span><strong>Mua bán an tâm</strong><small>Tin đăng được kiểm duyệt bởi cộng đồng</small></span></div>
        </div>
        <span className="auth-story-footer">MUA BÁN QUANH BẠN · TRAO ĐIỀU TỐT ĐẸP</span>
      </section>
      <section className="auth-form-side">
        <div className="auth-form-container">
          <div className="auth-mobile-heading">
            <div className="auth-brand"><span className="auth-brand-icon"><ShoppingBag size={19} /></span><ChoHoiWordmark className="auth-wordmark" /></div>
            <button className="auth-mobile-back" onClick={onBack}><ArrowLeft size={15} /> Khám phá</button>
          </div>
          <div className="auth-form-card">
            <div className="auth-tabs" role="tablist" aria-label="Chọn hình thức tài khoản">
              <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'auth-tab-active' : ''} onClick={() => { setMode('login'); setErrorMessage('') }}>Đăng nhập</button>
              <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'auth-tab-active' : ''} onClick={() => { setMode('register'); setErrorMessage('') }}>Tạo tài khoản</button>
            </div>
            <span className="auth-form-kicker">{mode === 'login' ? 'CHÀO MỪNG BẠN TRỞ LẠI' : 'BẮT ĐẦU KẾT NỐI'}</span>
            <h2>{mode === 'login' ? 'Rất vui gặp lại bạn!' : 'Tạo tài khoản mới'}</h2>
            <p className="auth-subtitle">{mode === 'login' ? 'Đăng nhập để tiếp tục những kết nối hay.' : 'Tham gia cộng đồng mua bán gần bạn nhé.'}</p>
            <form className="auth-form" onSubmit={submit}>
              {mode === 'register' && <>
                <label>Họ và tên<input required maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nguyễn Minh Anh" autoComplete="name" /></label>
                <label>Số điện thoại <span className="optional-label">(không bắt buộc)</span><input inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09xx xxx xxx" autoComplete="tel" /></label>
              </>}
              <label>Email<input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@email.com" autoComplete="email" /></label>
              <label>Mật khẩu<span className="password-input"><input required type={passwordVisible ? 'text' : 'password'} minLength={mode === 'register' ? 8 : 1} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'register' ? 'Ít nhất 8 ký tự' : 'Nhập mật khẩu'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><button type="button" aria-label={passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setPasswordVisible(!passwordVisible)}>{passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
              {mode === 'login' && <button className="forgot-password" type="button" onClick={() => setErrorMessage('Tính năng khôi phục mật khẩu chưa được cấu hình.')}>Quên mật khẩu?</button>}
              {errorMessage && <span className="form-error" role="alert">{errorMessage}</span>}
              <button className="button-primary auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'} <ArrowRight size={16} /></button>
            </form>
            <div className="auth-legal"><LockKeyhole size={14} /> Mật khẩu của bạn được bảo vệ an toàn.</div>
          </div>
          <button className="auth-return" onClick={onBack}>Tiếp tục khám phá không cần đăng nhập <ArrowRight size={13} /></button>
        </div>
      </section>
    </div>
  )
}
