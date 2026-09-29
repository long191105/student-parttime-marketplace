import { useEffect, useState } from 'react'
import type { UserRole } from '../services/auth'
import { marketplaceSeed } from '../data/marketplaceSeed'
import type {
  ApplicationStatus,
  JobDraft,
  JobStatus,
  MarketplaceApplication,
  MarketplaceJob,
  MarketplaceNotification,
  MarketplaceReview,
  MarketplaceState,
} from '../types/marketplace'

const storageKey = 'ca-lam-marketplace:v1'

function loadMarketplace(): MarketplaceState {
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) return JSON.parse(stored) as MarketplaceState
  } catch {
    localStorage.removeItem(storageKey)
  }
  return marketplaceSeed
}

function createNotification(
  userId: number | null,
  audienceRole: UserRole,
  title: string,
  message: string,
): MarketplaceNotification {
  return {
    id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    audienceRole,
    title,
    message,
    createdAt: new Date().toISOString(),
    read: false,
  }
}

export function useMarketplace() {
  const [state, setState] = useState<MarketplaceState>(loadMarketplace)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state])

  function createJob(ownerId: number, draft: JobDraft) {
    const job: MarketplaceJob = {
      ...draft,
      id: `job-${Date.now()}`,
      employerId: ownerId,
      initials: draft.company.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(),
      status: 'OPEN',
      postedAt: 'Vừa đăng',
      applicantCount: 0,
      featured: false,
      tone: 'mint',
    }
    setState((current) => ({ ...current, jobs: [job, ...current.jobs] }))
  }

  function submitApplication(
    jobId: string,
    studentId: number,
    applicantName: string,
    applicantEmail: string,
    introduction: string,
    resumeName: string,
  ) {
    const job = state.jobs.find((item) => item.id === jobId)
    const alreadyApplied = state.applications.some((item) => item.jobId === jobId && item.studentId === studentId)
    if (!job || alreadyApplied || job.status !== 'OPEN') return false

    const application: MarketplaceApplication = {
      id: `application-${Date.now()}`,
      jobId,
      studentId,
      applicantName,
      applicantEmail,
      introduction,
      resumeName,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    }
    const notification = createNotification(
      job.employerId,
      'EMPLOYER',
      'Bạn có ứng viên mới',
      `${applicantName} vừa ứng tuyển vị trí ${job.title}.`,
    )

    setState((current) => ({
      ...current,
      applications: [application, ...current.applications],
      jobs: current.jobs.map((item) => item.id === jobId ? { ...item, applicantCount: item.applicantCount + 1 } : item),
      notifications: [notification, ...current.notifications],
    }))
    return true
  }

  function updateApplicationStatus(applicationId: string, status: ApplicationStatus) {
    const application = state.applications.find((item) => item.id === applicationId)
    const job = application && state.jobs.find((item) => item.id === application.jobId)
    if (!application || !job) return

    const notification = application.studentId === null ? null : createNotification(
      application.studentId,
      'STUDENT',
      status === 'ACCEPTED' ? 'Hồ sơ được chọn' : 'Cập nhật hồ sơ ứng tuyển',
      `Nhà tuyển dụng đã ${status === 'ACCEPTED' ? 'chấp nhận' : 'từ chối'} hồ sơ của bạn cho vị trí ${job.title}.`,
    )
    setState((current) => ({
      ...current,
      applications: current.applications.map((item) => item.id === applicationId ? { ...item, status } : item),
      jobs: status === 'ACCEPTED'
        ? current.jobs.map((item) => item.id === job.id ? { ...item, status: 'HIRED' } : item)
        : current.jobs,
      notifications: notification ? [notification, ...current.notifications] : current.notifications,
    }))
  }

  function updateJobStatus(jobId: string, status: JobStatus) {
    setState((current) => ({
      ...current,
      jobs: current.jobs.map((job) => job.id === jobId ? { ...job, status } : job),
    }))
  }

  function removeJob(jobId: string) {
    setState((current) => ({
      ...current,
      jobs: current.jobs.filter((job) => job.id !== jobId),
      applications: current.applications.filter((application) => application.jobId !== jobId),
      reviews: current.reviews.filter((review) => review.jobId !== jobId),
      savedJobIds: current.savedJobIds.filter((id) => id !== jobId),
    }))
  }

  function toggleSavedJob(jobId: string) {
    setState((current) => ({
      ...current,
      savedJobIds: current.savedJobIds.includes(jobId)
        ? current.savedJobIds.filter((id) => id !== jobId)
        : [...current.savedJobIds, jobId],
    }))
  }

  function addReview(review: Omit<MarketplaceReview, 'id' | 'createdAt'>) {
    const alreadyReviewed = state.reviews.some((item) => item.jobId === review.jobId && item.authorId === review.authorId)
    if (alreadyReviewed) return false
    const savedReview: MarketplaceReview = {
      ...review,
      id: `review-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setState((current) => ({ ...current, reviews: [savedReview, ...current.reviews] }))
    return true
  }

  function markNotificationsRead(userId: number, role: UserRole) {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) =>
        (notification.userId === userId || notification.audienceRole === role)
          ? { ...notification, read: true }
          : notification,
      ),
    }))
  }

  return {
    state,
    createJob,
    submitApplication,
    updateApplicationStatus,
    updateJobStatus,
    removeJob,
    toggleSavedJob,
    addReview,
    markNotificationsRead,
  }
}