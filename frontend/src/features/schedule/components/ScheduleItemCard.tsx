import type { CSSProperties } from 'react'
import { formatReminderTime, getReminderState } from '../schedule.reminder'
import { buildGoogleCalendarTemplateUrl } from '../../../integrations/calendar/googleCalendar'
import type { ScheduleItem } from '../schedule.types'

interface ScheduleItemCardProps {
  item: ScheduleItem
  index: number
  onView: (item: ScheduleItem) => void
  onEdit: (item: ScheduleItem) => void
  onDelete: (id: number) => void
}

export function ScheduleItemCard({ item, index, onView, onEdit, onDelete }: ScheduleItemCardProps) {
  const reminder = getReminderState(item)

  const openGoogleCalendar = () => {
    window.open(buildGoogleCalendarTemplateUrl(item), '_blank', 'noopener,noreferrer')
  }

  const calendarLabel = item.googleCalendar.status === 'synced'
    ? 'Google Calendar synced'
    : item.googleCalendar.status === 'error'
      ? 'Google Calendar error'
      : 'Google Calendar not synced'

  return (
    <article className="schedule-event list-reveal" style={{ '--item-index': index } as CSSProperties}>
      <div className="schedule-event-time"><strong>{item.startTime}</strong><span>{item.endTime}</span></div>
      <div className="schedule-event-line" aria-hidden="true"><span /></div>

      <div className="schedule-event-body">
        <div className="schedule-event-header">
          <div><span className="event-type">{item.type}</span><h3>{item.title}</h3></div>
          <span className={`schedule-event-status reminder-${reminder.status}`}>{reminder.status === 'scheduled' ? `Reminder ${formatReminderTime(reminder.triggerAt)}` : reminder.label}</span>
        </div>

        <p>{item.location || 'No location'}</p>

        <div className="schedule-event-meta">
          <span className={reminder.status === 'scheduled' ? 'meta-chip is-enabled' : 'meta-chip'}>
            {item.reminderEnabled ? `Reminder ${item.reminderOffset === 0 ? 'at start' : `${item.reminderOffset}m`}` : 'Reminder off'}
          </span>
          <span className="meta-chip">{item.recurrence.frequency === 'NONE' ? 'One-time' : `Repeats ${item.recurrence.frequency.toLowerCase()}`}</span>
          <span className={item.googleCalendar.status === 'synced' ? 'meta-chip is-enabled' : 'meta-chip'}>{calendarLabel}</span>
        </div>

        <div className="schedule-event-actions">
          <button className="text-button" type="button" onClick={() => onView(item)}>Details</button>
          <button className="text-button" type="button" onClick={() => onEdit(item)}>Edit</button>
          <button className="text-button" type="button" onClick={openGoogleCalendar}>Add to Google Calendar</button>
          <button className="text-button danger" type="button" onClick={() => onDelete(item.id)}>Delete</button>
        </div>
      </div>
    </article>
  )
}
