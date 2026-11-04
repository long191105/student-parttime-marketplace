export type ListingStatus = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'SOLD' | 'HIDDEN' | 'EXPIRED'
export type ListingCondition = 'NEW' | 'USED'

export interface ListingData {
  id: string
  title: string
  category: string
  price: number
  condition: ListingCondition
  location: string
  postedAt: string
  image: string
  seller: string
  sellerId: string
  sellerInitials: string
  sellerRating: number
  sellerReviews: number
  description: string
  status: ListingStatus
  views: number
  negotiable: boolean
  specs: string[]
  reviewReason?: string
}

export class Listing implements ListingData {
  readonly id: string
  readonly title: string
  readonly category: string
  readonly price: number
  readonly condition: ListingCondition
  readonly location: string
  readonly postedAt: string
  readonly image: string
  readonly seller: string
  readonly sellerId: string
  readonly sellerInitials: string
  readonly sellerRating: number
  readonly sellerReviews: number
  readonly description: string
  readonly status: ListingStatus
  readonly views: number
  readonly negotiable: boolean
  readonly specs: string[]
  readonly reviewReason?: string

  constructor(data: ListingData) {
    Object.assign(this, data)
    this.id = data.id
    this.title = data.title
    this.category = data.category
    this.price = data.price
    this.condition = data.condition
    this.location = data.location
    this.postedAt = data.postedAt
    this.image = data.image
    this.seller = data.seller
    this.sellerId = data.sellerId
    this.sellerInitials = data.sellerInitials
    this.sellerRating = data.sellerRating
    this.sellerReviews = data.sellerReviews
    this.description = data.description
    this.status = data.status
    this.views = data.views
    this.negotiable = data.negotiable
    this.specs = data.specs
    this.reviewReason = data.reviewReason
  }

  get priceLabel(): string {
    if (this.price === 0) return 'Thỏa thuận'
    return `${new Intl.NumberFormat('vi-VN').format(this.price)} đ`
  }

  get conditionLabel(): string {
    return this.condition === 'NEW' ? 'Mới' : 'Đã sử dụng'
  }

  withStatus(status: ListingStatus, reviewReason?: string): Listing {
    return new Listing({ ...this, status, reviewReason: status === 'REJECTED' ? reviewReason : undefined })
  }
}
