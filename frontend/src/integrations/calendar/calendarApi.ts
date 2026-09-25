import type { ScheduleItem } from '../../features/schedule/schedule.types'
import type { GoogleCalendarEventPayload } from './calendar.types'
import { supabase } from '../../lib/supabase'

const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'https://api.mid-manager.xyz').replace(/\/$/, '')

export interface GoogleCalendarConnectionStatus {
  configured: boolean
  connected: boolean
  connectedAt: string | null
}

export interface GoogleCalendarSyncResponse {
  eventId: string
  htmlLink: string | null
}

export class CalendarApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'CalendarApiError'
  }
}

async function getAuthHeaders() {
  if (!supabase) return {}
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token
    ? { Authorization: `Bearer ${data.session.access_token}` }
    : {}
}

async function request<T>(input: RequestInfo | URL, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const authHeaders = await getAuthHeaders()
  Object.entries(authHeaders).forEach(([key, value]) => headers.set(key, value))

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = typeof data.error === 'string' ? data.error : 'Calendar request failed.'
    throw new CalendarApiError(message, response.status)
  }

  return data as T
}

export async function getGoogleCalendarConnectionStatus(): Promise<GoogleCalendarConnectionStatus> {
  return request<GoogleCalendarConnectionStatus>(`${API_BASE_URL}/api/integrations/google-calendar/status`)
}

export async function startGoogleCalendarOAuth() {
  const data = await request<{ url: string }>(`${API_BASE_URL}/auth/google/start`, { method: 'POST' })
  window.location.assign(data.url)
}

export async function disconnectGoogleCalendar() {
  await request<{ connected: boolean }>(`${API_BASE_URL}/api/integrations/google-calendar/disconnect`, {
    method: 'POST',
  })
}

export async function createGoogleCalendarEvent(
  item: ScheduleItem,
  event: GoogleCalendarEventPayload,
): Promise<GoogleCalendarSyncResponse> {
  return request<GoogleCalendarSyncResponse>(`${API_BASE_URL}/api/integrations/google-calendar/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calendarId: item.googleCalendar.calendarId, event }),
  })
}

export async function updateGoogleCalendarEvent(
  item: ScheduleItem,
  eventId: string,
  event: GoogleCalendarEventPayload,
): Promise<GoogleCalendarSyncResponse> {
  return request<GoogleCalendarSyncResponse>(`${API_BASE_URL}/api/integrations/google-calendar/events/${encodeURIComponent(eventId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calendarId: item.googleCalendar.calendarId, event }),
  })
}

export async function deleteGoogleCalendarEvent(item: ScheduleItem, eventId: string) {
  try {
    await request<{ deleted: boolean }>(
      `${API_BASE_URL}/api/integrations/google-calendar/events/${encodeURIComponent(eventId)}?calendarId=${encodeURIComponent(item.googleCalendar.calendarId)}`,
      { method: 'DELETE' },
    )
  } catch (reason) {
    if (reason instanceof CalendarApiError && reason.status === 404) return
    throw reason
  }
}
