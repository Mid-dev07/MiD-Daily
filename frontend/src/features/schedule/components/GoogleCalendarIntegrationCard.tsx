import { getGoogleCalendarConfig } from '../../../integrations/calendar/googleCalendar'

export function GoogleCalendarIntegrationCard() {
  const config = getGoogleCalendarConfig()

  return (
    <section className="notification-card schedule-integration-card google-calendar-card" aria-label="Google Calendar integration">
      <div className="notification-copy">
        <span className="integration-label">GOOGLE CALENDAR</span>
        <strong className={config.configured ? 'notification-status' : ''}>
          {config.configured ? 'OAuth configuration detected' : 'Calendar API not configured'}
        </strong>
        <span>
          {config.configured
            ? 'The client ID is present. Secure OAuth authorization and API sync are the next integration step.'
            : 'One-way calendar handoff is available now. API sync needs a Google OAuth client ID and a secure token exchange backend.'}
        </span>
      </div>
      <div className="notification-actions">
        <span className="integration-badge">{config.configured ? 'READY' : 'HANDOFF READY'}</span>
      </div>
    </section>
  )
}
