import type { CSSProperties } from 'react'
import type { FinanceEntry, ScheduleItem, Task } from '../../types'
import { currency, dateFormatter, weekdayFormatter } from '../../lib/format'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatCard } from '../../components/ui/StatCard'

interface DashboardViewProps {
  tasks: Task[]
  schedule: ScheduleItem[]
  finance: FinanceEntry[]
  onToggleTask: (id: number) => void
}

export function DashboardView({ tasks, schedule, finance, onToggleTask }: DashboardViewProps) {
  const completed = tasks.filter((task) => task.status === 'done').length
  const expenses = finance
    .filter((entry) => entry.type === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0)
  const openTasks = tasks.filter((task) => task.status !== 'done').length

  return (
    <div className="dashboard-grid page-enter" key="dashboard">
      <section className="welcome-card motion-card">
        <div>
          <span className="section-kicker">TODAY</span>
          <h2>Keep your day in motion.</h2>
          <p>One place for your schedule, tasks, and money — starting simple.</p>
        </div>
        <div className="welcome-date">
          <strong>{weekdayFormatter.format(new Date())}</strong>
          <span>{dateFormatter.format(new Date())}</span>
        </div>
      </section>

      <div className="stat-row">
        <StatCard label="Schedule" value={`${schedule.length}`} helper="planned today" />
        <StatCard label="Tasks" value={`${completed}/${tasks.length}`} helper={`${openTasks} open`} />
        <StatCard label="Today expense" value={currency.format(expenses)} helper="tracked locally" />
      </div>

      <section className="content-card schedule-card motion-card">
        <div className="card-heading">
          <div>
            <span className="section-kicker">AGENDA</span>
            <h3>Today&apos;s schedule</h3>
          </div>
          <span className="card-meta">{schedule.length} items</span>
        </div>
        <div className="schedule-list">
          {schedule.length === 0 && <EmptyState title="Your agenda is clear" description="No activities are scheduled yet." />}
          {schedule.map((item, index) => (
            <div className="schedule-item list-reveal" style={{ '--item-index': index } as CSSProperties} key={item.id}>
              <div className="schedule-time"><strong>{item.start}</strong><span>{item.end}</span></div>
              <div className="timeline-dot" aria-hidden="true" />
              <div className="schedule-copy"><strong>{item.title}</strong><span>{item.type} · {item.location}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="content-card task-card motion-card">
        <div className="card-heading">
          <div>
            <span className="section-kicker">FOCUS</span>
            <h3>Task queue</h3>
          </div>
          <span className="card-meta">{openTasks} open</span>
        </div>
        <div className="task-list">
          {tasks.length === 0 && <EmptyState title="No tasks yet" description="Add your first task from the Tasks module." />}
          {tasks.map((task, index) => (
            <button
              className="task-row list-reveal"
              style={{ '--item-index': index } as CSSProperties}
              key={task.id}
              onClick={() => onToggleTask(task.id)}
              type="button"
            >
              <span className={task.status === 'done' ? 'task-check is-done' : 'task-check'} aria-hidden="true">
                {task.status === 'done' ? '✓' : ''}
              </span>
              <span className="task-copy">
                <strong className={task.status === 'done' ? 'is-complete' : ''}>{task.title}</strong>
                <small>{task.category}</small>
              </span>
              <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
