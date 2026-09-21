import { useState, type CSSProperties } from 'react'
import { formatReminderTime, getReminderState } from '../schedule.reminder'
import { buildGoogleCalendarTemplateUrl } from '../../../integrations/calendar/googleCalendar'
import type { ScheduleItem } from '../schedule.types'

interface ScheduleItemCardProps {
  item: ScheduleItem
  index: number
  onView: (item: ScheduleItem) => void
  onEdit: (item: ScheduleItem) => void
  onSync: (item: ScheduleItem) => Promise<void>
  onDelete: (item: ScheduleItem) => Promise<void>
}

export function ScheduleItemCard({ item, index, onView, onEdit, onSync, onDelete }: ScheduleItemCardProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const reminder = getReminderState(item)
  const modeLabel = item.activityMode === 'FIXED'
    ? (item.recurrence.frequency === 'NONE' ? 'Fixed time' : 'Fixed · ' + item.recurrence.frequency.toLowerCase())
    : 'One-time'
  const syncLabel = item.googleCalendar.status === 'synced' ? 'Update Google' : 'Sync to Google'
  const calendarLabel = item.googleCalendar.status === 'synced'
    ? 'Google Calendar synced'
    : item.googleCalendar.status === 'error'
      ? 'Google Calendar error'
      : item.googleCalendar.status === 'pending'
        ? 'Google Calendar pending'
        : 'Google Calendar not synced'

  const openGoogleCalendar = () => {
    window.open(buildGoogleCalendarTemplateUrl(item), '_blank', 'noopener,noreferrer')
  }

  const sync = async () => {
    setError('')
    setBusy(true)
    try {
      await onSync(item)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Calendar sync failed.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!window.confirm('Delete “' + item.title + '”?')) return
    setError('')
    setBusy(true)
    try {
      await onDelete(item)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Calendar deletion failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="schedule-event list-reveal" style={{ '--item-index': index } as CSSProperties}>
      <div className="schedule-event-time"><strong>{item.startTime}</strong><span>{item.endTime}</span></div>
      <div className="schedule-event-line" aria-hidden="true"><span /></div>

      <div className="schedule-event-body">
        <div className="schedule-event-header">
          <div><span className="event-type">{item.activityMode} · {item.type}</span><h3>{item.title}</h3></div>
          <span className={`schedule-event-status reminder-${reminder.status}`}>{reminder.status === 'scheduled' ? `Reminder ${formatReminderTime(reminder.triggerAt)}` : reminder.label}</span>
        </div>

        <p>{item.location || 'No location'}</p>

        <div className="schedule-event-meta">
          <span className={reminder.status === 'scheduled' ? 'meta-chip is-enabled' : 'meta-chip'}>
            {item.reminderEnabled ? `Reminder ${item.reminderOffset === 0 ? 'at start' : `${item.reminderOffset}m`}` : 'Reminder off'}
          </span>
          <span className="meta-chip">{modeLabel}</span>
          <span className={item.googleCalendar.status === 'synced' ? 'meta-chip is-enabled' : 'meta-chip'}>{calendarLabel}</span>
        </div>

        {error && <div className="form-error schedule-inline-error" role="alert">{error}</div>}

        <div className="schedule-event-actions">
          <button className="text-button" type="button" disabled={busy} onClick={() => onView(item)}>Details</button>
          <button className="text-button" type="button" disabled={busy} onClick={() => onEdit(item)}>Edit</button>

          <details className="schedule-more">
            <summary className="text-button" aria-label={'More actions for ' + item.title}>More</summary>
            <div className="schedule-more-menu">
              <button className="text-button" type="button" disabled={busy} onClick={() => void sync()}>{busy ? 'Working…' : syncLabel}</button>
              <button className="text-button" type="button" disabled={busy} onClick={openGoogleCalendar}>Open Calendar</button>
              <button className="text-button danger" type="button" disabled={busy} onClick={() => void remove()}>Delete</button>
            </div>
          </details>
        </div>
      </div>
    </article>
  )
}
