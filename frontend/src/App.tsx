import { useEffect, useState } from 'react'
import { MarketplaceLayout, type AppView } from './components/MarketplaceLayout'
import { AdminPage } from './pages/AdminPage'
import { AuthPage } from './pages/AuthPage'
import { ExplorePage } from './pages/ExplorePage'
import { FavoritesPage } from './pages/FavoritesPage'
import { CheckInPage } from './pages/CheckInPage'
import { InboxPage } from './pages/InboxPage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { MyListingsPage } from './pages/MyListingsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { ProfilePage } from './pages/ProfilePage'
import { SearchPage } from './pages/SearchPage'
import { SellPage } from './pages/SellPage'
import type { Listing, ListingData, ListingStatus } from './domain/Listing'
import { MarketplaceApi, type AuthSession, type AuthUser } from './services/MarketplaceApi'
import { MarketplaceService } from './services/MarketplaceService'

const api = new MarketplaceApi()
const authenticationRequiredViews: AppView[] = ['sell', 'my-listings', 'messages', 'notifications']

export function App() {
  const [service] = useState(() => new MarketplaceService())
  const [listings, setListings] = useState<Listing[]>(() => service.getListings())
  const [savedIds, setSavedIds] = useState<string[]>(() => service.getFavorites())
  const [user, setUser] = useState<AuthUser | null>(() => api.readSession()?.user ?? null)
  const [apiState, setApiState] = useState<'connecting' | 'connected' | 'offline'>('connecting')
  const [apiError, setApiError] = useState('')
  const [view, setView] = useState<AppView>('home')
  const [isAdminRoute, setIsAdminRoute] = useState(() => window.location.pathname.replace(/\/+$/, '') === '/admin')
  const [previousView, setPreviousView] = useState<AppView>('home')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('Toàn quốc')
  const [category, setCategory] = useState('Tất cả')
  const [notice, setNotice] = useState('')

  const selectedListing = listings.find((listing) => listing.id === selectedId)
  const activeListings = listings.filter((listing) => {
    if (listing.status !== 'ACTIVE') return false
    if (category !== 'Tất cả' && listing.category !== category) return false
    if (location !== 'Toàn quốc' && !listing.location.includes(location)) return false
    const keyword = query.trim().toLocaleLowerCase('vi')
    return !keyword || `${listing.title} ${listing.description} ${listing.category} ${listing.location}`.toLocaleLowerCase('vi').includes(keyword)
  })

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 3500)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    function syncAdminRoute() {
      setIsAdminRoute(window.location.pathname.replace(/\/+$/, '') === '/admin')
    }
    window.addEventListener('popstate', syncAdminRoute)
    return () => window.removeEventListener('popstate', syncAdminRoute)
  }, [])

  useEffect(() => {
    let active = true
    async function connectToBackend() {
      try {
        const publicListings = await api.listListings()
        let nextListings = publicListings
        let nextUser: AuthUser | null = null
        let nextSavedIds: string[] = []
        const savedSession = api.readSession()

        if (savedSession) {
          try {
            nextUser = await api.getCurrentUser()
            const [myListings, favorites, pending] = await Promise.all([
              api.listMyListings(),
              api.listFavorites(),
              nextUser.role === 'ADMIN' ? api.listPendingListings() : Promise.resolve([]),
            ])
            nextListings = mergeListings(publicListings, myListings, pending)
            nextSavedIds = favorites.map((listing) => listing.id)
          } catch (error) {
            api.clearSession()
            nextUser = null
            console.error('Không thể khôi phục phiên tài khoản.', error)
            if (active) setNotice('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
          }
        }

        if (!active) return
        setListings(nextListings)
        setSavedIds(nextSavedIds)
        setUser(nextUser)
        setApiState('connected')
        setApiError('')
      } catch (error) {
        if (!active) return
        console.error('Không thể tải dữ liệu từ backend.', error)
        setApiState('offline')
        setApiError(error instanceof Error ? error.message : 'Backend chưa sẵn sàng.')
      }
    }

    void connectToBackend()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (apiState !== 'connected' || !isAdminRoute || user?.role !== 'ADMIN') return

    let active = true
    async function refreshAdminListings() {
      try {
        const [publicListings, pendingListings] = await Promise.all([
          api.listListings(),
          api.listPendingListings(),
        ])
        if (!active) return
        setListings((current) => mergeListings(
          current.filter((listing) => listing.status !== 'ACTIVE' && listing.status !== 'PENDING'),
          publicListings,
          pendingListings,
        ))
      } catch (error) {
        console.error('Không thể làm mới hàng đợi duyệt tin.', error)
      }
    }

    void refreshAdminListings()
    const interval = window.setInterval(() => { void refreshAdminListings() }, 10_000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [apiState, isAdminRoute, user?.role])

  function navigate(nextView: AppView) {
    if (nextView === 'auth') {
      setPreviousView(view === 'auth' ? previousView : view)
      setView('auth')
    } else if (authenticationRequiredViews.includes(nextView) && !user) {
      setPreviousView(nextView)
      setView('auth')
    } else {
      setView(nextView)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function leaveAdminRoute() {
    window.history.replaceState({}, '', '/')
    setIsAdminRoute(false)
    setView('home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openListingFromAdmin(listing: Listing) {
    window.history.replaceState({}, '', '/')
    setIsAdminRoute(false)
    setPreviousView('home')
    setSelectedId(listing.id)
    setView('detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openListing(listing: Listing) {
    setPreviousView(view === 'detail' ? previousView : view)
    setSelectedId(listing.id)
    navigate('detail')
  }

  async function reloadFromApi(userOverride: AuthUser | null = user) {
    const publicListings = await api.listListings()
    let nextListings = publicListings
    let nextSavedIds: string[] = []
    if (userOverride) {
      const [myListings, favorites, pending] = await Promise.all([
        api.listMyListings(),
        api.listFavorites(),
        userOverride.role === 'ADMIN' ? api.listPendingListings() : Promise.resolve([]),
      ])
      nextListings = mergeListings(publicListings, myListings, pending)
      nextSavedIds = favorites.map((listing) => listing.id)
    }
    setListings(nextListings)
    setSavedIds(nextSavedIds)
    setApiState('connected')
    setApiError('')
  }

  async function toggleSaved(id: string) {
    if (apiState === 'connected') {
      if (!user) {
        setNotice('Đăng nhập để lưu tin yêu thích.')
        navigate('auth')
        return
      }
      try {
        const save = !savedIds.includes(id)
        await api.toggleFavorite(id, save)
        const favorites = await api.listFavorites()
        setSavedIds(favorites.map((listing) => listing.id))
        setNotice(save ? 'Đã lưu tin vào tài khoản của bạn.' : 'Đã bỏ lưu tin.')
      } catch (error) {
        console.error('Không thể cập nhật tin yêu thích.', error)
        setNotice(error instanceof Error ? error.message : 'Không thể cập nhật tin yêu thích.')
      }
      return
    }

    try {
      setSavedIds(service.toggleFavorite(id))
      setNotice(savedIds.includes(id) ? 'Đã bỏ lưu tin trong dữ liệu demo.' : 'Đã lưu tin trong dữ liệu demo.')
    } catch (error) {
      console.error('Không thể thay đổi danh sách tin đã lưu.', error)
      setNotice(error instanceof Error ? error.message : 'Không thể cập nhật danh sách yêu thích.')
    }
  }

  async function changeStatus(id: string, status: ListingStatus, reason?: string) {
    if (apiState === 'connected') {
      if (!user) {
        setNotice('Đăng nhập để quản lý tin đăng.')
        navigate('auth')
        return
      }
      try {
        if (user.role === 'ADMIN' && (status === 'ACTIVE' || status === 'REJECTED')) {
          await api.moderateListing(id, status, reason)
        } else {
          await api.setListingStatus(id, status)
        }
        await reloadFromApi()
        const message = status === 'ACTIVE' ? 'Tin đăng đã được duyệt và hiển thị.' : status === 'REJECTED' ? 'Tin đăng đã bị từ chối.' : status === 'SOLD' ? 'Đã cập nhật tin đăng là đã bán.' : status === 'HIDDEN' ? 'Tin đăng đã được ẩn.' : 'Tin đăng đã được cập nhật.'
        setNotice(message)
      } catch (error) {
        console.error('Không thể cập nhật trạng thái tin đăng.', error)
        setNotice(error instanceof Error ? error.message : 'Không thể cập nhật tin đăng.')
      }
      return
    }

    try {
      service.setStatus(id, status, reason)
      setListings(service.getListings())
      setNotice(status === 'ACTIVE' ? 'Tin đăng đã được cập nhật trong dữ liệu demo.' : 'Trạng thái tin đăng demo đã được cập nhật.')
    } catch (error) {
      console.error('Không thể cập nhật trạng thái tin đăng.', error)
      setNotice(error instanceof Error ? error.message : 'Không thể cập nhật tin đăng.')
    }
  }

  async function createListing(data: Omit<ListingData, 'id' | 'status' | 'views' | 'postedAt'> & { contactPhone: string }): Promise<void> {
    if (!user) {
      setNotice('Đăng nhập trước khi đăng tin.')
      navigate('auth')
      return
    }

    if (apiState === 'connected') {
      try {
        await api.createListing(data)
        await reloadFromApi()
        setView('my-listings')
        setNotice('Tin đăng đã được gửi và đang chờ quản trị viên duyệt.')
      } catch (error) {
        console.error('Không thể đăng tin.', error)
        setNotice(error instanceof Error ? error.message : 'Không thể đăng tin.')
        throw error
      }
      return
    }

    service.createListing(data)
    setListings(service.getListings())
    setView('my-listings')
    setNotice('Tin demo đã được lưu trên trình duyệt và đang chờ duyệt.')
  }

  async function authenticate(mode: 'login' | 'register', fullName: string, email: string, password: string, phone: string): Promise<AuthSession> {
    return mode === 'login'
      ? api.login(email, password)
      : api.register(fullName, email, password, phone.replace(/\D/g, ''))
  }

  async function authenticationSucceeded(session: AuthSession) {
    try {
      api.saveSession(session)
      setUser(session.user)
      setNotice('Đăng nhập thành công. Chào mừng đến với Chợ Hời!')
      await reloadFromApi(session.user)
      if (session.user.role === 'ADMIN') {
        if (window.location.pathname.replace(/\/+$/, '') !== '/admin') {
          window.history.pushState({}, '', '/admin')
        }
        setIsAdminRoute(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      navigate(previousView === 'auth' ? 'home' : previousView)
    } catch (error) {
      console.error('Không thể tải dữ liệu tài khoản.', error)
      setNotice(error instanceof Error ? error.message : 'Đăng nhập thành công nhưng không tải được dữ liệu.')
    }
  }

  function signOut() {
    api.clearSession()
    setUser(null)
    setSavedIds([])
    navigate('home')
    setNotice('Bạn đã đăng xuất.')
  }

  async function retryConnection() {
    setApiState('connecting')
    try {
      await reloadFromApi()
    } catch (error) {
      setApiState('offline')
      setApiError(error instanceof Error ? error.message : 'Không thể kết nối backend.')
    }
  }

  function submitSearch() {
    setCategory('Tất cả')
    navigate('search')
  }

  function selectCategory(nextCategory: string) {
    setCategory(nextCategory)
    navigate('search')
  }

  const relatedListings = selectedListing
    ? listings.filter((listing) => listing.status === 'ACTIVE' && listing.id !== selectedListing.id && listing.category === selectedListing.category)
    : []
  const currentSellerId = user ? String(user.id) : 'long'
  const currentSellerName = user?.fullName ?? 'Long Nguyễn'

  if (isAdminRoute) {
    if (apiState === 'connecting') {
      return <div className="admin-route-message"><p>Đang xác minh quyền truy cập...</p></div>
    }
    if (apiState === 'offline') {
      return <div className="admin-route-message"><h1>Không thể kết nối hệ thống quản trị</h1><p>{apiError}</p><button className="button-primary" onClick={retryConnection}>Thử kết nối lại</button><button className="button-secondary" onClick={leaveAdminRoute}>Về trang chủ</button></div>
    }
    if (!user) {
      return <AuthPage onBack={leaveAdminRoute} onAuthenticate={authenticate} onSuccess={authenticationSucceeded} />
    }
    if (user.role !== 'ADMIN') {
      return <div className="admin-route-message"><h1>Bạn không có quyền truy cập</h1><p>Trang quản trị chỉ dành cho tài khoản quản trị viên.</p><button className="button-primary" onClick={leaveAdminRoute}>Về trang chủ</button></div>
    }
    return <AdminPage listings={listings} onStatusChange={changeStatus} onOpen={openListingFromAdmin} onExit={leaveAdminRoute} />
  }

  if (view === 'auth') {
    return <AuthPage onBack={() => navigate(previousView === 'auth' || authenticationRequiredViews.includes(previousView) ? 'home' : previousView)} onAuthenticate={authenticate} onSuccess={authenticationSucceeded} />
  }

  return (
    <MarketplaceLayout
      view={view}
      query={query}
      location={location}
      onQueryChange={setQuery}
      onLocationChange={setLocation}
      onNavigate={navigate}
      onSearch={submitSearch}
      favoritesCount={savedIds.length}
      unreadCount={user && apiState === 'connected' ? 1 : 0}
      user={user}
    >
      {apiState === 'offline' && <div className="api-status-banner" role="status"><span>DEMO · Chưa kết nối database; thao tác chỉ lưu trên trình duyệt.</span><button onClick={retryConnection}>Thử kết nối lại</button><small>{apiError}</small></div>}
      {apiState === 'connecting' && <div className="api-status-banner api-status-connecting" role="status"><span>Đang kết nối Chợ Hời API...</span></div>}
      {notice && <div className="toast-message" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Đóng thông báo">×</button></div>}
      {view === 'home' && <ExplorePage listings={activeListings} savedIds={savedIds} onOpen={openListing} onToggleSaved={toggleSaved} onCategory={selectCategory} />}
      {view === 'search' && <SearchPage listings={activeListings} savedIds={savedIds} query={query} category={category} onQueryChange={setQuery} onCategoryChange={setCategory} onOpen={openListing} onToggleSaved={toggleSaved} />}
      {view === 'detail' && selectedListing && <ListingDetailPage key={selectedListing.id} listing={selectedListing} related={relatedListings} saved={savedIds.includes(selectedListing.id)} onBack={() => navigate(previousView === 'detail' ? 'home' : previousView)} onToggleSaved={toggleSaved} onOpen={openListing} onContact={() => navigate('messages')} onSeller={() => navigate('profile')} onRevealPhone={async (id) => {
        if (apiState !== 'connected') throw new Error('Backend chưa kết nối; không thể tải số điện thoại thật.')
        if (!user) {
          setNotice('Đăng nhập để xem số điện thoại người bán.')
          navigate('auth')
          throw new Error('Vui lòng đăng nhập để xem số điện thoại.')
        }
        return api.getSellerPhone(id)
      }} />}
      {view === 'detail' && !selectedListing && <div className="empty-state"><h3>Không tìm thấy tin đăng</h3><button className="button-primary" onClick={() => navigate('home')}>Về trang chủ</button></div>}
      {view === 'sell' && <SellPage onCancel={() => navigate('home')} onSubmit={createListing} />}
      {view === 'my-listings' && <MyListingsPage listings={listings} onStatusChange={changeStatus} onOpen={openListing} onSell={() => navigate('sell')} sellerId={currentSellerId} />}
      {view === 'favorites' && <FavoritesPage listings={listings} savedIds={savedIds} onOpen={openListing} onToggleSaved={toggleSaved} />}
      {view === 'check-in' && <CheckInPage userId={user?.id ?? null} onBack={() => navigate('home')} />}
      {view === 'messages' && <InboxPage />}
      {view === 'notifications' && <NotificationsPage onNavigate={navigate} />}
      {view === 'profile' && user && <ProfilePage listings={listings} onOpen={openListing} onToggleSaved={toggleSaved} onAuth={signOut} fullName={currentSellerName} sellerId={currentSellerId} />}
      {view === 'profile' && !user && <div className="empty-state"><h3>Đăng nhập để xem hồ sơ của bạn</h3><button className="button-primary" onClick={() => navigate('auth')}>Đăng nhập</button></div>}
    </MarketplaceLayout>
  )
}

function mergeListings(...groups: Listing[][]): Listing[] {
  const merged = new Map<string, Listing>()
  for (const listing of groups.flat()) merged.set(listing.id, listing)
  return [...merged.values()]
}
