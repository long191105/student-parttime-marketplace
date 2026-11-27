import { useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { ChoHoiWordmark } from '../components/ChoHoiWordmark'
import { GoogleAuthButton } from '../components/GoogleAuthButton'
import { ScrollToTopButton } from '../components/ScrollToTopButton'
import type { AuthSession } from '../services/MarketplaceApi'

interface AuthPageProps {
  onBack: () => void
  onAuthenticate: (mode: 'login' | 'register', fullName: string, email: string, password: string, phone: string) => Promise<AuthSession | null>
  onVerify: (email: string, otp: string) => Promise<AuthSession>
  onResend: (email: string) => Promise<void>
  onGoogleAuthenticate: (idToken: string) => Promise<AuthSession>
  onSuccess: (session: AuthSession) => void
}

export function AuthPage({
  onBack,
  onAuthenticate,
  onVerify,
  onResend,
  onGoogleAuthenticate,
  onSuccess,
}: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const otpInputRef = useRef<HTMLInputElement | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const passwordMismatch = mode === 'register' && passwordConfirmation.length > 0 && passwordConfirmation !== password

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setStatusMessage('')
    if (mode === 'register' && password !== passwordConfirmation) return
    if (mode === 'register' && !email.trim().toLowerCase().endsWith('@gmail.com')) {
      setErrorMessage('Chỉ chấp nhận địa chỉ email @gmail.com.')
      return
    }
    setIsSubmitting(true)
    try {
      const session = await onAuthenticate(mode, fullName, email, password, phone)
      if (session) {
        onSuccess(session)
      } else {
        setIsVerifying(true)
        setStatusMessage('Mã xác minh đã được gửi đến email của bạn. Hãy nhập mã để hoàn tất đăng ký.')
      }
    } catch (error) {
      console.error('Không thể xác thực tài khoản.', error)
      setErrorMessage(error instanceof Error ? error.message : 'Không thể xác thực. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setStatusMessage('')
    setIsSubmitting(true)
    try {
      onSuccess(await onVerify(email, otp))
    } catch (error) {
      console.error('Không thể xác minh email.', error)
      setErrorMessage(error instanceof Error ? error.message : 'Không thể xác minh email. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function resendCode() {
    setErrorMessage('')
    setStatusMessage('')
    setIsSubmitting(true)
    try {
      await onResend(email)
      setStatusMessage('Mã xác minh mới đã được gửi đến email của bạn.')
    } catch (error) {
      console.error('Không thể gửi lại mã xác minh.', error)
      setErrorMessage(error instanceof Error ? error.message : 'Không thể gửi lại mã xác minh.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function authenticateWithGoogle(credential: string) {
    setErrorMessage('')
    setStatusMessage('')
    setIsSubmitting(true)
    try {
      onSuccess(await onGoogleAuthenticate(credential))
    } catch (error) {
      console.error('Không thể xác thực bằng Google.', error)
      setErrorMessage(error instanceof Error ? error.message : 'Không thể xác thực bằng Google. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function editRegistration() {
    setIsVerifying(false)
    setOtp('')
    setErrorMessage('')
    setStatusMessage('')
  }

  return (
    <>
    <div className="auth-page">
      <section className="auth-story">
        <div className="auth-story-card">
          <div className="auth-story-inner">
            <div className="auth-story-video" aria-hidden="true">
              <video src="/videobanner.mp4" autoPlay loop muted playsInline />
            </div>
            <div className="auth-story-depth" aria-hidden="true" />
            <div className="auth-story-overlay" aria-hidden="true" />
            <div className="auth-story-brand">
              <div className="auth-brand auth-story-brand-heading"><img className="auth-brand-logo" src="/favicon.png" alt="" /><ChoHoiWordmark className="auth-wordmark" /></div>
              <p>Đồ tốt tìm được chủ mới <span>•</span> Cộng đồng mua bán tử tế.</p>
            </div>
            <button className="auth-back" onClick={onBack}><ArrowLeft size={16} /> Về trang chủ</button>
          </div>
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-form-container">
          <div className="auth-mobile-heading">
            <div className="auth-brand"><img className="auth-brand-logo" src="/favicon.png" alt="" /><ChoHoiWordmark className="auth-wordmark" /></div>
            <button className="auth-mobile-back" onClick={onBack}><ArrowLeft size={15} /> Khám phá</button>
          </div>
          <div className="auth-form-card">
            {!isVerifying && <div className="auth-tabs" role="tablist" aria-label="Chọn hình thức tài khoản">
              <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'auth-tab-active' : ''} onClick={() => { setMode('login'); setPasswordConfirmation(''); setErrorMessage('') }}>Đăng nhập</button>
              <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'auth-tab-active' : ''} onClick={() => { setMode('register'); setPasswordConfirmation(''); setErrorMessage('') }}>Tạo tài khoản</button>
            </div>}
            <span className="auth-form-kicker">{isVerifying ? 'XÁC MINH EMAIL' : mode === 'login' ? 'CHÀO MỪNG BẠN TRỞ LẠI' : 'BẮT ĐẦU KẾT NỐI'}</span>
            <h2>{isVerifying ? 'Nhập mã xác minh' : mode === 'login' ? 'Rất vui gặp lại bạn!' : 'Tạo tài khoản mới'}</h2>
            <p className="auth-subtitle">{isVerifying ? <>Mã 6 chữ số đã được gửi đến <strong>{email}</strong>.</> : mode === 'login' ? 'Đăng nhập để tiếp tục những kết nối hay.' : 'Tham gia cộng đồng mua bán gần bạn nhé. Chỉ chấp nhận địa chỉ @gmail.com.'}</p>
            {isVerifying ? <form className="auth-form" onSubmit={verify}>
              <fieldset className="otp-fieldset">
                <legend>Mã OTP</legend>
                <div className="otp-inputs" dir="ltr">
                  <div className="otp-digit-cells" aria-hidden="true">
                    {Array.from({ length: 6 }, (_, index) => (
                      <span key={index} className={index === Math.min(otp.length, 5) ? 'otp-digit-cell otp-digit-cell-active' : 'otp-digit-cell'}>
                        {otp[index] ?? ''}
                      </span>
                    ))}
                  </div>
                  <input
                    ref={otpInputRef}
                    className="otp-native-input"
                    aria-label="Mã OTP gồm 6 chữ số"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    type="text"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>
              </fieldset>
              {statusMessage && <span className="otp-status" role="status">{statusMessage}</span>}
              {errorMessage && <span className="form-error" role="alert">{errorMessage}</span>}
              <button className="button-primary auth-submit" type="submit" disabled={isSubmitting || !/^[0-9]{6}$/.test(otp)}>{isSubmitting ? 'Đang xác minh...' : 'Xác minh và tạo tài khoản'} <ArrowRight size={16} /></button>
              <button className="resend-code" type="button" disabled={isSubmitting} onClick={resendCode}>Gửi lại mã</button>
              <button className="auth-edit-registration" type="button" disabled={isSubmitting} onClick={editRegistration}>Dùng email khác</button>
            </form> : <form className="auth-form" onSubmit={submit}>
              {mode === 'register' && <>
                <label>Họ và tên<input required maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nguyễn Minh Anh" autoComplete="name" /></label>
                <label>Số điện thoại <span className="optional-label">(không bắt buộc)</span><input inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09xx xxx xxx" autoComplete="tel" /></label>
              </>}
              <label>Email<input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder={mode === 'register' ? 'ban@gmail.com' : 'ban@email.com'} autoComplete="email" /></label>
              <label>Mật khẩu<span className="password-input"><input required type={passwordVisible ? 'text' : 'password'} minLength={mode === 'register' ? 8 : 1} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'register' ? 'Ít nhất 8 ký tự' : 'Nhập mật khẩu'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><button type="button" aria-label={passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setPasswordVisible(!passwordVisible)}>{passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
              {mode === 'register' && <label>Nhập lại mật khẩu<input required type="password" maxLength={72} value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} placeholder="Nhập lại mật khẩu" autoComplete="new-password" aria-invalid={passwordMismatch} aria-describedby={passwordMismatch ? 'password-match-error' : undefined} />{passwordMismatch && <span id="password-match-error" className="form-error" role="alert">Mật khẩu chưa khớp.</span>}</label>}
              {mode === 'login' && <button className="forgot-password" type="button" onClick={() => setErrorMessage('Tính năng khôi phục mật khẩu chưa được cấu hình.')}>Quên mật khẩu?</button>}
              {statusMessage && <span className="otp-status" role="status">{statusMessage}</span>}
              {errorMessage && <span className="form-error" role="alert">{errorMessage}</span>}
              <button className="button-primary auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'} <ArrowRight size={16} /></button>
            </form>}
            {!isVerifying && <div className="google-login">
              <span className="google-login-divider">hoặc tiếp tục với</span>
              <GoogleAuthButton onAuthenticate={(credential) => { void authenticateWithGoogle(credential) }} onError={setErrorMessage} />
              <span className="google-login-note">Chỉ tài khoản đã đăng ký mới có thể đăng nhập bằng Google.</span>
            </div>}
            {!isVerifying && <div className="auth-legal"><LockKeyhole size={14} /> Mật khẩu của bạn được bảo vệ an toàn.</div>}
          </div>
          <button className="auth-return" onClick={onBack}>Tiếp tục khám phá không cần đăng nhập <ArrowRight size={13} /></button>
        </div>
      </section>
    </div>
    <ScrollToTopButton />
    </>
  )
}
