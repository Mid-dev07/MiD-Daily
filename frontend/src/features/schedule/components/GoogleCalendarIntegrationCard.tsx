import { useEffect, useState } from 'react'
import {
  disconnectGoogleCalendar,
  getGoogleCalendarConnectionStatus,
  startGoogleCalendarOAuth,
  type GoogleCalendarConnectionStatus,
} from '../../../integrations/calendar/calendarApi'

const initialStatus: GoogleCalendarConnectionStatus = {
  configured: false,
  connected: false,
  connectedAt: null,
}

export function GoogleCalendarIntegrationCard() {
  const [status, setStatus] = useState<GoogleCalendarConnectionStatus>(initialStatus)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    void getGoogleCalendarConnectionStatus()
      .then((next) => {
        if (active) setStatus(next)
      })
      .catch(() => {
        if (active) setError('Calendar backend is not reachable.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  const connect = async () => {
    setError('')
    setLoading(true)
    try {
      await startGoogleCalendarOAuth()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to start Google Calendar authorization.')
      setLoading(false)
    }
  }

  const disconnect = async () => {
    setError('')
    setLoading(true)
    try {
      await disconnectGoogleCalendar()
      setStatus((current) => ({ ...current, connected: false, connectedAt: null }))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to disconnect Google Calendar.')
    } finally {
      setLoading(false)
    }
  }

  const headline = loading
    ? 'Checking Calendar connection…'
    : error
      ? 'Calendar connection unavailable'
      : status.connected
        ? 'Google Calendar connected'
        : status.configured
          ? 'Google Calendar ready to connect'
          : 'Google Calendar not configured'

  const description = status.connected
    ? 'OAuth is active on the backend. Schedule events can now be created, updated, and deleted through the authenticated Calendar connection.'
    : status.configured
      ? 'Connect your Google account to authorize Calendar access. MiD-Daily keeps OAuth tokens on the backend.'
      : 'Configure Google OAuth, Supabase persistence, and TOKEN_ENCRYPTION_KEY_B64 in the backend environment before connecting.'

  return (
    <section className="notification-card schedule-integration-card google-calendar-card" aria-label="Google Calendar integration">
      <div className="notification-copy">
        <span className="integration-label">GOOGLE CALENDAR</span>
        <strong className={status.connected ? 'notification-status' : ''}>{headline}</strong>
        <span>{error || description}</span>
      </div>
      <div className="notification-actions">
        {status.connected ? (
          <>
            <span className="integration-badge">CONNECTED</span>
            <button className="secondary-button" type="button" disabled={loading} onClick={() => void disconnect()}>Disconnect</button>
          </>
        ) : (
          <button className="secondary-button" type="button" disabled={loading || !status.configured} onClick={() => void connect()}>
            Connect Google
          </button>
        )}
      </div>
    </section>
  )
}
