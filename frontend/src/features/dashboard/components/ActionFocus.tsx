import type { CSSProperties } from 'react'
import type { FinanceEntry, Task, View } from '../../../types'
import type { ScheduleItem } from '../../schedule/schedule.types'
import { scheduleOccursOnDate } from '../../schedule/schedule.date'
import { MiDIcon, type MiDIconName } from '../../../components/ui/MiDIcon'

interface ActionFocusProps {
  onNavigate: (view: View) => void
  tasks: Task[]
  schedule: ScheduleItem[]
  finance: FinanceEntry[]
  now: Date
  timezone: string
}

interface ActionFocusState {
  status: string
  index: string
  label: string
  title: string
  detail: string
  action: string
  target: View
  icon: MiDIconName
  tone: 'cyan' | 'green' | 'amber' | 'rose'
}

const parseMinutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5))

function buildActionFocus(
  today: string,
  nowMinutes: number,
  tasks: Task[],
  schedule: ScheduleItem[],
  finance: FinanceEntry[],
): ActionFocusState {
  const todaySchedule = schedule
    .filter((item) => scheduleOccursOnDate(item, today))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const currentSchedule = todaySchedule.find((item) => {
    const start = parseMinutes(item.startTime)
    const end = parseMinutes(item.endTime)
    return nowMinutes >= start && nowMinutes < end
  })

  if (currentSchedule) {
    return {
      status: 'NOW',
      index: '002',
      label: 'SCHEDULE',
      title: 'Stay with what is happening now.',
      detail: currentSchedule.startTime + '–' + currentSchedule.endTime + ' · ' + currentSchedule.title,
      action: 'Open schedule',
      target: 'schedule',
      icon: 'clock',
      tone: 'cyan',
    }
  }

  const overdue = tasks
    .filter((task) => task.status !== 'done' && task.dueDate && task.dueDate < today)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))

  if (overdue.length) {
    return {
      status: 'ATTENTION',
      index: '003',
      label: 'TASKS',
      title: 'Close the oldest overdue loop first.',
      detail: overdue.length + ' overdue · ' + overdue[0].title,
      action: 'Open tasks',
      target: 'tasks',
      icon: 'check',
      tone: 'rose',
    }
  }

  const priorityToday = tasks
    .filter((task) => task.status !== 'done' && task.priority === 'high' && task.dueDate === today)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))[0]

  if (priorityToday) {
    return {
      status: 'FOCUS',
      index: '003',
      label: 'TASKS',
      title: 'Protect today’s priority.',
      detail: 'High priority · ' + priorityToday.title,
      action: 'Open tasks',
      target: 'tasks',
      icon: 'check',
      tone: 'green',
    }
  }

  const nextSchedule = todaySchedule.find((item) => parseMinutes(item.startTime) >= nowMinutes)
  if (nextSchedule && parseMinutes(nextSchedule.startTime) - nowMinutes <= 120) {
    return {
      status: 'NEXT',
      index: '002',
      label: 'SCHEDULE',
      title: 'Prepare for what is next.',
      detail: nextSchedule.startTime + ' · ' + nextSchedule.title,
      action: 'Open schedule',
      target: 'schedule',
      icon: 'clock',
      tone: 'cyan',
    }
  }

  const openTasks = tasks
    .filter((task) => task.status !== 'done')
    .sort((a, b) => {
      const priorityRank = { high: 0, medium: 1, low: 2 } as const
      const priorityDelta = priorityRank[a.priority] - priorityRank[b.priority]
      if (priorityDelta !== 0) return priorityDelta
      return (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31')
    })

  if (openTasks.length) {
    return {
      status: 'FOCUS',
      index: '003',
      label: 'TASKS',
      title: 'Move one useful task forward.',
      detail: openTasks.length + ' open · next up: ' + openTasks[0].title,
      action: 'Open tasks',
      target: 'tasks',
      icon: 'check',
      tone: 'green',
    }
  }

  const monthKey = today.slice(0, 7)
  const monthFinance = finance.filter((entry) => entry.date.startsWith(monthKey))
  const monthIncome = monthFinance.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0)
  const monthExpense = monthFinance.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0)

  if (monthIncome - monthExpense < 0) {
    return {
      status: 'REVIEW',
      index: '004',
      label: 'FINANCE',
      title: 'Give this month’s balance a quick review.',
      detail: 'Current month balance is below zero.',
      action: 'Open finance',
      target: 'finance',
      icon: 'wallet',
      tone: 'amber',
    }
  }

  return {
    status: 'READY',
    index: '002',
    label: 'SCHEDULE',
    title: 'Use the open space intentionally.',
    detail: 'Nothing urgent is pulling you elsewhere right now.',
    action: 'Open schedule',
    target: 'schedule',
    icon: 'clock',
    tone: 'cyan',
  }
}

export function ActionFocus({ onNavigate, tasks, schedule, finance, now, timezone }: ActionFocusProps) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const nowMinutes =
    Number(parts.find((part) => part.type === 'hour')?.value ?? 0) * 60 +
    Number(parts.find((part) => part.type === 'minute')?.value ?? 0)

  const focus = buildActionFocus(today, nowMinutes, tasks, schedule, finance)
  const accentStyle = { '--action-accent': 'var(--mi-' + focus.tone + ')' } as CSSProperties

  return (
    <section className="content-card action-focus" data-spatial-role="focus" style={accentStyle} aria-labelledby="action-focus-title">
      <div className="action-focus-main">
        <div className="action-focus-code" aria-hidden="true">
          <span>{focus.index}</span>
          <i>/</i>
          <strong>{focus.label}</strong>
          <em>LIVE PRIORITY</em>
        </div>
        <div className="action-focus-eyebrow">
          <span className="action-focus-dot" aria-hidden="true" />
          <span>Action Focus · {focus.status}</span>
        </div>
        <h3 id="action-focus-title">{focus.title}</h3>
        <p>{focus.detail}</p>
      </div>

      <div className="action-focus-side">
        <div className="action-focus-target">
          <span className="action-focus-icon" aria-hidden="true">
            <MiDIcon name={focus.icon} size={20} />
          </span>
          <div>
            <span>Recommended workspace</span>
            <strong>{focus.index} · {focus.label}</strong>
          </div>
        </div>
        <button className="primary-button action-focus-action" type="button" onClick={() => onNavigate(focus.target)}>
          {focus.action}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  )
}
