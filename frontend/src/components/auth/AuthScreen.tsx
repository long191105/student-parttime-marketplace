import { useState, type FormEvent } from 'react'
import { ArrowUpRight, BriefcaseBusiness, GraduationCap } from 'lucide-react'
import { BrandLockup } from '../shared/BrandLockup'
import { login, register, type AuthUser, type UserRole } from '../../services/auth'

type AuthScreenProps = { onAuthenticated: (token: string, user: AuthUser) => void }
type AuthMode = 'login' | 'register'
type RegistrationRole = Exclude<UserRole, 'ADMIN'>

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<RegistrationRole>('STUDENT')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const result = mode === 'login'
        ? await login({ email, password })
        : await register({ fullName, email, password, role })
      onAuthenticated(result.token, result.user)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể kết nối máy chủ.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-panel" aria-labelledby="auth-title">
        <BrandLockup />
        <div className="auth-content">
          <p className="eyebrow">VIỆC LÀM PART-TIME · ĐÚNG NHỊP SỐNG</p>
          <h1 id="auth-title">{mode === 'login' ? 'Chào bạn trở lại.' : 'Tìm ca làm đầu tiên.'}</h1>
          <p className="auth-description">{mode === 'login' ? 'Đăng nhập để tiếp tục hành trình tìm công việc phù hợp với lịch học.' : 'Tạo tài khoản để kết nối với những cơ hội làm thêm thật phù hợp.'}</p>
          <div className="auth-tabs" role="tablist" aria-label="Tài khoản">
            <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }}>Đăng nhập</button>
            <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError('') }}>Tạo tài khoản</button>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && <>
              <label className="field-label" htmlFor="fullName">Họ và tên</label>
              <input id="fullName" autoComplete="name" maxLength={100} required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nguyễn Minh Anh" />
              <span className="field-label">Bạn tham gia với vai trò</span>
              <div className="role-options">
                <label className={`role-option ${role === 'STUDENT' ? 'selected' : ''}`}><input type="radio" name="role" value="STUDENT" checked={role === 'STUDENT'} onChange={() => setRole('STUDENT')} /><GraduationCap size={17} /><span>Sinh viên</span></label>
                <label className={`role-option ${role === 'EMPLOYER' ? 'selected' : ''}`}><input type="radio" name="role" value="EMPLOYER" checked={role === 'EMPLOYER'} onChange={() => setRole('EMPLOYER')} /><BriefcaseBusiness size={16} /><span>Nhà tuyển dụng</span></label>
              </div>
            </>}
            <label className="field-label" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ten@email.com" />
            <label className="field-label" htmlFor="password">Mật khẩu</label>
            <input id="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'login' ? 'Nhập mật khẩu' : 'Ít nhất 8 ký tự'} />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="submit-button" type="submit" disabled={submitting}>{submitting ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}<ArrowUpRight size={18} /></button>
          </form>
          <p className="form-footnote">Bằng việc tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư.</p>
        </div>
        <footer className="auth-footer">© 2026 DHL · Nền tảng việc làm part-time</footer>
      </section>
      <aside className="auth-story" aria-label="Cơ hội việc làm cho sinh viên">
        <div className="auth-story-top"><span>DHL · STUDENT MARKETPLACE</span><img className="auth-corner-logo" src="/logo_DHL_transparent.png" alt="DHL" /></div>
        <div className="auth-story-visual"><img src="/logo%20DHL.png" alt="Logo DHL ánh kim" /></div>
        <div className="auth-story-copy"><p className="story-kicker">LỊCH HỌC LÀ ƯU TIÊN</p><h2>Việc tốt.<br />Đúng nhịp.</h2><p>Những ca làm linh hoạt, nhà tuyển dụng tử tế và trải nghiệm đáng giá trên hành trình của bạn.</p></div>
        <div className="auth-story-bottom"><span><i /> Cơ hội mới mỗi ngày</span><span>SINCE 2026</span></div>
      </aside>
    </main>
  )
}