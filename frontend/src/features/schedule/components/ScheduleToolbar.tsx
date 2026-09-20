import { formatShortDate } from '../../../lib/format'
import type { ScheduleType } from '../schedule.types'

interface ScheduleToolbarProps {
  date: string
  filter: ScheduleType | 'ALL'
  onShiftDate: (days: number) => void
  onResetDate: () => void
  onFilterChange: (filter: ScheduleType | 'ALL') => void
}

const filters: Array<{ id: ScheduleType | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'CLASS', label: 'Class' },
  { id: 'WORK', label: 'Work' },
  { id: 'STUDY', label: 'Study' },
  { id: 'PERSONAL', label: 'Personal' },
  { id: 'MEETING', label: 'Meeting' },
]

export function ScheduleToolbar({ date, filter, onShiftDate, onResetDate, onFilterChange }: ScheduleToolbarProps) {
  return (
    <div className="schedule-toolbar content-card motion-card">
      <div className="date-control">
        <button className="icon-button" type="button" onClick={() => onShiftDate(-1)} aria-label="Previous day">←</button>
        <button className="date-label" type="button" onClick={onResetDate}>
          <span>Selected date</span>
          <strong>{formatShortDate(date)}</strong>
        </button>
        <button className="icon-button" type="button" onClick={() => onShiftDate(1)} aria-label="Next day">→</button>
      </div>

      <div className="filter-row" aria-label="Schedule filters">
        {filters.map((item) => (
          <button
            key={item.id}
            className={filter === item.id ? 'filter-button is-active' : 'filter-button'}
            type="button"
            onClick={() => onFilterChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
