import type { ScheduleItem } from '../schedule.types'

interface ScheduleDetailProps {
  item?: ScheduleItem
  onClose: () => void
  onEdit: (item: ScheduleItem) => void
}

export function ScheduleDetail({ item, onClose, onEdit }: ScheduleDetailProps) {
  if (!item) return null

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="schedule-detail-title">
        <div className="modal-header">
          <div><span className="event-type">{item.type}</span><h3 id="schedule-detail-title">{item.title}</h3></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close detail">×</button>
        </div>
        <div className="detail-grid">
          <div><span>When</span><strong>{item.date} · {item.startTime} — {item.endTime}</strong></div>
          <div><span>Location</span><strong>{item.location || 'No location'}</strong></div>
          <div><span>Reminder</span><strong>{item.reminderEnabled ? `${item.reminderOffset === 0 ? 'At start' : `${item.reminderOffset} minutes before`}` : 'Off'}</strong></div>
          <div><span>Calendar</span><strong>{item.googleCalendarConnected ? 'Connected' : 'Not connected yet'}</strong></div>
        </div>
        <div className="detail-notes"><span>Notes</span><p>{item.notes || 'No notes added.'}</p></div>
        <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Close</button><button className="primary-button" type="button" onClick={() => onEdit(item)}>Edit activity</button></div>
      </section>
    </div>
  )
}
