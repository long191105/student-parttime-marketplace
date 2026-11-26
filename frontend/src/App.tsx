import { useCallback, useEffect, useState } from 'react'
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
import { MarketplaceApi, MarketplaceApiError, type AdminCategory, type AdminReport, type AdminReportAction, type AdminStats, type AdminUserStatus, type AuthSession, type AuthUser, type ListingFormDraft, type UserNotification } from './services/MarketplaceApi'
import { MarketplaceService } from './services/MarketplaceService'
import { categories, categoriesForNames } from './data/categories'

const api = new MarketplaceApi()
const authenticationRequiredViews: AppView[] = ['sell', 'my-listings', 'messages', 'notifications', 'check-in']
const appNavigationKey = 'chohoiNavigation'

interface AppNavigationEntry {
  view: AppView
  selectedId: string | null
  selectedConversationId: string | null
  previousView: AppView
  sellReturnView: AppView
  depth: number
}

interface NavigationOptions {
  historyMode?: 'push' | 'replace'
  selectedId?: string | null
  selectedConversationId?: string | null
  previousView?: AppView
  sellReturnView?: AppView
}

function isAppView(value: unknown): value is AppView {
  return value === 'home' || value === 'search' || value === 'detail' || value === 'sell'
    || value === 'my-listings' || value === 'favorites' || value === 'messages'
    || value === 'notifications' || value === 'profile' || value === 'check-in' || value === 'auth'
}

function readAppNavigationEntry(state: unknown): AppNavigationEntry | null {
  if (typeof state !== 'object' || state === null || Array.isArray(state)) return null
  const value = (state as Record<string, unknown>)[appNavigationKey]
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const entry = value as Record<string, unknown>
  if (!isAppView(entry.view)) return null

  return {
    view: entry.view,
    selectedId: typeof entry.selectedId === 'string' ? entry.selectedId : null,
    selectedConversationId: typeof entry.selectedConversationId === 'string' ? entry.selectedConversationId : null,
    previousView: isAppView(entry.previousView) ? entry.previousView : 'home',
    sellReturnView: isAppView(entry.sellReturnView) ? entry.sellReturnView : 'home',
    depth: typeof entry.depth === 'number' && Number.isInteger(entry.depth) && entry.depth >= 0 ? entry.depth : 0,
  }
}

function withAppNavigationEntry(entry: AppNavigationEntry): Record<string, unknown> {
  const state = window.history.state
  const stateRecord = typeof state === 'object' && state !== null && !Array.isArray(state)
    ? state as Record<string, unknown>
    : {}
  return { ...stateRecord, [appNavigationKey]: entry }
}

