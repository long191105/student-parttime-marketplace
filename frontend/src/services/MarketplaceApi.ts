import { Listing, type ListingData, type ListingStatus } from '../domain/Listing'

const TOKEN_KEY = 'chohoi.access-token'
const SESSION_KEY = 'chohoi.session-user'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api').replace(/\/+$/, '')

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
  specs: string[]
}

interface PageResponse<T> {
  content: T[]
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
    const response = await this.request<PageResponse<ListingData>>('/admin/listings?status=PENDING&page=0&size=100')
    return response.content.map((listing) => new Listing(listing))
  }

  async createListing(draft: ListingDraft): Promise<Listing> {
    const response = await this.request<ListingData>('/listings', {
      method: 'POST',
      body: JSON.stringify({
        title: draft.title,
        category: draft.category,
        price: draft.price,
        condition: draft.condition,
        location: draft.location,
        contactPhone: draft.contactPhone,
        image: draft.image,
        images: draft.images?.length ? draft.images : [draft.image],
        description: draft.description,
        negotiable: draft.negotiable,
        specs: draft.specs,
      }),
    })
    return new Listing(response)
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
    await this.request<void>(`/favorites/${encodeURIComponent(id)}`, { method: save ? 'POST' : 'DELETE' })
  }

  async login(email: string, password: string): Promise<AuthSession> {
    return this.request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(fullName: string, email: string, password: string, phone: string): Promise<AuthSession> {
    return this.request<AuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, phone }),
    })
  }

  async getCurrentUser(): Promise<AuthUser> {
    return this.request<AuthUser>('/auth/me')
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

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
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
      throw new Error(message)
    }

    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }
}
