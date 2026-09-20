import type { CSSProperties } from 'react'
import type { ScheduleItem } from '../schedule.types'

interface ScheduleItemCardProps {
  item: ScheduleItem
  index: number
}

export function ScheduleItemCard({ item, index }: ScheduleItemCardProps) {
  return (
    <article className="schedule-event list-reveal" style={{ '--item-index': index } as CSSProperties}>
      <div className="schedule-event-time">
        <strong>{item.startTime}</strong>
        <span>{item.endTime}</span>
      </div>

      <div className="schedule-event-line" aria-hidden="true">
        <span />
      </div>

      <div className="schedule-event-body">
        <div className="schedule-event-header">
          <div>
            <span className="event-type">{item.type}</span>
            <h3>{item.title}</h3>
          </div>
          <span className="schedule-event-status">Planned</span>
        </div>

        <p>{item.location}</p>

        <div className="schedule-event-meta">
          <span className={item.reminderEnabled ? 'meta-chip is-enabled' : 'meta-chip'}>
            {item.reminderEnabled ? `Reminder ${item.reminderOffset}m` : 'Reminder off'}
          </span>
          <span className="meta-chip">Google Calendar ready</span>
        </div>
      </div>
    </article>
  )
}
