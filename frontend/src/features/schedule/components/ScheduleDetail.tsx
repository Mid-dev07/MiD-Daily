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
  if (!item) return null

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
    await onSync(item)
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card detail-card" role="dialog" aria-modal="true" aria-labelledby="schedule-detail-title">
        <div className="modal-header">
          <div><span className="section-kicker">{item.type}</span><h3 id="schedule-detail-title">{item.title}</h3></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close details">×</button>
        </div>

        <div className="detail-grid">
          <div><span>Date</span><strong>{formatDateLong(item.date)}</strong></div>
          <div><span>Time</span><strong>{item.startTime} — {item.endTime}</strong></div>
          <div><span>Location</span><strong>{item.location || 'No location'}</strong></div>
          <div><span>Repeat</span><strong>{item.recurrence.frequency === 'NONE' ? 'One-time' : `Every ${item.recurrence.interval} ${item.recurrence.frequency.toLowerCase()}`}</strong></div>
          <div><span>Reminder</span><strong>{reminder.status === 'scheduled' ? `Scheduled for ${formatReminderTime(reminder.triggerAt)}` : reminder.label}</strong></div>
          <div><span>Calendar</span><strong>{calendarStatus}</strong></div>
        </div>

        {item.notes && <div className="detail-notes"><span>Notes</span><p>{item.notes}</p></div>}

        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Close</button>
          <button className="secondary-button" type="button" onClick={() => void sync()}>{syncLabel}</button>
          <button className="secondary-button" type="button" onClick={() => window.open(buildGoogleCalendarTemplateUrl(item), '_blank', 'noopener,noreferrer')}>Open Calendar</button>
          <button className="primary-button" type="button" onClick={() => { onClose(); onEdit(item) }}>Edit activity</button>
        </div>
      </section>
    </div>
  )
}
