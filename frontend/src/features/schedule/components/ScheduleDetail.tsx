import { useState } from 'react'
import { useModalBehavior } from '../../../lib/useModalBehavior'
import { buildGoogleCalendarTemplateUrl } from '../../../integrations/calendar/googleCalendar'
import { formatDateLong } from '../schedule.date'
import { formatReminderTime, getReminderState } from '../schedule.reminder'
import type { ScheduleItem } from '../schedule.types'

interface ScheduleDetailProps {
  item?: ScheduleItem
  onClose: () => void
  onEdit: (item: ScheduleItem) => void
  onSync: (item: ScheduleItem) => Promise<void>
}

export function ScheduleDetail({ item, onClose, onEdit, onSync }: ScheduleDetailProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dialogRef = useModalBehavior(Boolean(item), onClose, busy)

  if (!item) return null

  const flexible = item.activityMode === 'FLEXIBLE'
  const reminder = getReminderState(item)
  const calendarStatus = item.googleCalendar.status === 'synced'
    ? 'Synced'
    : item.googleCalendar.status === 'error'
      ? 'Sync error'
      : item.googleCalendar.status === 'pending'
        ? 'Pending sync'
        : 'Not synced'

  const syncLabel = item.googleCalendar.status === 'synced' ? 'Update Google' : 'Sync to Google'

  const sync = async () => {
    setError('')
    setBusy(true)
    try {
      await onSync(item)
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Calendar sync failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <section ref={dialogRef} className="modal-card detail-card" role="dialog" aria-modal="true" aria-labelledby="schedule-detail-title">
        <div className="modal-header">
          <div><span className="section-kicker">{item.activityMode} · {item.type}</span><h3 id="schedule-detail-title">{item.title}</h3></div>
          <button className="icon-button" type="button" disabled={busy} onClick={onClose} aria-label="Close details">×</button>
        </div>

        {flexible ? (
          <>
            <div className="detail-grid">
              <div><span>Planning starts</span><strong>{formatDateLong(item.date)}</strong></div>
              <div><span>Target</span><strong>{item.targetCount} per {item.targetPeriod?.toLowerCase()}</strong></div>
              <div><span>Session</span><strong>{item.durationMinutes} minutes</strong></div>
              <div><span>Preferred time</span><strong>{item.preferredStartTime && item.preferredEndTime ? item.preferredStartTime + ' — ' + item.preferredEndTime : 'Any suitable time'}</strong></div>
              <div><span>Deadline</span><strong>{item.activityDeadline ? formatDateLong(item.activityDeadline) : 'No deadline'}</strong></div>
              <div><span>Calendar</span><strong>Flexible plan · not synced</strong></div>
            </div>
            <div className="detail-callout">
              <strong>No fixed slot</strong>
              <span>This plan is designed to fit around your fixed schedule later.</span>
            </div>
          </>
        ) : (
          <div className="detail-grid">
            <div><span>Date</span><strong>{formatDateLong(item.date)}</strong></div>
            <div><span>Time</span><strong>{item.startTime} — {item.endTime}</strong></div>
            <div><span>Location</span><strong>{item.location || 'No location'}</strong></div>
            <div><span>Repeat</span><strong>{item.activityMode === 'FIXED' && item.recurrence.frequency !== 'NONE' ? 'Every ' + item.recurrence.interval + ' ' + item.recurrence.frequency.toLowerCase() : 'One-time'}</strong></div>
            <div><span>Reminder</span><strong>{reminder.status === 'scheduled' ? 'Scheduled for ' + formatReminderTime(reminder.triggerAt) : reminder.label}</strong></div>
            <div><span>Calendar</span><strong>{calendarStatus}</strong></div>
          </div>
        )}

        {item.location && flexible && <div className="detail-notes"><span>Location</span><p>{item.location}</p></div>}
        {item.notes && <div className="detail-notes"><span>Notes</span><p>{item.notes}</p></div>}
        {error && <div className="form-error" role="alert">{error}</div>}

        <div className="modal-actions">
          <button className="secondary-button" type="button" disabled={busy} onClick={onClose}>Close</button>
          {!flexible && <button className="secondary-button" type="button" disabled={busy} onClick={() => void sync()}>{busy ? 'Working…' : syncLabel}</button>}
          {!flexible && <button className="secondary-button" type="button" disabled={busy} onClick={() => window.open(buildGoogleCalendarTemplateUrl(item), '_blank', 'noopener,noreferrer')}>Open Calendar</button>}
          <button className="primary-button" type="button" disabled={busy} onClick={() => { onClose(); onEdit(item) }}>Edit activity</button>
        </div>
      </section>
    </div>
  )
}
