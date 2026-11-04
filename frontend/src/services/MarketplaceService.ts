import { Listing, type ListingData, type ListingStatus } from '../domain/Listing'
import { seedListings } from '../data/seedListings'

const LISTINGS_KEY = 'chohoi.listings.v1'
const FAVORITES_KEY = 'chohoi.favorites.v1'

export interface ListingFilters {
  keyword?: string
  category?: string
  location?: string
  condition?: string
  minPrice?: number
  maxPrice?: number
  sort?: 'newest' | 'price-low' | 'price-high'
}

export class MarketplaceService {
  private listings: Listing[]
  private favorites: Set<string>

  constructor() {
    this.listings = this.readListings()
    this.favorites = this.readFavorites()
  }

  getListings(): Listing[] {
    return [...this.listings]
  }

  getFavorites(): string[] {
    return [...this.favorites]
  }

  search(filters: ListingFilters = {}): Listing[] {
    const keyword = filters.keyword?.trim().toLocaleLowerCase('vi')
    const filtered = this.listings.filter((listing) => {
      if (listing.status !== 'ACTIVE') return false
      if (filters.category && filters.category !== 'Tất cả' && listing.category !== filters.category) return false
      if (filters.location && filters.location !== 'Toàn quốc' && !listing.location.includes(filters.location)) return false
      if (filters.condition && filters.condition !== 'Tất cả' && listing.conditionLabel !== filters.condition) return false
      if (filters.minPrice && listing.price < filters.minPrice) return false
      if (filters.maxPrice && listing.price > filters.maxPrice) return false
      if (keyword && !`${listing.title} ${listing.description} ${listing.category} ${listing.location}`.toLocaleLowerCase('vi').includes(keyword)) return false
      return true
    })

    if (filters.sort === 'price-low') return filtered.sort((a, b) => a.price - b.price)
    if (filters.sort === 'price-high') return filtered.sort((a, b) => b.price - a.price)
    return filtered
  }

  findById(id: string): Listing | undefined {
    return this.listings.find((listing) => listing.id === id)
  }

  toggleFavorite(id: string): string[] {
    const nextFavorites = new Set(this.favorites)
    if (nextFavorites.has(id)) nextFavorites.delete(id)
    else nextFavorites.add(id)
    this.persistFavorites(nextFavorites)
    this.favorites = nextFavorites
    return this.getFavorites()
  }

  createListing(data: Omit<ListingData, 'id' | 'status' | 'views' | 'postedAt'>): Listing {
    const listing = new Listing({
      ...data,
      id: `listing-${Date.now()}`,
      status: 'PENDING',
      views: 0,
      postedAt: 'Vừa xong',
    })
    const nextListings = [listing, ...this.listings]
    this.persistListings(nextListings)
    this.listings = nextListings
    return listing
  }

  setStatus(id: string, status: ListingStatus, reviewReason?: string): void {
    if (status === 'REJECTED' && !reviewReason?.trim()) {
      throw new Error('Vui lòng nhập lý do từ chối tin đăng.')
    }
    const nextListings = this.listings.map((listing) => listing.id === id ? listing.withStatus(status, reviewReason?.trim()) : listing)
    this.persistListings(nextListings)
    this.listings = nextListings
  }

  private readListings(): Listing[] {
    const saved = this.readStorage(LISTINGS_KEY)
    if (!saved) return seedListings.map((item) => new Listing(item))

    try {
      const parsed = JSON.parse(saved) as ListingData[]
      return parsed.map((item) => new Listing(item))
    } catch (error) {
      console.error('Không thể đọc dữ liệu tin đăng đã lưu.', error)
      return seedListings.map((item) => new Listing(item))
    }
  }

  private readFavorites(): Set<string> {
    const saved = this.readStorage(FAVORITES_KEY)
    if (!saved) return new Set()
    try {
      const parsed = JSON.parse(saved) as string[]
      return new Set(parsed)
    } catch (error) {
      console.error('Không thể đọc danh sách tin đã lưu.', error)
      return new Set()
    }
  }

  private readStorage(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch (error) {
      console.error(`Không thể truy cập dữ liệu ${key}.`, error)
      return null
    }
  }

  private persistListings(listings: Listing[] = this.listings): void {
    try {
      window.localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings))
    } catch (error) {
      console.error('Không thể lưu tin đăng vào bộ nhớ trình duyệt.', error)
      throw new Error('Không thể lưu tin đăng. Vui lòng kiểm tra dung lượng bộ nhớ trình duyệt.', { cause: error })
    }
  }

  private persistFavorites(favorites: Set<string> = this.favorites): void {
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]))
    } catch (error) {
      console.error('Không thể lưu danh sách yêu thích vào bộ nhớ trình duyệt.', error)
      throw new Error('Không thể lưu thay đổi yêu thích. Vui lòng thử lại.', { cause: error })
    }
  }
}
