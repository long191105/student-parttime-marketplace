import type { UserRole } from '../services/auth'

export type JobStatus = 'OPEN' | 'HIRED' | 'COMPLETED'
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'
export type WorkspaceView =
  | 'explore'
  | 'applications'
  | 'saved'
  | 'overview'
  | 'jobs'
  | 'candidates'
  | 'people'
  | 'moderation'
  | 'notifications'

export type MarketplaceJob = {
  id: string
  title: string
  company: string
  employerId: number | null
  initials: string
  category: string
  city: string
  address: string
  payMin: number
  payMax: number
  payUnit: 'giờ' | 'ca' | 'tháng'
  schedule: string
  employmentType: string
  description: string
  requirements: string[]
  status: JobStatus
  postedAt: string
  applicantCount: number
  featured: boolean
  tone: string
}

export type MarketplaceApplication = {
  id: string
  jobId: string
  studentId: number | null
  applicantName: string
  applicantEmail: string
  introduction: string
  resumeName: string
  status: ApplicationStatus
  createdAt: string
}

export type MarketplaceNotification = {
  id: string
  userId: number | null
  audienceRole: UserRole
  title: string
  message: string
  createdAt: string
  read: boolean
}

export type MarketplaceReview = {
  id: string
  jobId: string
  authorId: number
  authorRole: Exclude<UserRole, 'ADMIN'>
  targetId: number | null
  targetName: string
  rating: number
  comment: string
  createdAt: string
}

export type MarketplaceState = {
  jobs: MarketplaceJob[]
  applications: MarketplaceApplication[]
  notifications: MarketplaceNotification[]
  reviews: MarketplaceReview[]
  savedJobIds: string[]
}

export type JobDraft = Pick<
  MarketplaceJob,
  | 'title'
  | 'company'
  | 'category'
  | 'city'
  | 'address'
  | 'payMin'
  | 'payMax'
  | 'payUnit'
  | 'schedule'
  | 'employmentType'
  | 'description'
  | 'requirements'
>