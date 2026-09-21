import { supabase } from './supabase'

const configuredApiUrl = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').trim()
const defaultApiUrl = import.meta.env.DEV
  ? 'http://localhost:8787'
  : 'https://mid-daily-api.e41262272.workers.dev'
const API_BASE_URL = (configuredApiUrl || defaultApiUrl).replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

async function authHeaders() {
  if (!supabase) return {}
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {}
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const auth = await authHeaders()
  Object.entries(auth).forEach(([key, value]) => headers.set(key, value))

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new ApiError(typeof data.error === 'string' ? data.error : 'API request failed.', response.status)
  }

  return data as T
}
