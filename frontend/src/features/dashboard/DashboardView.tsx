import { StatCard } from '../../components/ui/StatCard'
import type { FinanceEntry, ScheduleItem, Task } from '../../types'

interface DashboardViewProps {
  tasks: Task[]
  schedule: ScheduleItem[]
  finance: FinanceEntry[]
  onToggleTask: (id: number) => void
}

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function DashboardView({ tasks, schedule, finance, onToggleTask }: DashboardViewProps) {
  const completed = tasks.filter((task) => task.status === 'done').length
  const expenses = finance
    .filter((entry) => entry.type === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0)
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date())
  const date = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())

  return (
    <div className="dashboard-grid">
      <section className="welcome-card">
        <div>
          <span className="section-kicker">TODAY</span>
          <h2>Keep your day in motion.</h2>
          <p>One place for your schedule, tasks, and money — starting simple.</p>
        </div>
        <div className="welcome-date">
          <strong>{weekday}</strong>
          <span>{date}</span>
        </div>
      </section>

      <div className="stat-row">
        <StatCard label="Schedule" value={String(schedule.length)} hint="planned today" />
        <StatCard label="Tasks" value={`${completed}/${tasks.length}`} hint="completed" />
        <StatCard label="Today expense" value={currency.format(expenses)} hint="tracked locally" />
      </div>

      <section className="content-card schedule-card">
        <div className="card-heading">
          <div><span className="section-kicker">AGENDA</span><h3>Today&apos;s schedule</h3></div>
          <span className="card-meta">{schedule.length} items</span>
        </div>
        <div className="schedule-list">
          {schedule.map((item) => (
            <div className="schedule-item" key={item.id}>
              <div className="schedule-time"><strong>{item.start}</strong><span>{item.end}</span></div>
              <div className="timeline-dot" />
              <div className="schedule-copy"><strong>{item.title}</strong><span>{item.type} · {item.location}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="content-card task-card">
        <div className="card-heading">
          <div><span className="section-kicker">FOCUS</span><h3>Task queue</h3></div>
          <span className="card-meta">{tasks.filter((task) => task.status !== 'done').length} open</span>
        </div>
        <div className="task-list">
          {tasks.map((task) => (
            <button className="task-row" key={task.id} onClick={() => onToggleTask(task.id)} type="button">
              <span className={task.status === 'done' ? 'task-check is-done' : 'task-check'} aria-hidden="true">{task.status === 'done' ? '✓' : ''}</span>
              <span className="task-copy"><strong className={task.status === 'done' ? 'is-complete' : ''}>{task.title}</strong><small>{task.category}</small></span>
              <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
