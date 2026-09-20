import type { CSSProperties } from 'react'
import type { ScheduleItem } from '../../types'
import { EmptyState } from '../../components/ui/EmptyState'

interface ScheduleViewProps { schedule: ScheduleItem[] }

export function ScheduleView({ schedule }: ScheduleViewProps) {
  return (
    <section className="workspace page-enter" key="schedule">
      <div className="page-intro">
        <span className="section-kicker">MODULE</span>
        <h2>Schedule</h2>
        <p>Manage activities beyond classes — work, study, personal, meetings, and events.</p>
      </div>
      <div className="content-card module-list motion-card">
        {schedule.length === 0 && <EmptyState title="Your schedule is clear" description="Add activities when the schedule module becomes persistent." />}
        {schedule.map((item, index) => (
          <div className="module-row list-reveal" style={{ '--item-index': index } as CSSProperties} key={item.id}>
            <div className="module-leading"><strong>{item.start} — {item.end}</strong><span>{item.location}</span></div>
            <div className="module-main"><strong>{item.title}</strong><span>{item.type}</span></div>
          </div>
        ))}
      </div>
    </section>
  )
}
