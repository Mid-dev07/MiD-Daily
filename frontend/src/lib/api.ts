import { supabase } from './supabase'

const configuredApiUrl = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').trim()
const defaultApiUrl = import.meta.env.DEV
  ? 'http://localhost:8787'
  : 'https://mid-daily-api.e41262272.workers.dev'

// Never let a production build accidentally call a local development server.
const isLocalApiUrl = /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(configuredApiUrl)
const API_BASE_URL = (configuredApiUrl && !isLocalApiUrl ? configuredApiUrl : defaultApiUrl).replace(/\/$/, '')
const API_TIMEOUT_MS = 15_000

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

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS)
  const upstreamSignal = init.signal

  const abortFromUpstream = () => controller.abort()
  if (upstreamSignal) {
    if (upstreamSignal.aborted) controller.abort()
    else upstreamSignal.addEventListener('abort', abortFromUpstream, { once: true })
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: 'include',
      signal: controller.signal,
    })
  } catch (reason) {
    if (reason instanceof DOMException && reason.name === 'AbortError') {
      throw new Error('MiD-Daily API timed out. Check your connection and try again.')
    }
    throw new Error(`Unable to reach MiD-Daily API at ${API_BASE_URL}.`)
  } finally {
    window.clearTimeout(timeout)
    upstreamSignal?.removeEventListener('abort', abortFromUpstream)
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new ApiError(typeof data.error === 'string' ? data.error : 'API request failed.', response.status)
  }

  return data as T
}


export async function checkPasswordExposure(password: string): Promise<void> {
  const encoded = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-1', encoded)
  const fullHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
  const hashPrefix = fullHash.slice(0, 5)
  const hashSuffix = fullHash.slice(5)

  try {
    const result = await apiRequest<{ ok: boolean; suffixes: string }>('/api/security/password-range', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hashPrefix }),
    })

    const compromised = result.suffixes.split('\n').some((line) => {
      const [suffix, count] = line.trim().toUpperCase().split(':')
      return suffix === hashSuffix && Number(count) > 0
    })

    if (compromised) {
      throw new Error('This password has appeared in known data breaches. Choose a different password.')
    }
  } catch (reason) {
    if (reason instanceof Error && reason.message.includes('has appeared in known data breaches')) {
      throw reason
    }
    throw new Error('Password security check is unavailable. Please try again.')
  }
}
