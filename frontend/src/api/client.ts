const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000')
  .trim()
  .replace(/\/+$/, '')

export interface HealthResponse {
  status: string
  service: string
}

export interface UserProfile {
  id: string
  full_name: string
  email: string
  created_at: string
}

export interface RegisterRequest {
  full_name: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    const error =
      typeof body === 'object' && body !== null && 'error' in body
        ? body.error
        : null
    const message =
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
        ? error.message
        : 'Something went wrong. Please try again.'
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : 'request_failed'
    throw new ApiError(message, response.status, code)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await request<HealthResponse>('/api/v1/health')
  if (
    typeof response.status !== 'string' ||
    typeof response.service !== 'string'
  ) {
    throw new Error('The API returned an invalid health response.')
  }
  return response
}

export function registerUser(payload: RegisterRequest): Promise<UserProfile> {
  return request<UserProfile>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function loginUser(payload: LoginRequest): Promise<{ user: UserProfile }> {
  return request<{ user: UserProfile }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    return await request<UserProfile>('/api/v1/auth/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null
    }
    throw error
  }
}

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') {
    return null
  }
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith('campus_csrf_token='))
  return cookie ? decodeURIComponent(cookie.slice(cookie.indexOf('=') + 1)) : null
}

export function logoutUser(): Promise<void> {
  const csrfToken = getCsrfToken()
  return request<void>('/api/v1/auth/logout', {
    method: 'POST',
    headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined,
  })
}
