import type { ScheduleItem } from '../../types'

interface ScheduleViewProps { schedule: ScheduleItem[] }

export function ScheduleView({ schedule }: ScheduleViewProps) {
  return (
    <section className="workspace">
      <div className="page-intro">
        <span className="section-kicker">MODULE</span>
        <h2>Schedule</h2>
        <p>Manage activities beyond classes — work, study, personal time, meetings, and events.</p>
      </div>
      <div className="content-card module-list">
        {schedule.map((item) => (
          <article className="module-row" key={item.id}>
            <div className="module-leading"><strong>{item.start} — {item.end}</strong><span>{item.location}</span></div>
            <div className="module-main"><strong>{item.title}</strong><span>{item.type}</span></div>
          </article>
        ))}
      </div>
    </section>
  )
}
