const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8787').replace(/\\/$/, '')

export interface GoogleCalendarConnectionStatus {
  configured: boolean
  connected: boolean
  connectedAt: string | null
}

export function getGoogleCalendarApiBaseUrl() {
  return API_BASE_URL
}

export async function getGoogleCalendarConnectionStatus(): Promise<GoogleCalendarConnectionStatus> {
  const response = await fetch(`${API_BASE_URL}/api/integrations/google-calendar/status`, {
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Calendar backend unavailable.')
  return response.json() as Promise<GoogleCalendarConnectionStatus>
}

export function startGoogleCalendarOAuth() {
  window.location.assign(`${API_BASE_URL}/auth/google/start`)
}

export async function disconnectGoogleCalendar() {
  const response = await fetch(`${API_BASE_URL}/api/integrations/google-calendar/disconnect`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Unable to disconnect Google Calendar.')
}
