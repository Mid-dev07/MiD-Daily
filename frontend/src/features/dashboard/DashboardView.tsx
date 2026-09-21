import { lazy, Suspense, useMemo, useState, type CSSProperties } from 'react'
import type { FinanceEntry, Task, View } from '../../types'
import type { ScheduleItem } from '../schedule/schedule.types'
import { scheduleOccursOnDate } from '../schedule/schedule.date'
import { currency, formatDate } from '../../lib/format'
import { StatCard } from '../../components/ui/StatCard'
import { FeatureLandscape } from './components/FeatureLandscape'

interface DashboardViewProps {
  tasks: Task[]
  schedule: ScheduleItem[]
  finance: FinanceEntry[]
  onToggleTask: (id: number) => void
  activeView: View
  onNavigate: (view: View) => void
}

const getToday = () => new Intl.DateTimeFormat('sv-SE').format(new Date())

const TelegramIntegrationCard = lazy(() => import('./components/TelegramIntegrationCard').then((module) => ({ default: module.TelegramIntegrationCard })))
const WhatsAppIntegrationCard = lazy(() => import('./components/WhatsAppIntegrationCard').then((module) => ({ default: module.WhatsAppIntegrationCard })))


export function DashboardView({ tasks, schedule, finance, onToggleTask, activeView, onNavigate }: DashboardViewProps) {
  const [connectionsOpen, setConnectionsOpen] = useState(false)
  const today = getToday()
  const todayScheduleCount = useMemo(() => schedule.filter((item) => scheduleOccursOnDate(item, today)).length, [schedule, today])
  const todaySchedule = useMemo(() => schedule
    .filter((item) => scheduleOccursOnDate(item, today))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 5), [schedule, today])
  const completed = tasks.filter((task) => task.status === 'done').length
  const expense = finance.filter((entry) => entry.type === 'expense' && entry.date === today).reduce((sum, entry) => sum + entry.amount, 0)
  const openTasks = tasks.filter((task) => task.status !== 'done').length
  const focusTasks = useMemo(() => [...tasks]
    .filter((task) => task.status !== 'done')
    .sort((a, b) => {
      const priorityRank = { high: 0, medium: 1, low: 2 } as const
      const priorityDelta = priorityRank[a.priority] - priorityRank[b.priority]
      if (priorityDelta !== 0) return priorityDelta
      return (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31')
    })
    .slice(0, 5), [tasks])
  const completionPercent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0

  return (
    <section className="dashboard-grid page-enter">
      <div className="welcome-card motion-card glass-panel">
        <div className="welcome-content">
          <div className="welcome-index"><span>01</span><i aria-hidden="true">/</i><strong>TODAY</strong></div>
          <span className="section-kicker">MI-D / DAILY SYSTEM</span>
          <h2><span>Keep your day</span> <em>in motion.</em></h2>
          <p>Your schedule, tasks, and finances update from the data you manage in MiD-Daily.</p>
          <div className="welcome-meta-line"><span>CALM · CLEAR · CONNECTED</span><span>LOCAL RHYTHM</span></div>
        </div>
        <div className="welcome-side">
          <div className="day-progress" style={{ '--day-progress': completionPercent + '%' } as CSSProperties} aria-label={completionPercent + '% of tasks completed'}>
            <div className="day-progress-copy"><strong>{completionPercent}%</strong><span>focus</span></div>
          </div>
          <div className="welcome-date"><strong>Today</strong><span>{formatDate(today)}</span></div>
        </div>
      </div>

      <div className="stat-row">
        <StatCard label="Schedule" value={String(todayScheduleCount)} hint="planned today" />
        <StatCard label="Tasks" value={`${completed}/${tasks.length}`} hint={`${openTasks} open`} />
        <StatCard label="Expense" value={currency.format(expense)} hint="spent today" />
      </div>

      <div className="dashboard-primary-grid">
        <section className="content-card schedule-card motion-card">
          <div className="card-heading"><div><span className="section-kicker">AGENDA</span><h3>Today&apos;s schedule</h3></div><span className="card-meta">{todaySchedule.length}{todayScheduleCount > 5 ? ' of ' + todayScheduleCount : ''} items</span></div>
          <div className="schedule-list">
            {todaySchedule.length === 0 ? <div className="empty-state"><strong>No activities planned</strong><span>Your Schedule is empty for today.</span></div> : todaySchedule.map((item) => (
              <div className="schedule-item" key={item.id}>
                <div className="schedule-time"><strong>{item.startTime}</strong><span>{item.endTime}</span></div>
                <div className="timeline-dot" />
                <div className="schedule-copy"><strong>{item.title}</strong><span>{item.type} · {item.location || 'No location'}</span></div>
              </div>
            ))}
          </div>
          {todayScheduleCount > 5 && (
            <button className="dashboard-section-link" type="button" onClick={() => onNavigate('schedule')}>
              View full schedule <span aria-hidden="true">→</span>
            </button>
          )}
        </section>

        <section className="content-card task-card motion-card">
          <div className="card-heading"><div><span className="section-kicker">FOCUS</span><h3>Task queue</h3></div><span className="card-meta">{openTasks} open</span></div>
          <div className="task-list">
            {openTasks === 0 ? <div className="empty-state"><strong>All tasks complete</strong><span>Your focus queue is clear for now.</span></div> : focusTasks.map((task) => (
              <button className="task-row" key={task.id} type="button" onClick={() => onToggleTask(task.id)}>
                <span className="task-check" aria-hidden="true" />
                <span className="task-copy"><strong>{task.title}</strong><small>{task.category}{task.dueDate ? ' · due ' + task.dueDate : ''}</small></span>
                <span className={'priority-badge ' + task.priority}>{task.priority}</span>
              </button>
            ))}
          </div>
          {openTasks > 5 && (
            <button className="dashboard-section-link" type="button" onClick={() => onNavigate('tasks')}>
              View all open tasks <span aria-hidden="true">→</span>
            </button>
          )}
        </section>
      </div>

      <FeatureLandscape activeView={activeView} onNavigate={onNavigate} />

      <section className="dashboard-connections">
        <button
          className="connections-toggle"
          type="button"
          aria-expanded={connectionsOpen}
          aria-controls="dashboard-connections-content"
          onClick={() => setConnectionsOpen((open) => !open)}
        >
          <span>
            <span className="section-kicker">CONNECTIONS</span>
            <strong>External channels</strong>
          </span>
          <span className="connections-toggle-icon" aria-hidden="true">{connectionsOpen ? '−' : '+'}</span>
        </button>

        {connectionsOpen && (
          <div id="dashboard-connections-content" className="dashboard-integration-grid">
            <Suspense fallback={<div className="content-card connection-loading">Opening connections…</div>}>
              <TelegramIntegrationCard />
              <WhatsAppIntegrationCard />
            </Suspense>
          </div>
        )}
      </section>
    </section>
  )
}
