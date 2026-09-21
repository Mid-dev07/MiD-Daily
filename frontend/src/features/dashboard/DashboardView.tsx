import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import type { FinanceEntry, Task, View } from '../../types'
import type { ScheduleItem } from '../schedule/schedule.types'
import { scheduleOccursOnDate } from '../schedule/schedule.date'
import { currency, formatDate } from '../../lib/format'

interface DashboardViewProps {
  tasks: Task[]
  schedule: ScheduleItem[]
  finance: FinanceEntry[]
  onToggleTask: (id: number) => void
  onNavigate: (view: View) => void
}

const getToday = () => new Intl.DateTimeFormat('sv-SE').format(new Date())

const TelegramIntegrationCard = lazy(() => import('./components/TelegramIntegrationCard').then((module) => ({ default: module.TelegramIntegrationCard })))
const WhatsAppIntegrationCard = lazy(() => import('./components/WhatsAppIntegrationCard').then((module) => ({ default: module.WhatsAppIntegrationCard })))

export function DashboardView({ tasks, schedule, finance, onToggleTask, onNavigate }: DashboardViewProps) {
  const [connectionsOpen, setConnectionsOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const today = getToday()

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const todaySchedule = useMemo(() => schedule
    .filter((item) => scheduleOccursOnDate(item, today))
    .sort((a, b) => a.startTime.localeCompare(b.startTime)), [schedule, today])

  const completed = tasks.filter((task) => task.status === 'done').length
  const openTasks = tasks.filter((task) => task.status !== 'done').length
  const expense = finance
    .filter((entry) => entry.type === 'expense' && entry.date === today)
    .reduce((sum, entry) => sum + entry.amount, 0)

  const focusTasks = useMemo(() => [...tasks]
    .filter((task) => task.status !== 'done')
    .sort((a, b) => {
      const priorityRank = { high: 0, medium: 1, low: 2 } as const
      const priorityDelta = priorityRank[a.priority] - priorityRank[b.priority]
      if (priorityDelta !== 0) return priorityDelta
      return (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31')
    })
    .slice(0, 5), [tasks])

  const overdueTasks = useMemo(() => [...tasks]
    .filter((task) => task.status !== 'done' && task.dueDate && task.dueDate < today)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 2), [tasks, today])

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const currentSchedule = todaySchedule.find((item) => {
    const start = Number(item.startTime.slice(0, 2)) * 60 + Number(item.startTime.slice(3, 5))
    const end = Number(item.endTime.slice(0, 2)) * 60 + Number(item.endTime.slice(3, 5))
    return currentMinutes >= start && currentMinutes < end
  })
  const nextSchedule = todaySchedule.find((item) => {
    const start = Number(item.startTime.slice(0, 2)) * 60 + Number(item.startTime.slice(3, 5))
    return start >= currentMinutes
  })
  const currentTimeLabel = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now)

  return (
    <section className="workspace dashboard-page page-enter">
      <div className="page-intro">
        <div>
          <h2>Today</h2>
          <p>{formatDate(today)} · your day at a glance.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate('schedule')}>Open schedule</button>
      </div>

      <div className="dashboard-overview">
        <section className="content-card dashboard-agenda">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Schedule</span>
              <h3>Today&apos;s agenda</h3>
            </div>
            <span className="card-meta">
              {nextSchedule ? `Next ${nextSchedule.startTime}` : 'No more today'}
            </span>
          </div>

          <div className="dashboard-context">
            <strong>{currentTimeLabel}</strong>
            <span>{currentSchedule ? currentSchedule.title : nextSchedule ? `Next: ${nextSchedule.title}` : 'Free time'}</span>
          </div>

          <div className="schedule-list">
            {todaySchedule.length === 0 ? (
              <div className="empty-state">
                <strong>Your schedule is clear.</strong>
                <span>Add an activity when you need one.</span>
              </div>
            ) : todaySchedule.slice(0, 6).map((item) => (
              <div className="schedule-item" key={item.id}>
                <div className="schedule-time"><strong>{item.startTime}</strong><span>{item.endTime}</span></div>
                <div className="timeline-dot" aria-hidden="true" />
                <div className="schedule-copy"><strong>{item.title}</strong><span>{item.type}{item.location ? ` · ${item.location}` : ''}</span></div>
              </div>
            ))}
          </div>

          {todaySchedule.length > 6 && (
            <button className="dashboard-section-link" type="button" onClick={() => onNavigate('schedule')}>
              View {todaySchedule.length - 6} more <span aria-hidden="true">→</span>
            </button>
          )}
        </section>

        <section className="content-card dashboard-focus">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Focus</span>
              <h3>Open tasks</h3>
            </div>
            <span className="card-meta">{openTasks} open</span>
          </div>

          <div className="task-list">
            {openTasks === 0 ? (
              <div className="empty-state">
                <strong>All tasks complete.</strong>
                <span>Your queue is clear.</span>
              </div>
            ) : focusTasks.map((task) => (
              <button className="task-row" key={task.id} type="button" onClick={() => onToggleTask(task.id)}>
                <span className="task-check" aria-hidden="true" />
                <span className="task-copy">
                  <strong>{task.title}</strong>
                  <small>{task.category}{task.dueDate ? ` · due ${task.dueDate}` : ''}</small>
                </span>
                <span className={'priority-badge ' + task.priority}>{task.priority}</span>
              </button>
            ))}
          </div>

          {openTasks > 5 && (
            <button className="dashboard-section-link" type="button" onClick={() => onNavigate('tasks')}>
              View all tasks <span aria-hidden="true">→</span>
            </button>
          )}
        </section>
      </div>

      <section className="content-card dashboard-finance">
        <div>
          <div className="card-heading">
            <div>
              <span className="section-kicker">Finance</span>
              <h3>Today&apos;s money</h3>
            </div>
            <span className="card-meta">{formatDate(today)}</span>
          </div>

          <div className="dashboard-finance-values">
            <div className="dashboard-finance-value">
              <span>Spent</span>
              <strong className="amount-negative">{currency.format(expense)}</strong>
              <small>expenses today</small>
            </div>
            <div className="dashboard-finance-value">
              <span>Tasks</span>
              <strong>{completed}/{tasks.length}</strong>
              <small>completed</small>
            </div>
            <div className="dashboard-finance-value">
              <span>Agenda</span>
              <strong>{todaySchedule.length}</strong>
              <small>activities</small>
            </div>
          </div>
        </div>

        <div className="dashboard-risk">
          <span>Attention</span>
          <strong>{overdueTasks.length ? `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}` : 'Nothing overdue'}</strong>
        </div>
      </section>

      <details className="dashboard-connections">
        <summary className="connections-toggle">
          <span><strong>Connections</strong></span>
          <span className="connections-toggle-icon" aria-hidden="true">+</span>
        </summary>
        <div className="dashboard-integration-grid">
          <Suspense fallback={<div className="content-card connection-loading">Opening connections…</div>}>
            <TelegramIntegrationCard />
            <WhatsAppIntegrationCard />
          </Suspense>
        </div>
      </details>
    </section>
  )
}
