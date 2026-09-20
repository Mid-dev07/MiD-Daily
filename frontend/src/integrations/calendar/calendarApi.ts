import type { ScheduleItem } from '../../features/schedule/schedule.types'
import type { GoogleCalendarEventPayload } from './calendar.types'

const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8787').replace(/\/$/, '')

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

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { ...init, credentials: 'include' })
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

export function startGoogleCalendarOAuth() {
  window.location.assign(`${API_BASE_URL}/auth/google/start`)
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
  await request<{ deleted: boolean }>(
    `${API_BASE_URL}/api/integrations/google-calendar/events/${encodeURIComponent(eventId)}?calendarId=${encodeURIComponent(item.googleCalendar.calendarId)}`,
    { method: 'DELETE' },
  )
}
