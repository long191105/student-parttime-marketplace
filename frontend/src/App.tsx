import { useEffect, useState } from 'react'
import './auth.css'
import './marketplace.css'
import { AuthScreen } from './components/auth/AuthScreen'
import { MarketplaceWorkspace } from './components/marketplace/MarketplaceWorkspace'
import { getCurrentUser, type AuthUser } from './services/auth'

function App() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = sessionStorage.getItem('marketplace-user')
    try {
      return stored ? (JSON.parse(stored) as AuthUser) : null
    } catch {
      sessionStorage.removeItem('marketplace-user')
      return null
    }
  })
  const [token, setToken] = useState(() => sessionStorage.getItem('marketplace-token'))
  const [pending, setPending] = useState(Boolean(token))
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

  function handleAuthenticated(authToken: string, authenticatedUser: AuthUser) {
    sessionStorage.setItem('marketplace-token', authToken)
    sessionStorage.setItem('marketplace-user', JSON.stringify(authenticatedUser))
    setToken(authToken)
    setUser(authenticatedUser)
  }

  function handleLogout() {
    sessionStorage.removeItem('marketplace-token')
    sessionStorage.removeItem('marketplace-user')
    setToken(null)
    setUser(null)
  }

  if (pending) {
    return <main className="loading-screen">Đang xác thực phiên đăng nhập...</main>
  }

  if (user) {
    return <MarketplaceWorkspace user={user} onLogout={handleLogout} />
  }

  return <AuthScreen onAuthenticated={handleAuthenticated} />
}

export default App
