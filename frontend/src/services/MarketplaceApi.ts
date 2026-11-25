import { Listing, type ListingData, type ListingStatus } from '../domain/Listing'

const TOKEN_KEY = 'chohoi.access-token'
const SESSION_KEY = 'chohoi.session-user'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api').replace(/\/+$/, '')

export class MarketplaceApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'MarketplaceApiError'
    this.status = status
  }
}

export interface AuthUser {
  id: number
  fullName: string
  email: string
  role: 'MEMBER' | 'ADMIN'
}

export interface AuthSession {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: AuthUser
}

export interface AdminStats {
  activeListings: number
  pendingListings: number
  users: number
  openReports: number
}

export type AdminReportStatus = 'OPEN' | 'DISMISSED' | 'RESOLVED'
export type AdminReportAction = 'DISMISS' | 'REMOVE_LISTING' | 'LOCK_USER'

export interface AdminReport {
  id: number
  reporterName: string
  listingId: string
  listingTitle: string
  sellerName: string
  reason: string
  status: AdminReportStatus
  createdAt: string
}

export type AdminUserStatus = 'ACTIVE' | 'LOCKED'

export interface AdminUser {
  id: number
  fullName: string
  email: string
  role: 'MEMBER' | 'ADMIN'
  status: AdminUserStatus
  listingCount: number
  createdAt: string
}

export interface AdminCategory {
  id: number
  name: string
  slug: string
}

export interface ChatConversation {
  id: string
  listingId: string
  listingTitle: string
  listingImage: string
  price: number
  giveaway: boolean
  participantId: string
  participantName: string
  participantInitials: string
  lastMessage: string
  updatedAt: string
  unreadCount: number
  currentUserIsSeller: boolean
  saleConfirmed: boolean
  listingSold: boolean
}

export interface ChatReview {
  id: string
  reviewerId: string
  reviewerName: string
  listingTitle: string
  rating: number
  comment: string
  tags: string[]
  images: string[]
  createdAt: string
}

export interface ChatReviewStatus {
  eligible: boolean
  ownReviewSubmitted: boolean
  ownReview: ChatReview | null
  publishedReviews: ChatReview[]
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  content: string
  messageType: 'TEXT' | 'LOCATION' | 'MISSED_CALL' | 'CALL'
  latitude: number | null
  longitude: number | null
  mapUrl: string | null
  sentAt: string
}

export type CallType = 'audio' | 'video'

export type ChatSocketEvent =
  | { type: 'authenticated' }
  | { type: 'presence'; userId: string; online: boolean; lastActiveAt: string | null }
  | { type: 'message'; message: ChatMessage }
  | { type: 'call-invite'; conversationId: string; senderId: string; callType: CallType }
  | { type: 'call-contacting' | 'call-ringing'; conversationId: string; senderId: string }
  | { type: 'call-accept' | 'call-decline' | 'call-end'; conversationId: string; senderId: string }
  | { type: 'call-busy'; conversationId: string; senderId: string; callType: CallType }
  | { type: 'call-offer' | 'call-answer'; conversationId: string; senderId: string; description: RTCSessionDescriptionInit }
  | { type: 'call-ice'; conversationId: string; senderId: string; candidate: RTCIceCandidateInit }
  | { type: 'call-error'; conversationId: string; message: string }
  | { type: 'error'; message: string }

function isCallSocketEvent(event: ChatSocketEvent): event is Extract<ChatSocketEvent, { type: `call-${string}` }> {
  return event.type === 'call-invite'
    || event.type === 'call-contacting'
    || event.type === 'call-ringing'
    || event.type === 'call-accept'
    || event.type === 'call-decline'
    || event.type === 'call-busy'
    || event.type === 'call-end'
    || event.type === 'call-offer'
    || event.type === 'call-answer'
    || event.type === 'call-ice'
    || event.type === 'call-error'
}

