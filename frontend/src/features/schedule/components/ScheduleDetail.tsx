import { formatDateLong } from '../schedule.date'
import { formatReminderTime, getReminderState } from '../schedule.reminder'
import { buildGoogleCalendarTemplateUrl } from '../../../integrations/calendar/googleCalendar'
import type { ScheduleItem } from '../schedule.types'

interface ScheduleDetailProps {
  item?: ScheduleItem
  onClose: () => void
  onEdit: (item: ScheduleItem) => void
}

export function ScheduleDetail({ item, onClose, onEdit }: ScheduleDetailProps) {
  if (!item) return null

  const reminder = getReminderState(item)
  const openGoogleCalendar = () => window.open(buildGoogleCalendarTemplateUrl(item), '_blank', 'noopener,noreferrer')
  const calendarStatus = item.googleCalendar.status === 'synced'
    ? 'Synced'
    : item.googleCalendar.status === 'error'
      ? 'Sync error'
      : 'Not synced'

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
          <button className="secondary-button" type="button" onClick={openGoogleCalendar}>Add to Google Calendar</button>
          <button className="primary-button" type="button" onClick={() => { onClose(); onEdit(item) }}>Edit activity</button>
        </div>
      </section>
    </div>
  )
}
