export type UserRole = 'STUDENT' | 'EMPLOYER' | 'ADMIN'

export type AuthUser = {
  id: number
  fullName: string
  email: string
  role: UserRole
}

type AuthResponse = {
  token: string
  tokenType: string
  user: AuthUser
}

type LoginInput = {
  email: string
  password: string
}

type RegisterInput = LoginInput & {
  fullName: string
  role: Exclude<UserRole, 'ADMIN'>
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })

  const body = await response.json().catch(() => null) as { message?: string; detail?: string; title?: string } | null
  if (!response.ok) {
    throw new Error(body?.message ?? body?.detail ?? body?.title ?? 'Yêu cầu không thành công.')
  }

  return body as T
}

export function login(input: LoginInput) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function register(input: RegisterInput) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getCurrentUser(token: string) {
  return request<AuthUser>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}