export interface ListingDraft {
  title: string
  category: string
  price: number
  condition: 'NEW' | 'USED'
  location: string
  contactPhone: string
  image: string
  images?: string[]
  seller: string
  sellerId: string
  sellerInitials: string
  sellerRating: number
  sellerReviews: number
  description: string
  negotiable: boolean
  giveaway?: boolean
  specs: string[]
}

export interface ListingFormDraft {
  title: string
  category: string
  price: string
  condition: 'NEW' | 'USED'
  location: string
  fullLocation?: string
  districtCode: string
  wardCode: string
  detailAddress: string
  phone: string
  description: string
  negotiable: boolean
  giveaway: boolean
  photos: Array<{ id: string; src: string }>
  coverPhotoId: string | null
  activeStep: number
}

interface PageResponse<T> {
  content: T[]
  totalPages: number
}

export class MarketplaceApi {
  async listListings(): Promise<Listing[]> {
    const response = await this.request<PageResponse<ListingData>>('/listings?sort=newest&page=0&size=100')
    return response.content.map((listing) => new Listing(listing))
  }

  async listMyListings(): Promise<Listing[]> {
    const response = await this.request<PageResponse<ListingData>>('/listings/mine?page=0&size=100')
    return response.content.map((listing) => new Listing(listing))
  }

  async listPendingListings(): Promise<Listing[]> {
    return this.listAdminListings('PENDING')
  }

  async listAdminListings(status: ListingStatus): Promise<Listing[]> {
    const listings: Listing[] = []
    let totalPages = 1
    for (let page = 0; page < totalPages; page += 1) {
      const params = new URLSearchParams({ status, page: String(page), size: '100' })
      const response = await this.request<PageResponse<ListingData>>(`/admin/listings?${params.toString()}`)
      listings.push(...response.content.map((listing) => new Listing(listing)))
      totalPages = response.totalPages
    }
    return listings
  }

  async listAdminUsers(): Promise<AdminUser[]> {
    const users: AdminUser[] = []
    let totalPages = 1
    for (let page = 0; page < totalPages; page += 1) {
      const params = new URLSearchParams({ page: String(page), size: '100' })
      const response = await this.request<PageResponse<AdminUser>>(`/admin/users?${params.toString()}`)
      users.push(...response.content)
      totalPages = response.totalPages
    }
    return users
  }

