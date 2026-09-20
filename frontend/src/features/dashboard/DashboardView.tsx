import type { FinanceEntry, Task } from '../../types'
import type { ScheduleItem } from '../schedule/schedule.types'
import { currency, formatDate } from '../../lib/format'
import { StatCard } from '../../components/ui/StatCard'
import { TelegramIntegrationCard } from './components/TelegramIntegrationCard'
import { WhatsAppIntegrationCard } from './components/WhatsAppIntegrationCard'

interface DashboardViewProps { tasks: Task[]; schedule: ScheduleItem[]; finance: FinanceEntry[]; onToggleTask: (id: number) => void }
const getToday = () => new Intl.DateTimeFormat('sv-SE').format(new Date())

export function DashboardView({ tasks, schedule, finance, onToggleTask }: DashboardViewProps) {
  const today = getToday()
  const todaySchedule = schedule.filter((item) => item.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime))
  const completed = tasks.filter((task) => task.status === 'done').length
  const expense = finance.filter((entry) => entry.type === 'expense' && entry.date === today).reduce((sum, entry) => sum + entry.amount, 0)
  const openTasks = tasks.filter((task) => task.status !== 'done').length

  return (
    <section className="dashboard-grid page-enter">
      <div className="welcome-card motion-card">
        <div><span className="section-kicker">TODAY</span><h2>Keep your day in motion.</h2><p>Your schedule, tasks, and finances update from the data you manage in MiD-Daily.</p></div>
        <div className="welcome-date"><strong>Today</strong><span>{formatDate(today)}</span></div>
      </div>

      <div className="stat-row">
        <StatCard label="Schedule" value={String(todaySchedule.length)} hint="planned today" />
        <StatCard label="Tasks" value={`${completed}/${tasks.length}`} hint={`${openTasks} open`} />
        <StatCard label="Expense" value={currency.format(expense)} hint="spent today" />
      </div>

      <section className="content-card schedule-card motion-card">
        <div className="card-heading"><div><span className="section-kicker">AGENDA</span><h3>Today&apos;s schedule</h3></div><span className="card-meta">{todaySchedule.length} items</span></div>
        <div className="schedule-list">
          {todaySchedule.length === 0 ? <div className="empty-state"><strong>No activities planned</strong><span>Your Schedule is empty for today.</span></div> : todaySchedule.map((item) => <div className="schedule-item" key={item.id}><div className="schedule-time"><strong>{item.startTime}</strong><span>{item.endTime}</span></div><div className="timeline-dot" /><div className="schedule-copy"><strong>{item.title}</strong><span>{item.type} · {item.location || 'No location'}</span></div></div>)}
        </div>
      </section>

      <TelegramIntegrationCard />
      <WhatsAppIntegrationCard />

      <section className="content-card task-card motion-card">
        <div className="card-heading"><div><span className="section-kicker">FOCUS</span><h3>Task queue</h3></div><span className="card-meta">{openTasks} open</span></div>
        <div className="task-list">
          {tasks.length === 0 ? <div className="empty-state"><strong>No tasks yet</strong><span>Add a task to start your focus queue.</span></div> : tasks.map((task) => <button className="task-row" key={task.id} type="button" onClick={() => onToggleTask(task.id)}><span className={task.status === 'done' ? 'task-check is-done' : 'task-check'}>{task.status === 'done' ? '✓' : ''}</span><span className="task-copy"><strong className={task.status === 'done' ? 'is-complete' : ''}>{task.title}</strong><small>{task.category}</small></span><span className={'priority-badge ' + task.priority}>{task.priority}</span></button>)}
        </div>
      </section>
    </section>
  )
}