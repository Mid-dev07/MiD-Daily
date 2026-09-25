import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import type { FinanceEntry, Task, View } from '../../types'
import type { ScheduleItem } from '../schedule/schedule.types'
import { scheduleOccursOnDate, shiftDate } from '../schedule/schedule.date'
import { currency, formatDate } from '../../lib/format'
import { FeatureLandscape } from './components/FeatureLandscape'

interface DashboardViewProps {
  tasks: Task[]
  schedule: ScheduleItem[]
  finance: FinanceEntry[]
  onToggleTask: (id: number) => void
  onNavigate: (view: View) => void
  timezone?: string
}

const LOCAL_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

const QuickCapture = lazy(() => import('./components/QuickCapture').then((module) => ({ default: module.QuickCapture })))
const FocusMode = lazy(() => import('./components/FocusMode').then((module) => ({ default: module.FocusMode })))

export function DashboardView({ tasks, schedule, finance, onToggleTask, onNavigate, timezone = LOCAL_TIMEZONE }: DashboardViewProps) {
  const [now, setNow] = useState(() => new Date())
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const todaySchedule = useMemo(() => schedule
    .filter((item) => scheduleOccursOnDate(item, today))
    .sort((a, b) => a.startTime.localeCompare(b.startTime)), [schedule, today])

  const completed = tasks.filter((task) => task.status === 'done').length
  const openTasks = tasks.filter((task) => task.status !== 'done').length
  const completionPercent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0

  const todayExpense = finance
    .filter((entry) => entry.type === 'expense' && entry.date === today)
    .reduce((sum, entry) => sum + entry.amount, 0)

  const monthKey = today.slice(0, 7)
  const monthFinance = useMemo(() => finance.filter((entry) => entry.date.startsWith(monthKey)), [finance, monthKey])
  const monthIncome = monthFinance.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0)
  const monthExpense = monthFinance.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0)
  const monthBalance = monthIncome - monthExpense

  const focusTasks = useMemo(() => [...tasks]
    .filter((task) => task.status !== 'done')
    .sort((a, b) => {
      const priorityRank = { high: 0, medium: 1, low: 2 } as const
      const priorityDelta = priorityRank[a.priority] - priorityRank[b.priority]
      if (priorityDelta !== 0) return priorityDelta
      return (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31')
    })
    .slice(0, 4), [tasks])

  const overdueTasks = useMemo(() => [...tasks]
    .filter((task) => task.status !== 'done' && task.dueDate && task.dueDate < today)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 3), [tasks, today])

  const nowParts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now)
  const currentMinutes = Number(nowParts.find((part) => part.type === 'hour')?.value ?? 0) * 60 + Number(nowParts.find((part) => part.type === 'minute')?.value ?? 0)
  const currentSchedule = todaySchedule.find((item) => {
    const start = Number(item.startTime.slice(0, 2)) * 60 + Number(item.startTime.slice(3, 5))
    const end = Number(item.endTime.slice(0, 2)) * 60 + Number(item.endTime.slice(3, 5))
    return currentMinutes >= start && currentMinutes < end
  })

  const nextSchedule = todaySchedule.find((item) => {
    const start = Number(item.startTime.slice(0, 2)) * 60 + Number(item.startTime.slice(3, 5))
    return start >= currentMinutes
  })

  const upcomingSchedule = useMemo(() => {
    const results: Array<{ item: ScheduleItem; date: string }> = []
    for (let days = 1; days <= 3 && results.length < 4; days += 1) {
      const date = shiftDate(today, days)
      schedule
        .filter((item) => scheduleOccursOnDate(item, date))
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .slice(0, 4 - results.length)
        .forEach((item) => results.push({ item, date }))
    }
    return results
  }, [schedule, today])

  const flexiblePlans = useMemo(() => schedule
    .filter((item) => item.activityMode === 'FLEXIBLE')
    .sort((a, b) => (a.activityDeadline ?? '9999-12-31').localeCompare(b.activityDeadline ?? '9999-12-31'))
    .slice(0, 3), [schedule])

  const upcomingDateLabel = new Intl.DateTimeFormat('id-ID', {
    timeZone: timezone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  const currentTimeLabel = new Intl.DateTimeFormat('id-ID', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now)

  return (
    <section className="workspace dashboard-page page-enter">
      <section className="dashboard-command-deck" aria-label="Today command deck">
        <div className="dashboard-hero-grid">
          <div className="page-intro">
            <div>
              <span className="section-kicker">YOUR DAY · {currentTimeLabel}</span>
              <h2>Today</h2>
              <p>{formatDate(today)} · see what matters now, then decide what comes next.</p>
            </div>
            <div className="dashboard-hero-actions">
              <button className="primary-button" type="button" onClick={() => onNavigate('tasks')}>Focus on a task</button>
              <button className="secondary-button" type="button" onClick={() => onNavigate('schedule')}>View schedule</button>
            </div>
          </div>

          <div className="dashboard-hero-aside">
            <span className="dashboard-live"><i aria-hidden="true" /> YOUR DAY, LIVE</span>
            <strong>{currentSchedule ? 'In progress' : nextSchedule ? 'Next up' : 'Open space'}</strong>
            <small>{currentSchedule ? 'You are here now.' : nextSchedule ? 'This is the next thing already on your path.' : 'There is no active block right now.'}</small>
          </div>
        </div>

      <section className="dashboard-signal-grid" aria-label="Daily overview">
        <article className="dashboard-signal-card">
          <span>Now</span>
          <strong>{currentTimeLabel}</strong>
          <small>{currentSchedule ? currentSchedule.title : nextSchedule ? `Next: ${nextSchedule.title}` : 'Free time'}</small>
        </article>

        <article className="dashboard-signal-card">
          <span>Tasks</span>
          <strong>{completed}/{tasks.length}</strong>
          <div className="dashboard-signal-progress" aria-label={completionPercent + '% of tasks completed'}>
            <span style={{ width: completionPercent + '%' }} />
          </div>
          <small>{openTasks} open · {completionPercent}% complete</small>
        </article>

        <article className={overdueTasks.length ? 'dashboard-signal-card is-alert' : 'dashboard-signal-card'}>
          <span>Attention</span>
          <strong>{overdueTasks.length}</strong>
          <small>{overdueTasks.length ? 'overdue task' + (overdueTasks.length === 1 ? '' : 's') : 'nothing overdue'}</small>
        </article>

        <article className="dashboard-signal-card">
          <span>Money</span>
          <strong className={monthBalance < 0 ? 'amount-negative' : 'amount-positive'}>{currency.format(monthBalance)}</strong>
          <small>month balance · {currency.format(todayExpense)} spent today</small>
        </article>
      </section>
      </section>

      <div className="dashboard-overview">
        <section className="content-card dashboard-agenda">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Today</span>
              <h3>Agenda</h3>
            </div>
            <span className="card-meta">{todaySchedule.length} {todaySchedule.length === 1 ? 'activity' : 'activities'}</span>
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

      <Suspense fallback={<section className="content-card connection-loading">Preparing quick capture…</section>}>
        <QuickCapture />
      </Suspense>

      <FeatureLandscape activeView="dashboard" onNavigate={onNavigate} />

      <details className="dashboard-secondary-details">
        <summary><span>More context</span><small>Upcoming, flexible plans, and attention details</small><b>+</b></summary>
        <div className="dashboard-context-grid dashboard-secondary-grid">
        {flexiblePlans.length > 0 && (
          <section className="content-card dashboard-flexible">
            <div className="card-heading">
              <div>
                <span className="section-kicker">Adaptive</span>
                <h3>Flexible plans</h3>
              </div>
              <span className="card-meta">{flexiblePlans.length} active</span>
            </div>
            <div className="dashboard-flexible-list">
              {flexiblePlans.map((item) => (
                <button className="dashboard-flexible-item" key={item.id} type="button" onClick={() => onNavigate('schedule')}>
                  <span>{item.durationMinutes} min</span>
                  <div><strong>{item.title}</strong><small>{item.targetCount}× / {item.targetPeriod?.toLowerCase()}{item.activityDeadline ? ' · due ' + item.activityDeadline : ''}</small></div>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="content-card dashboard-upcoming dashboard-secondary-upcoming">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Next</span>
              <h3>Upcoming</h3>
            </div>
            <span className="card-meta">next 3 days</span>
          </div>

          {upcomingSchedule.length === 0 ? (
            <div className="empty-state">
              <strong>No upcoming activities.</strong>
              <span>Your next few days are open.</span>
            </div>
          ) : (
            <div className="upcoming-list">
              {upcomingSchedule.map(({ item, date }) => (
                <button className="upcoming-item" key={item.id + '-' + date} type="button" onClick={() => onNavigate('schedule')}>
                  <span>{upcomingDateLabel.format(new Date(date + 'T12:00:00'))}</span>
                  <strong>{item.startTime}</strong>
                  <div><b>{item.title}</b><small>{item.type}{item.location ? ` · ${item.location}` : ''}</small></div>
                </button>
              ))}
            </div>
          )}
        </section>
        {overdueTasks.length > 0 && (
          <section className="content-card dashboard-attention">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Attention</span>
              <h3>Overdue tasks</h3>
            </div>
            <span className="card-meta">{overdueTasks.length} shown</span>
          </div>
          <div className="attention-list">
            {overdueTasks.map((task) => (
              <button className="attention-item" key={task.id} type="button" onClick={() => onNavigate('tasks')}>
                <strong>{task.title}</strong>
                <span>{task.category} · due {task.dueDate}</span>
              </button>
            ))}
          </div>
          </section>
        )}
        </div>
      </details>

      <details className="dashboard-focus-disclosure">
        <summary><span>Focus mode</span><small>25-minute session on one task</small><b>+</b></summary>
        <Suspense fallback={null}>
          <FocusMode tasks={tasks} onToggleTask={onToggleTask} />
        </Suspense>
      </details>
    </section>
  )
}
