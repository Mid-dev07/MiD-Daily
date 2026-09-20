import { useMemo, useState } from 'react'
import { EmptyState } from '../../components/ui/EmptyState'
import { ScheduleItemCard } from './components/ScheduleItemCard'
import { ScheduleToolbar } from './components/ScheduleToolbar'
import { scheduleItems } from './schedule.data'
import type { ScheduleType } from './schedule.types'

const today = '2026-09-20'

export function ScheduleView() {
  const [date, setDate] = useState(today)
  const [filter, setFilter] = useState<ScheduleType | 'ALL'>('ALL')

  const visibleItems = useMemo(
    () => scheduleItems
      .filter((item) => item.date === date)
      .filter((item) => filter === 'ALL' || item.type === filter),
    [date, filter],
  )

  const shiftDate = (days: number) => {
    const base = new Date(`${date}T00:00:00`)
    base.setDate(base.getDate() + days)
    setDate(base.toISOString().slice(0, 10))
  }

  return (
    <section className="workspace page-enter">
      <div className="page-intro schedule-intro">
        <div>
          <span className="section-kicker">AGENDA</span>
          <h2>Make time visible.</h2>
          <p>One flexible schedule for classes, work, study, appointments, and everything in between.</p>
        </div>
        <div className="schedule-integration-card">
          <span className="integration-label">CALENDAR</span>
          <strong>Google Calendar</strong>
          <span>Connection layer prepared</span>
          <button type="button" className="secondary-button" disabled>Connect later</button>
        </div>
      </div>

      <ScheduleToolbar
        date={date}
        filter={filter}
        onShiftDate={shiftDate}
        onResetDate={() => setDate(today)}
        onFilterChange={setFilter}
      />

      <div className="schedule-summary">
        <span>{visibleItems.length} {visibleItems.length === 1 ? 'activity' : 'activities'}</span>
        <span>•</span>
        <span>Reminder controls are ready for the native notification layer.</span>
      </div>

      <div className="content-card schedule-events-card">
        {visibleItems.length === 0 ? (
          <EmptyState title="Nothing scheduled" description="Choose another date or clear the filter." />
        ) : (
          <div className="schedule-events">
            {visibleItems.map((item, index) => (
              <ScheduleItemCard key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
