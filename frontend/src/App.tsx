import { useEffect, useState, type FormEvent } from 'react'
import './auth.css'
import { getCurrentUser, login, register, type AuthUser, type UserRole } from './services/auth'

type AuthMode = 'login' | 'register'
type RegistrationRole = Exclude<UserRole, 'ADMIN'>

function App() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<RegistrationRole>('STUDENT')
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = sessionStorage.getItem('marketplace-user')
    return stored ? (JSON.parse(stored) as AuthUser) : null
  })
  const [token, setToken] = useState(() => sessionStorage.getItem('marketplace-token'))
  const [pending, setPending] = useState(Boolean(token))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return

    getCurrentUser(token)
      .then((currentUser) => {
        setUser(currentUser)
        sessionStorage.setItem('marketplace-user', JSON.stringify(currentUser))
      })
      .catch(() => {
        sessionStorage.removeItem('marketplace-token')
        sessionStorage.removeItem('marketplace-user')
        setToken(null)
        setUser(null)
      })
      .finally(() => setPending(false))
  }, [token])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const result = mode === 'login'
        ? await login({ email, password })
        : await register({ fullName, email, password, role })
      sessionStorage.setItem('marketplace-token', result.token)
      sessionStorage.setItem('marketplace-user', JSON.stringify(result.user))
      setToken(result.token)
      setUser(result.user)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể kết nối máy chủ.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('marketplace-token')
    sessionStorage.removeItem('marketplace-user')
    setToken(null)
    setUser(null)
    setPassword('')
  }

  if (pending) {
    return <main className="loading-screen">Đang xác thực phiên đăng nhập...</main>
  }

  if (user) {
    return <RoleHome user={user} onLogout={handleLogout} />
  }

  return (
    <main className="auth-layout">
      <section className="auth-panel" aria-labelledby="auth-title">
        <a className="wordmark" href="/" aria-label="DHL trang chủ">
          <img className="wordmark-logo" src="logo_DHL_transparent.png" alt="" />
        </a>

        <div className="auth-content">
          <p className="eyebrow">DHL · VIỆC LÀM PART-TIME</p>
          <h1 id="auth-title">{mode === 'login' ? 'Đăng nhập DHL.' : 'Tham gia DHL.'}</h1>
          <p className="auth-description">
            {mode === 'login'
              ? 'Tiếp tục hành trình tìm việc phù hợp với lịch học của bạn.'
              : 'Tạo tài khoản để kết nối với các cơ hội việc làm part-time.'}
          </p>

          <div className="auth-tabs" role="tablist" aria-label="Tài khoản">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={mode === 'login' ? 'active' : ''}
              onClick={() => { setMode('login'); setError('') }}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={mode === 'register' ? 'active' : ''}
              onClick={() => { setMode('register'); setError('') }}
            >
              Đăng ký
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <label className="field-label" htmlFor="fullName">Họ và tên</label>
                <input
                  id="fullName"
                  autoComplete="name"
                  maxLength={100}
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Nguyễn Minh Anh"
                />

                <span className="field-label">Bạn tham gia với vai trò</span>
                <div className="role-options">
                  <label className={role === 'STUDENT' ? 'role-option selected' : 'role-option'}>
                    <input type="radio" name="role" value="STUDENT" checked={role === 'STUDENT'} onChange={() => setRole('STUDENT')} />
                    <span>Sinh viên</span>
                  </label>
                  <label className={role === 'EMPLOYER' ? 'role-option selected' : 'role-option'}>
                    <input type="radio" name="role" value="EMPLOYER" checked={role === 'EMPLOYER'} onChange={() => setRole('EMPLOYER')} />
                    <span>Nhà tuyển dụng</span>
                  </label>
                </div>
              </>
            )}

            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ten@email.com"
            />

            <label className="field-label" htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              maxLength={72}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === 'login' ? 'Nhập mật khẩu' : 'Ít nhất 8 ký tự'}
            />

            {error && <p className="form-error" role="alert">{error}</p>}

            <button className="submit-button" type="submit" disabled={submitting}>
              {submitting ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
              {!submitting && <span aria-hidden="true">↗</span>}
            </button>
          </form>
          <p className="form-footnote">Kết nối cơ hội việc làm part-time dành cho sinh viên.</p>
        </div>

        <footer className="auth-footer">© 2026 DHL · Nền tảng việc làm part-time</footer>
      </section>

      <aside className="brand-panel" aria-label="DHL">
        <div className="brand-panel-top"><span>DHL · PART-TIME MARKETPLACE</span><span>VIỆT NAM</span></div>
        <div className="brand-copy">
          <p className="brand-kicker">CƠ HỘI TIẾP THEO BẮT ĐẦU TỪ ĐÂY</p>
          <h2>Việc phù hợp. Đúng nhịp sống.</h2>
          <p>Kết nối sinh viên với những công việc part-time phù hợp.</p>
        </div>
        <div className="brand-visual">
          <img className="brand-emblem" src="/logo%20DHL.png" alt="Logo DHL ánh kim trên nền đen" />
        </div>
        <div className="brand-panel-bottom"><span>STUDENT × EMPLOYER</span><span>OPPORTUNITY, IN MOTION</span></div>
      </aside>
    </main>
  )
}

function RoleHome({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const roleNames: Record<UserRole, string> = {
    STUDENT: 'Sinh viên',
    EMPLOYER: 'Nhà tuyển dụng',
    ADMIN: 'Quản trị viên',
  }

  return (
    <main className="home-screen">
      <header className="home-header">
        <a className="wordmark" href="/" aria-label="DHL trang chủ">
          <img className="wordmark-logo" src="logo_DHL_transparent.png" alt="" />
        </a>
        <button className="logout-button" type="button" onClick={onLogout}>Đăng xuất</button>
      </header>
      <section className="home-content">
        <p className="eyebrow">{roleNames[user.role]}</p>
        <h1>Xin chào, {user.fullName}.</h1>
        <p className="auth-description">Bạn đã đăng nhập bằng {user.email}.</p>
        <div className="role-banner">
          <span className="role-indicator" />
          <div><strong>Khu vực {roleNames[user.role]}</strong><span>Phiên đăng nhập đang hoạt động</span></div>
        </div>
      </section>
    </main>
  )
}

export default App