export function App() {
  const [service] = useState(() => new MarketplaceService())
  const [categoryOptions, setCategoryOptions] = useState(categories)
  const initialNavigationEntry = readAppNavigationEntry(window.history.state)
  const loadListingDraft = useCallback(() => api.getListingDraft(), [])
  const saveListingDraft = useCallback((draft: ListingFormDraft) => api.saveListingDraft(draft), [])
  const deleteListingDraft = useCallback(() => api.deleteListingDraft(), [])
  const loadAdminStats = useCallback((from: string, to: string): Promise<AdminStats> => api.getAdminStats(from, to), [])
  const loadAdminUsers = useCallback(() => api.listAdminUsers(), [])
  const updateAdminUserStatus = useCallback((id: number, status: AdminUserStatus) => api.updateAdminUserStatus(id, status), [])
  const loadAdminReports = useCallback(() => api.listAdminReports(), [])
  const processAdminReport = useCallback((id: number, action: AdminReportAction): Promise<AdminReport> => api.processAdminReport(id, action), [])
  const loadAdminCategories = useCallback(() => api.listAdminCategories(), [])
  const createAdminCategory = useCallback(async (name: string): Promise<AdminCategory> => {
    const createdCategory = await api.createAdminCategory(name)
    setCategoryOptions((current) => categoriesForNames([...current.map((category) => category.name), createdCategory.name]))
    return createdCategory
  }, [])
  const submitListingReport = useCallback((listingId: string, reason: string) => api.submitListingReport(listingId, reason), [])
  const [listings, setListings] = useState<Listing[]>(() => service.getListings())
  const [savedIds, setSavedIds] = useState<string[]>(() => service.getFavorites())
  const [favoriteListings, setFavoriteListings] = useState<Listing[]>(() => {
    const saved = new Set(service.getFavorites())
    return service.getListings().filter((listing) => saved.has(listing.id))
  })
  const [user, setUser] = useState<AuthUser | null>(() => api.readSession()?.user ?? null)
  const [apiState, setApiState] = useState<'connecting' | 'connected' | 'offline'>('connecting')
  const [apiError, setApiError] = useState('')
  const [view, setView] = useState<AppView>(initialNavigationEntry?.view ?? 'home')
  const [sellReturnView, setSellReturnView] = useState<AppView>(initialNavigationEntry?.sellReturnView ?? 'home')
  const [isEditingSavedDraft, setIsEditingSavedDraft] = useState(false)
  const [sellFormInstance, setSellFormInstance] = useState(0)
  const [isAdminRoute, setIsAdminRoute] = useState(() => window.location.pathname.replace(/\/+$/, '') === '/admin')
  const [previousView, setPreviousView] = useState<AppView>(initialNavigationEntry?.previousView ?? 'home')
  const [selectedId, setSelectedId] = useState<string | null>(initialNavigationEntry?.selectedId ?? null)
  const [selectedListingSnapshot, setSelectedListingSnapshot] = useState<Listing | null>(null)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialNavigationEntry?.selectedConversationId ?? null)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0)
  const [notificationsLoaded, setNotificationsLoaded] = useState(false)
  const [notificationsError, setNotificationsError] = useState('')
  const [notificationRetry, setNotificationRetry] = useState(0)
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('Toàn quốc')
  const [category, setCategory] = useState('Tất cả')
  const [notice, setNotice] = useState('')
  const [authNotice, setAuthNotice] = useState('')
  const updateUnreadMessageCount = useCallback((count: number) => setUnreadMessageCount(count), [])

  const selectedListing = listings.find((listing) => listing.id === selectedId)
    ?? favoriteListings.find((listing) => listing.id === selectedId)
    ?? (selectedListingSnapshot?.id === selectedId ? selectedListingSnapshot : undefined)
  const activeFavoriteListings = favoriteListings.filter((listing) => listing.status === 'ACTIVE')
  const activeCategoryCounts = new Map<string, number>()
  for (const listing of listings) {
    if (listing.status === 'ACTIVE') {
      activeCategoryCounts.set(listing.category, (activeCategoryCounts.get(listing.category) ?? 0) + 1)
    }
  }
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
    if (apiState !== 'connected') return

    let active = true
    async function refreshCategories() {
      try {
        const nextCategories = await api.listCategories()
        if (active) setCategoryOptions(categoriesForNames(nextCategories.map((category) => category.name)))
      } catch (error) {
        if (!active) return
        console.error('Không thể làm mới danh mục sản phẩm.', error)
      }
    }

    void refreshCategories()
    const interval = window.setInterval(() => void refreshCategories(), 30_000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [apiState])

  useEffect(() => {
    if (!authNotice) return
    const timer = window.setTimeout(() => setAuthNotice(''), 3500)
    return () => window.clearTimeout(timer)
  }, [authNotice])

  useEffect(() => {
    if (!readAppNavigationEntry(window.history.state)) {
      const initialEntry: AppNavigationEntry = {
        view: 'home',
        selectedId: null,
        selectedConversationId: null,
        previousView: 'home',
        sellReturnView: 'home',
        depth: 0,
      }
      window.history.replaceState(withAppNavigationEntry(initialEntry), '', window.location.href)
    }

    function restoreNavigation(event: PopStateEvent) {
      const adminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin'
      setIsAdminRoute(adminRoute)
      const entry = readAppNavigationEntry(event.state)
      if (!adminRoute) {
        setView(entry?.view ?? 'home')
        setSelectedId(entry?.selectedId ?? null)
        setSelectedConversationId(entry?.selectedConversationId ?? null)
        setPreviousView(entry?.previousView ?? 'home')
        setSellReturnView(entry?.sellReturnView ?? 'home')
      }
      window.scrollTo({ top: 0, behavior: 'auto' })
    }

    window.addEventListener('popstate', restoreNavigation)
    return () => window.removeEventListener('popstate', restoreNavigation)
  }, [])

  useEffect(() => {
    let active = true
    async function connectToBackend() {
      try {
        const publicListings = await api.listListings()
        let nextListings = publicListings
        let nextUser: AuthUser | null = null
        let nextSavedIds: string[] = []
        let nextFavoriteListings: Listing[] = []
        const savedSession = api.readSession()

        if (savedSession) {
          try {
            nextUser = await api.getCurrentUser()
            const [myListings, favorites, active, pending] = await Promise.all([
              api.listMyListings(),
              api.listFavorites(),
              nextUser.role === 'ADMIN' ? api.listAdminListings('ACTIVE') : Promise.resolve([]),
              nextUser.role === 'ADMIN' ? api.listPendingListings() : Promise.resolve([]),
            ])
            nextListings = mergeListings(publicListings, myListings, active, pending)
            nextFavoriteListings = favorites
            nextSavedIds = favorites.map((listing) => listing.id)
          } catch (error) {
            if (!(error instanceof MarketplaceApiError) || error.status !== 401) {
              throw error
            }
            api.clearSession()
            nextUser = null
            console.error('Không thể khôi phục phiên tài khoản.', error)
            if (active) setNotice('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
          }
        }

        if (!active) return
        setListings(nextListings)
        setSavedIds(nextSavedIds)
        setFavoriteListings(nextFavoriteListings)
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
    if (apiState !== 'offline') return

    let active = true
    const interval = window.setInterval(() => {
      void api.listListings().then((nextListings) => {
        if (!active) return
        setListings(nextListings)
        setApiState('connected')
        setApiError('')
      }).catch((error: unknown) => {
        if (!active) return
        setApiError(error instanceof Error ? error.message : 'Backend chưa sẵn sàng.')
      })
    }, 10_000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [apiState])

  useEffect(() => {
    if (apiState !== 'connected' || !user) return

    let active = true
    async function refreshUnreadCount() {
      try {
        const conversations = await api.listChatConversations()
        if (active) setUnreadMessageCount(conversations.reduce((total, item) => total + item.unreadCount, 0))
      } catch (error) {
        console.error('Không thể làm mới số tin nhắn chưa đọc.', error)
      }
    }

    const initialTimer = window.setTimeout(() => { void refreshUnreadCount() }, 0)
    const interval = window.setInterval(() => { void refreshUnreadCount() }, 30_000)
    return () => {
      active = false
      window.clearTimeout(initialTimer)
      window.clearInterval(interval)
    }
  }, [apiState, user])

  useEffect(() => {
    if (apiState !== 'connected' || !user) return

    let active = true
    let knownNotificationIds: Set<number> | null = null
    async function refreshNotifications() {
      try {
        const feed = await api.listNotifications()
        if (!active) return
        if (knownNotificationIds) {
          const newestNotification = feed.notifications.find((item) => !knownNotificationIds?.has(item.id))
          if (newestNotification) setNotice(`${newestNotification.title}: ${newestNotification.detail}`)
        }
        knownNotificationIds = new Set(feed.notifications.map((item) => item.id))
        setNotifications(feed.notifications)
        setNotificationUnreadCount(feed.unreadCount)
        setNotificationsError('')
      } catch (error) {
        if (!active) return
        console.error('Không thể làm mới thông báo.', error)
        setNotificationsError(error instanceof Error ? error.message : 'Không thể tải thông báo.')
      } finally {
        if (active) setNotificationsLoaded(true)
      }
    }

    void refreshNotifications()
    const interval = window.setInterval(() => void refreshNotifications(), 10_000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [apiState, notificationRetry, user])

  useEffect(() => {
    if (apiState !== 'connected' || !isAdminRoute || user?.role !== 'ADMIN') return

    let active = true
    async function refreshAdminListings() {
      try {
        const [activeListings, pendingListings] = await Promise.all([
          api.listAdminListings('ACTIVE'),
          api.listPendingListings(),
        ])
        if (!active) return
        setListings((current) => mergeListings(
          current.filter((listing) => listing.status !== 'ACTIVE' && listing.status !== 'PENDING'),
          activeListings,
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

  function getCurrentNavigationEntry(): AppNavigationEntry {
    return readAppNavigationEntry(window.history.state) ?? {
      view,
      selectedId,
      selectedConversationId,
      previousView,
      sellReturnView,
      depth: 0,
    }
  }

  function navigate(nextView: AppView, options: NavigationOptions = {}) {
    const needsAuth = authenticationRequiredViews.includes(nextView) && !user
    const targetView = nextView === 'auth' || needsAuth ? 'auth' : nextView
    const targetPreviousView = options.previousView ?? (nextView === 'auth'
      ? view === 'auth' ? previousView : view
      : needsAuth ? nextView : previousView)
    const targetSellReturnView = options.sellReturnView
      ?? (nextView === 'sell' && view !== 'my-listings' ? 'home' : sellReturnView)
    const targetSelectedId = options.selectedId === undefined ? selectedId : options.selectedId
    const targetConversationId = options.selectedConversationId === undefined ? selectedConversationId : options.selectedConversationId
    const historyMode = options.historyMode ?? 'push'

    if (!isAdminRoute && targetView === view && targetSelectedId === selectedId && targetConversationId === selectedConversationId) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const currentEntry = getCurrentNavigationEntry()
    const entry: AppNavigationEntry = {
      view: targetView,
      selectedId: targetSelectedId,
      selectedConversationId: targetConversationId,
      previousView: targetPreviousView,
      sellReturnView: targetSellReturnView,
      depth: historyMode === 'replace' ? currentEntry.depth : currentEntry.depth + 1,
    }
    const url = window.location.pathname.replace(/\/+$/, '') === '/admin' ? '/' : window.location.href
    const state = withAppNavigationEntry(entry)
    if (historyMode === 'replace') window.history.replaceState(state, '', url)
    else window.history.pushState(state, '', url)

    setView(targetView)
    setSelectedId(targetSelectedId)
    setSelectedConversationId(targetConversationId)
    setPreviousView(targetPreviousView)
    setSellReturnView(targetSellReturnView)
    setIsAdminRoute(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack(fallbackView: AppView) {
    if (getCurrentNavigationEntry().depth > 0) {
      window.history.back()
      return
    }
    navigate(fallbackView, { historyMode: 'replace' })
  }

  function enterAdminRoute() {
    const currentEntry = getCurrentNavigationEntry()
    const entry = { ...currentEntry, depth: currentEntry.depth + 1 }
    window.history.pushState(withAppNavigationEntry(entry), '', '/admin')
    setIsAdminRoute(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startNewListing() {
    setIsEditingSavedDraft(false)
    setSellFormInstance((current) => current + 1)
    navigate('sell', { sellReturnView: 'home' })
  }

  function editSavedDraft() {
    setIsEditingSavedDraft(true)
    setSellFormInstance((current) => current + 1)
    navigate('sell', { sellReturnView: 'my-listings' })
  }

  function leaveAdminRoute() {
    goBack('home')
  }

  function openAdminRoute() {
    if (user?.role !== 'ADMIN') return
    enterAdminRoute()
  }

  function openListingFromAdmin(listing: Listing) {
    setSelectedListingSnapshot(listing)
    navigate('detail', { selectedId: listing.id, previousView: 'home' })
  }

  function openListing(listing: Listing) {
    setSelectedListingSnapshot(listing)
    navigate('detail', { selectedId: listing.id, previousView: view === 'detail' ? previousView : view })
  }

  async function markNotificationRead(id: number) {
    const notification = notifications.find((item) => item.id === id)
    if (!notification || notification.read) return
    try {
      await api.markNotificationRead(id)
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item))
      setNotificationUnreadCount((current) => Math.max(0, current - 1))
    } catch (error) {
      console.error('Không thể đánh dấu thông báo đã đọc.', error)
      setNotice(error instanceof Error ? error.message : 'Không thể cập nhật thông báo.')
    }
  }

  async function markAllNotificationsRead() {
    try {
      await api.markAllNotificationsRead()
      setNotifications((current) => current.map((item) => ({ ...item, read: true })))
      setNotificationUnreadCount(0)
    } catch (error) {
      console.error('Không thể đánh dấu tất cả thông báo đã đọc.', error)
      setNotice(error instanceof Error ? error.message : 'Không thể cập nhật thông báo.')
    }
  }

  async function openNotification(notification: UserNotification) {
    await markNotificationRead(notification.id)
    if (notification.type === 'NEW_MESSAGE') {
      navigate('messages', { selectedConversationId: notification.targetId })
      return
    }
    navigate('my-listings')
  }

  async function openChat(listingId: string) {
    if (!user) {
      setNotice('Đăng nhập để trò chuyện với người bán.')
      navigate('auth')
      return
    }
    if (apiState !== 'connected') {
      setNotice('Hộp thư chỉ khả dụng khi kết nối được backend.')
      return
    }
    try {
      const conversation = await api.openChatForListing(listingId)
      navigate('messages', { selectedConversationId: conversation.id })
    } catch (error) {
      console.error('Không thể mở cuộc trò chuyện với người bán.', error)
      setNotice(error instanceof Error ? error.message : 'Không thể mở cuộc trò chuyện.')
    }
  }

  async function reloadFromApi(userOverride: AuthUser | null = user) {
    const publicListings = await api.listListings()
    let nextListings = publicListings
    let nextSavedIds: string[] = []
    let nextFavoriteListings: Listing[] = []
    if (userOverride) {
      const [myListings, favorites, active, pending] = await Promise.all([
        api.listMyListings(),
        api.listFavorites(),
        userOverride.role === 'ADMIN' ? api.listAdminListings('ACTIVE') : Promise.resolve([]),
        userOverride.role === 'ADMIN' ? api.listPendingListings() : Promise.resolve([]),
      ])
      nextListings = mergeListings(publicListings, myListings, active, pending)
      nextFavoriteListings = favorites
      nextSavedIds = favorites.map((listing) => listing.id)
    }
    setListings(nextListings)
    setSavedIds(nextSavedIds)
    setFavoriteListings(nextFavoriteListings)
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
        setFavoriteListings(favorites)
        setNotice(save ? 'Đã lưu tin vào tài khoản của bạn.' : 'Đã bỏ lưu tin.')
      } catch (error) {
        console.error('Không thể cập nhật tin yêu thích.', error)
        setNotice(error instanceof Error ? error.message : 'Không thể cập nhật tin yêu thích.')
      }
      return
    }

    try {
      const nextSavedIds = service.toggleFavorite(id)
      setSavedIds(nextSavedIds)
      setFavoriteListings(service.getListings().filter((listing) => nextSavedIds.includes(listing.id)))
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
        const listing = listings.find((item) => item.id === id)
        if (user.role === 'ADMIN' && listing?.status === 'PENDING' && (status === 'ACTIVE' || status === 'REJECTED')) {
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
        navigate('my-listings')
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
    navigate('my-listings')
    setNotice('Tin demo đã được lưu trên trình duyệt và đang chờ duyệt.')
  }

  async function publishSavedDraft(draft: ListingFormDraft): Promise<void> {
    if (!user || apiState !== 'connected') {
      throw new Error('Cần đăng nhập và kết nối backend để gửi bản nháp.')
    }

    const price = Number(draft.price)
    if (draft.title.trim().length < 10) throw new Error('Tiêu đề cần có ít nhất 10 ký tự. Hãy sửa bản nháp trước khi gửi.')
    if (!draft.giveaway && (!Number.isFinite(price) || price < 0)) throw new Error('Vui lòng bổ sung mức giá hợp lệ trong bản nháp.')
    if (!draft.category.trim()) throw new Error('Hãy chọn danh mục cho tin trước khi gửi.')
    if (draft.condition !== 'NEW' && draft.condition !== 'USED') throw new Error('Hãy chọn tình trạng sản phẩm trước khi gửi.')
    if (draft.description.trim().length < 20) throw new Error('Mô tả cần có ít nhất 20 ký tự. Hãy sửa bản nháp trước khi gửi.')
    if (!/^\d{10,11}$/.test(draft.phone.replace(/\D/g, ''))) throw new Error('Số điện thoại cần có 10 hoặc 11 chữ số.')
    if (!draft.provinceCode || !draft.wardCode) throw new Error('Hãy chọn tỉnh/thành và phường/xã trong bản nháp trước khi gửi.')
    const fullLocation = draft.fullLocation?.trim()
    if (!fullLocation || fullLocation.length > 160) throw new Error('Hãy mở sửa nháp, chọn đầy đủ khu vực và lưu lại trước khi gửi.')

    const coverPhoto = draft.photos.find((photo) => photo.id === draft.coverPhotoId) ?? draft.photos[0]
    const images = coverPhoto
      ? [coverPhoto, ...draft.photos.filter((photo) => photo.id !== coverPhoto.id)]
          .map((photo) => photo.src.trim())
          .filter((src) => src.startsWith('https://'))
      : []
    if (images.length === 0) {
      throw new Error('Bản nháp không còn ảnh Cloudinary hợp lệ. Vui lòng xóa nháp và tải ảnh mới.')
    }
    const sellerInitials = user.fullName.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase()

    try {
      await api.createListing({
        title: draft.title.trim(),
        category: draft.category,
        price: draft.giveaway ? 0 : price,
        condition: draft.condition,
        location: fullLocation,
        contactPhone: draft.phone.replace(/\D/g, ''),
        image: images[0],
        images,
        seller: user.fullName,
        sellerId: String(user.id),
        sellerInitials: sellerInitials || 'BN',
        sellerRating: 5,
        sellerReviews: 0,
        description: draft.description.trim(),
        negotiable: draft.giveaway ? false : draft.negotiable,
        giveaway: draft.giveaway,
        specs: [draft.condition === 'NEW' ? 'Hàng mới' : 'Đã sử dụng'],
      })
      navigate('my-listings')
      setNotice('Tin đăng đã được gửi và đang chờ quản trị viên duyệt.')
      try {
        await reloadFromApi()
      } catch (refreshError) {
        console.error('Tin đã gửi nhưng không thể làm mới danh sách.', refreshError)
        setNotice('Tin đã được gửi chờ duyệt, nhưng chưa thể làm mới danh sách. Vui lòng tải lại trang.')
      }
    } catch (error) {
      console.error('Không thể gửi bản nháp chờ duyệt.', error)
      throw error
    }
  }

  async function authenticate(mode: 'login' | 'register', fullName: string, email: string, password: string, phone: string): Promise<AuthSession | null> {
    if (mode === 'login') return api.login(email, password)
    await api.register(fullName, email, password, phone.replace(/\D/g, ''))
    return null
  }

  async function authenticationSucceeded(session: AuthSession) {
    try {
      api.saveSession(session)
      setUser(session.user)
      setAuthNotice('Đăng nhập thành công. Chào mừng đến với Chợ Hời!')
      await reloadFromApi(session.user)
      if (session.user.role === 'ADMIN') {
        if (window.location.pathname.replace(/\/+$/, '') !== '/admin') enterAdminRoute()
        else setIsAdminRoute(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      navigate(previousView === 'auth' ? 'home' : previousView, { historyMode: 'replace' })
    } catch (error) {
      console.error('Không thể tải dữ liệu tài khoản.', error)
      setAuthNotice(error instanceof Error ? error.message : 'Đăng nhập thành công nhưng không tải được dữ liệu.')
    }
  }

  function signOut() {
    api.clearSession()
    setUser(null)
    setSavedIds([])
    setFavoriteListings([])
    setUnreadMessageCount(0)
    setNotifications([])
    setNotificationUnreadCount(0)
    setNotificationsLoaded(false)
    setNotificationsError('')
    navigate('home')
    setAuthNotice('Bạn đã đăng xuất.')
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
      return <AuthPage onBack={leaveAdminRoute} onAuthenticate={authenticate} onVerify={api.verifyRegistration.bind(api)} onResend={api.resendRegistrationCode.bind(api)} onSuccess={authenticationSucceeded} />
    }
    if (user.role !== 'ADMIN') {
      return <div className="admin-route-message"><h1>Bạn không có quyền truy cập</h1><p>Trang quản trị chỉ dành cho tài khoản quản trị viên.</p><button className="button-primary" onClick={leaveAdminRoute}>Về trang chủ</button></div>
    }
    return <AdminPage listings={listings} onStatusChange={changeStatus} onOpen={openListingFromAdmin} onExit={leaveAdminRoute} onLoadStats={loadAdminStats} onLoadUsers={loadAdminUsers} onUserStatusChange={updateAdminUserStatus} onLoadReports={loadAdminReports} onReportAction={processAdminReport} onLoadCategories={loadAdminCategories} onCreateCategory={createAdminCategory} />
  }

  if (view === 'auth') {
    return <AuthPage onBack={() => goBack(previousView === 'auth' || authenticationRequiredViews.includes(previousView) ? 'home' : previousView)} onAuthenticate={authenticate} onVerify={api.verifyRegistration.bind(api)} onResend={api.resendRegistrationCode.bind(api)} onSuccess={authenticationSucceeded} />
  }

  return (
    <MarketplaceLayout
      view={view}
      query={query}
      location={location}
      onQueryChange={setQuery}
      onLocationChange={setLocation}
      onNavigate={navigate}
      onStartNewListing={startNewListing}
      onAdminNavigate={openAdminRoute}
      onSearch={submitSearch}
      onSignOut={signOut}
      favoritesCount={activeFavoriteListings.length}
      unreadCount={unreadMessageCount}
      notificationUnreadCount={notificationUnreadCount}
      notifications={notifications}
      onOpenNotification={(notification) => void openNotification(notification)}
      onMarkAllNotificationsRead={() => void markAllNotificationsRead()}
      user={user}
      authNotice={authNotice}
      onDismissAuthNotice={() => setAuthNotice('')}
    >
      {apiState === 'offline' && <div className="api-status-banner" role="status"><span>DEMO · Chưa kết nối database; thao tác chỉ lưu trên trình duyệt.</span><button onClick={retryConnection}>Thử kết nối lại</button><small>{apiError}</small></div>}
      {apiState === 'connecting' && <div className="api-status-banner api-status-connecting" role="status"><span>Đang kết nối Chợ Hời API...</span></div>}
      {notice && <div className="toast-message" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Đóng thông báo">×</button></div>}
      {view === 'home' && <ExplorePage listings={activeListings} savedIds={savedIds} categoryCounts={activeCategoryCounts} categories={categoryOptions} onOpen={openListing} onToggleSaved={toggleSaved} onCategory={selectCategory} />}
      {view === 'search' && <SearchPage listings={activeListings} savedIds={savedIds} query={query} categories={categoryOptions} category={category} location={location} onQueryChange={setQuery} onCategoryChange={setCategory} onLocationChange={setLocation} onOpen={openListing} onToggleSaved={toggleSaved} />}
      {view === 'detail' && selectedListing && <ListingDetailPage key={selectedListing.id} listing={selectedListing} related={relatedListings} saved={savedIds.includes(selectedListing.id)} currentUserId={user ? String(user.id) : null} onBack={() => goBack(previousView === 'detail' ? 'home' : previousView)} onToggleSaved={toggleSaved} onOpen={openListing} onContact={() => void openChat(selectedListing.id)} onSeller={() => navigate('profile')} onReport={submitListingReport} onRevealPhone={async (id) => {
        if (apiState !== 'connected') throw new Error('Backend chưa kết nối; không thể tải số điện thoại thật.')
        if (!user) {
          setNotice('Đăng nhập để xem số điện thoại người bán.')
          navigate('auth')
          throw new Error('Vui lòng đăng nhập để xem số điện thoại.')
        }
        return api.getSellerPhone(id)
      }} />}
      {view === 'detail' && !selectedListing && <div className="empty-state"><h3>Không tìm thấy tin đăng</h3><button className="button-primary" onClick={() => navigate('home')}>Về trang chủ</button></div>}
      {view === 'sell' && <SellPage key={sellFormInstance} categories={categoryOptions} restoreDraft={isEditingSavedDraft} onCancel={() => goBack(sellReturnView)} onSubmit={createListing} onLoadDraft={loadListingDraft} onSaveDraft={saveListingDraft} sellerName={user?.fullName ?? 'Người bán'} />}
      {view === 'my-listings' && <MyListingsPage listings={listings} onStatusChange={changeStatus} onOpen={openListing} onSell={startNewListing} onEditDraft={editSavedDraft} sellerId={currentSellerId} onLoadDraft={loadListingDraft} onDeleteDraft={deleteListingDraft} onPublishDraft={publishSavedDraft} />}
      {view === 'favorites' && <FavoritesPage savedListings={activeFavoriteListings} onOpen={openListing} onToggleSaved={toggleSaved} />}
      {view === 'check-in' && <CheckInPage userId={user?.id ?? null} onBack={() => goBack('home')} />}
      {user && apiState === 'connected' && <div className={view === 'messages' ? '' : 'inbox-background-listener'} aria-hidden={view !== 'messages'}>
        <InboxPage api={api} user={user} initialConversationId={selectedConversationId} isVisible={view === 'messages'} onUnreadCountChange={updateUnreadMessageCount} onListingSold={(id) => setListings((current) => current.map((listing) => listing.id === id ? listing.withStatus('SOLD') : listing))} onOpenListing={(id) => {
          const listing = listings.find((item) => item.id === id)
          if (listing) openListing(listing)
          else setNotice('Không tìm thấy tin đăng liên quan đến cuộc trò chuyện này.')
        }} />
      </div>}
      {view === 'messages' && apiState !== 'connected' && <div className="empty-state"><h3>Không thể kết nối hộp thư</h3><p>{apiError || 'Đang kết nối backend. Vui lòng thử lại sau.'}</p><button className="button-primary" onClick={retryConnection}>Thử kết nối lại</button></div>}
      {view === 'notifications' && <NotificationsPage
        notifications={notifications}
        unreadCount={notificationUnreadCount}
        loading={Boolean(user) && apiState !== 'offline' && !notificationsLoaded}
        error={notificationsError || (apiState === 'offline' ? apiError : '')}
        onOpen={(notification) => void openNotification(notification)}
        onMarkAllRead={() => void markAllNotificationsRead()}
        onRetry={() => {
          if (apiState === 'offline') {
            void retryConnection()
            return
          }
          setNotificationsLoaded(false)
          setNotificationRetry((current) => current + 1)
        }}
      />}
      {view === 'profile' && user && <ProfilePage listings={listings} onOpen={openListing} onToggleSaved={toggleSaved} onAuth={signOut} fullName={currentSellerName} sellerId={currentSellerId} api={api} />}
      {view === 'profile' && !user && <div className="empty-state"><h3>Đăng nhập để xem hồ sơ của bạn</h3><button className="button-primary" onClick={() => navigate('auth')}>Đăng nhập</button></div>}
    </MarketplaceLayout>
  )
}

function mergeListings(...groups: Listing[][]): Listing[] {
  const merged = new Map<string, Listing>()
  for (const listing of groups.flat()) merged.set(listing.id, listing)
  return [...merged.values()]
}
