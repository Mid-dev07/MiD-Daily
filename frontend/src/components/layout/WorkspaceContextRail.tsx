import { useMemo } from 'react'
import { scheduleOccursOnDate } from '../../features/schedule/schedule.date'
import { APP_TIMEZONE } from '../../lib/dateTime'
import { currency } from '../../lib/format'
import type { FinanceEntry, Task, View } from '../../types'
import type { ScheduleItem } from '../../features/schedule/schedule.types'

interface WorkspaceContextRailProps {
  activeView: View
  tasks: Task[]
  finance: FinanceEntry[]
  schedule: ScheduleItem[]
  timezone?: string
  onNavigate: (view: View) => void
}

export function WorkspaceContextRail({
  activeView,
  tasks,
  finance,
  schedule,
  timezone = APP_TIMEZONE,
  onNavigate,
}: WorkspaceContextRailProps) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
  const currentTimeLabel = new Intl.DateTimeFormat('id-ID', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date())

  const nextSchedule = useMemo(() => {
    const now = new Date()
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now)
    const currentMinutes =
      Number(parts.find((part) => part.type === 'hour')?.value ?? 0) * 60
      + Number(parts.find((part) => part.type === 'minute')?.value ?? 0)

    return schedule
      .filter((item) => scheduleOccursOnDate(item, today))
      .filter((item) => {
        const start = Number(item.startTime.slice(0, 2)) * 60 + Number(item.startTime.slice(3, 5))
        return start >= currentMinutes
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0]
  }, [schedule, today, timezone])

  const openTaskCount = tasks.filter((task) => task.status !== 'done').length
  const monthBalance = finance
    .filter((entry) => entry.date.startsWith(today.slice(0, 7)))
    .reduce((balance, entry) => balance + (entry.type === 'income' ? entry.amount : -entry.amount), 0)

  return (
    <section className="workspace-context-rail" aria-label="Workspace context">
      <div className="workspace-context-lead">
        <span className="section-kicker">LIVE CONTEXT</span>
        <strong>{activeView === 'dashboard' ? 'Today' : 'Connected to Today'}</strong>
      </div>

      <button className="workspace-context-item" type="button" onClick={() => onNavigate('dashboard')}>
        <span>Now</span>
        <strong>{currentTimeLabel}</strong>
        <small>return to Today</small>
      </button>

      <button className="workspace-context-item" type="button" onClick={() => onNavigate('schedule')}>
        <span>Next up</span>
        <strong>{nextSchedule?.startTime ?? 'Open'}</strong>
        <small>{nextSchedule?.title ?? 'schedule is clear'}</small>
      </button>

      <button className="workspace-context-item" type="button" onClick={() => onNavigate('tasks')}>
        <span>Open tasks</span>
        <strong>{openTaskCount}</strong>
        <small>{openTaskCount === 1 ? 'task in your queue' : 'tasks in your queue'}</small>
      </button>

      <button className="workspace-context-item" type="button" onClick={() => onNavigate('finance')}>
        <span>Month balance</span>
        <strong className={monthBalance < 0 ? 'amount-negative' : 'amount-positive'}>{currency.format(monthBalance)}</strong>
        <small>recorded income − expense</small>
      </button>
    </section>
  )
}
