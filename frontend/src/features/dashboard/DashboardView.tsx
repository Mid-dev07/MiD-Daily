import type { FinanceEntry, Task } from '../../types'
import type { ScheduleItem } from '../schedule/schedule.types'
import { currency, formatDate } from '../../lib/format'
import { StatCard } from '../../components/ui/StatCard'

interface DashboardViewProps {
  tasks: Task[]
  schedule: ScheduleItem[]
  finance: FinanceEntry[]
  onToggleTask: (id: number) => void
}

export function DashboardView({ tasks, schedule, finance, onToggleTask }: DashboardViewProps) {
  const completed = tasks.filter((task) => task.status === 'done').length
  const expense = finance.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0)

  return (
    <section className="dashboard-grid page-enter">
      <div className="welcome-card motion-card">
        <div><span className="section-kicker">TODAY</span><h2>Keep your day in motion.</h2><p>Your schedule is ready for reminders, calendar sync, and daily flow.</p></div>
        <div className="welcome-date"><strong>Sunday</strong><span>{formatDate('2026-09-20')}</span></div>
      </div>

      <div className="stat-row">
        <StatCard label="Schedule" value={String(schedule.length)} hint="planned today" />
        <StatCard label="Tasks" value={`${completed}/${tasks.length}`} hint="completed" />
        <StatCard label="Expense" value={currency.format(expense)} hint="tracked locally" />
      </div>

      <section className="content-card schedule-card motion-card">
        <div className="card-heading"><div><span className="section-kicker">AGENDA</span><h3>Today&apos;s schedule</h3></div><span className="card-meta">{schedule.length} items</span></div>
        <div className="schedule-list">
          {schedule.map((item) => <div className="schedule-item" key={item.id}><div className="schedule-time"><strong>{item.startTime}</strong><span>{item.endTime}</span></div><div className="timeline-dot" /><div className="schedule-copy"><strong>{item.title}</strong><span>{item.type} · {item.location}</span></div></div>)}
        </div>
      </section>

      <section className="content-card task-card motion-card">
        <div className="card-heading"><div><span className="section-kicker">FOCUS</span><h3>Task queue</h3></div><span className="card-meta">{tasks.filter((task) => task.status !== 'done').length} open</span></div>
        <div className="task-list">
          {tasks.map((task) => <button className="task-row" key={task.id} type="button" onClick={() => onToggleTask(task.id)}><span className={task.status === 'done' ? 'task-check is-done' : 'task-check'}>{task.status === 'done' ? '✓' : ''}</span><span className="task-copy"><strong className={task.status === 'done' ? 'is-complete' : ''}>{task.title}</strong><small>{task.category}</small></span><span className={`priority-badge ${task.priority}`}>{task.priority}</span></button>)}
        </div>
      </section>
    </section>
  )
}