  async updateAdminUserStatus(id: number, status: AdminUserStatus): Promise<AdminUser> {
    return this.request<AdminUser>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  async listAdminReports(): Promise<AdminReport[]> {
    const reports: AdminReport[] = []
    let totalPages = 1
    for (let page = 0; page < totalPages; page += 1) {
      const params = new URLSearchParams({ page: String(page), size: '100' })
      const response = await this.request<PageResponse<AdminReport>>(`/admin/reports?${params.toString()}`)
      reports.push(...response.content)
      totalPages = response.totalPages
    }
    return reports
  }

  async processAdminReport(id: number, action: AdminReportAction): Promise<AdminReport> {
    return this.request<AdminReport>(`/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    })
  }

  async submitListingReport(listingId: string, reason: string): Promise<void> {
    await this.request<void>('/reports', {
      method: 'POST',
      body: JSON.stringify({ listingId: Number(listingId), reason }),
    })
  }

  async getAdminStats(from: string, to: string): Promise<AdminStats> {
    const params = new URLSearchParams({ from, to })
    return this.request<AdminStats>(`/admin/stats?${params.toString()}`)
  }

  async listAdminCategories(): Promise<AdminCategory[]> {
    return this.request<AdminCategory[]>('/admin/categories')
  }

  async createAdminCategory(name: string): Promise<AdminCategory> {
    return this.request<AdminCategory>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  }

  async createListing(draft: ListingDraft): Promise<Listing> {
    const images = draft.images?.length ? draft.images : [draft.image]
    if (images.some((image) => image.startsWith('data:image/'))) {
      throw new Error('Ảnh Base64 không được gửi lên máy chủ. Vui lòng tải lại ảnh bằng Cloudinary.')
    }
    if (images.some((image) => !image.startsWith('https://'))) {
      throw new Error('Tất cả ảnh tin đăng phải là URL HTTPS.')
    }
    const response = await this.request<ListingData>('/listings', {
      method: 'POST',
      body: JSON.stringify({
        title: draft.title,
        category: draft.category,
        price: draft.price,
        condition: draft.condition,
        location: draft.location,
        contactPhone: draft.contactPhone,
        image: images[0],
        images,
        description: draft.description,
        negotiable: draft.negotiable,
        giveaway: draft.giveaway ?? false,
        specs: draft.specs,
      }),
    })
    return new Listing(response)
  }

  async getListingDraft(): Promise<ListingFormDraft | null> {
    const response = await this.request<ListingFormDraft | null>('/listings/draft')
    return response ?? null
  }

  async saveListingDraft(draft: ListingFormDraft): Promise<void> {
    await this.request<void>('/listings/draft', {
      method: 'PUT',
      body: JSON.stringify(draft),
    }, false)
  }

  async deleteListingDraft(): Promise<void> {
    await this.request<void>('/listings/draft', { method: 'DELETE' }, false)
  }

  async setListingStatus(id: string, status: ListingStatus): Promise<Listing> {
    const response = await this.request<ListingData>(`/listings/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    return new Listing(response)
  }

  async getSellerPhone(id: string): Promise<string> {
    const response = await this.request<{ phone: string }>(`/listings/${encodeURIComponent(id)}/phone`)
    return response.phone
  }

  async moderateListing(id: string, status: 'ACTIVE' | 'REJECTED', reason?: string): Promise<Listing> {
    const response = await this.request<ListingData>(
      `/admin/listings/${encodeURIComponent(id)}/${status === 'ACTIVE' ? 'approve' : 'reject'}`,
      { method: 'POST', ...(reason ? { body: JSON.stringify({ reason }) } : {}) },
    )
    return new Listing(response)
  }

  async listFavorites(): Promise<Listing[]> {
    const response = await this.request<ListingData[]>('/favorites')
    return response.map((listing) => new Listing(listing))
  }

  async toggleFavorite(id: string, save: boolean): Promise<void> {
    await this.request<void>(`/favorites/${encodeURIComponent(id)}`, { method: save ? 'POST' : 'DELETE' }, false)
  }

  async login(email: string, password: string): Promise<AuthSession> {
    return this.request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(fullName: string, email: string, password: string, phone: string): Promise<void> {
    await this.request<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, phone }),
    })
  }

  async verifyRegistration(email: string, otp: string): Promise<AuthSession> {
    return this.request<AuthSession>('/auth/register/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    })
  }

  async resendRegistrationCode(email: string): Promise<void> {
    await this.request<{ message: string }>('/auth/register/resend', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async getCurrentUser(): Promise<AuthUser> {
    return this.request<AuthUser>('/auth/me')
  }

  async listChatConversations(): Promise<ChatConversation[]> {
    return this.request<ChatConversation[]>('/chat/conversations')
  }

  async openChatForListing(listingId: string): Promise<ChatConversation> {
    return this.request<ChatConversation>(`/chat/listings/${encodeURIComponent(listingId)}`, { method: 'POST' })
  }

  async getChatMessages(conversationId: string): Promise<ChatMessage[]> {
    return this.request<ChatMessage[]>(`/chat/conversations/${encodeURIComponent(conversationId)}/messages`)
  }

  async confirmChatSale(conversationId: string): Promise<ChatConversation> {
    return this.request<ChatConversation>(`/chat/conversations/${encodeURIComponent(conversationId)}/sold`, { method: 'POST' })
  }

  async getChatReviewStatus(conversationId: string): Promise<ChatReviewStatus> {
    return this.request<ChatReviewStatus>(`/chat/conversations/${encodeURIComponent(conversationId)}/reviews`)
  }

  async getPublishedUserReviews(userId: string): Promise<ChatReview[]> {
    return this.request<ChatReview[]>(`/chat/reviews/users/${encodeURIComponent(userId)}`)
  }

  async submitChatReview(
    conversationId: string,
    review: { rating: number; comment: string; tags: string[]; images: string[] },
  ): Promise<ChatReviewStatus> {
    return this.request<ChatReviewStatus>(`/chat/conversations/${encodeURIComponent(conversationId)}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
    })
  }

  async getCallIceServers(): Promise<RTCIceServer[]> {
    return this.request<RTCIceServer[]>('/chat/ice-servers')
  }

  connectChat(onEvent: (event: ChatSocketEvent) => void): WebSocket {
    const session = this.readSession()
    if (!session) throw new Error('Vui lòng đăng nhập để kết nối hộp thư.')

    const socketUrl = new URL(API_BASE_URL)
    socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:'
    socketUrl.pathname = socketUrl.pathname.replace(/\/api\/?$/, '/ws/chat')
    if (!socketUrl.pathname.endsWith('/ws/chat')) socketUrl.pathname = `${socketUrl.pathname.replace(/\/+$/, '')}/ws/chat`

    const socket = new WebSocket(socketUrl)
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ type: 'auth', token: session.accessToken }))
    }, { once: true })
    socket.addEventListener('message', (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as ChatSocketEvent
        if (payload.type === 'authenticated' || payload.type === 'error'
          || (payload.type === 'presence' && payload.userId && typeof payload.online === 'boolean'
            && (payload.lastActiveAt === null || typeof payload.lastActiveAt === 'string'))
          || (payload.type === 'message' && payload.message?.conversationId && payload.message.id)
          || (isCallSocketEvent(payload) && payload.conversationId
            && (payload.type === 'call-error' ? payload.message : payload.senderId))) {
          onEvent(payload)
        } else {
          console.error('Nhận được sự kiện chat không hợp lệ.')
        }
      } catch (error) {
        console.error('Không thể đọc sự kiện chat realtime.', error)
      }
    })
    return socket
  }

  saveSession(session: AuthSession): void {
    try {
      window.localStorage.setItem(TOKEN_KEY, session.accessToken)
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session.user))
    } catch (error) {
      console.error('Không thể lưu phiên đăng nhập.', error)
      throw new Error('Không thể lưu phiên đăng nhập. Hãy bật bộ nhớ trình duyệt và thử lại.', { cause: error })
    }
  }

  clearSession(): void {
    try {
      window.localStorage.removeItem(TOKEN_KEY)
      window.localStorage.removeItem(SESSION_KEY)
    } catch (error) {
      console.error('Không thể xóa phiên đăng nhập.', error)
    }
  }

  readSession(): { accessToken: string; user: AuthUser } | null {
    try {
      const accessToken = window.localStorage.getItem(TOKEN_KEY)
      const savedUser = window.localStorage.getItem(SESSION_KEY)
      if (!accessToken || !savedUser) return null
      return { accessToken, user: JSON.parse(savedUser) as AuthUser }
    } catch (error) {
      console.error('Không thể đọc phiên đăng nhập.', error)
      return null
    }
  }

  private async request<T>(path: string, init: RequestInit = {}, expectJson = true): Promise<T> {
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')
    if (init.body) headers.set('Content-Type', 'application/json')

    let token: string | null = null
    try {
      token = window.localStorage.getItem(TOKEN_KEY)
    } catch (error) {
      console.error('Không thể đọc mã xác thực.', error)
    }
    if (token) headers.set('Authorization', `Bearer ${token}`)

    let response: Response
    try {
      response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
    } catch (error) {
      throw new Error(`Không thể kết nối API tại ${API_BASE_URL}. Hãy khởi động backend và kiểm tra PostgreSQL.`, { cause: error })
    }

    if (!response.ok) {
      let message = `Yêu cầu thất bại (${response.status}).`
      try {
        const body = await response.json() as { message?: string }
        if (body.message) message = body.message
      } catch {
        if (response.status === 401) message = 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
      }
      throw new MarketplaceApiError(message, response.status)
    }

    if (!expectJson || response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }
}
