import { useMemo, type CSSProperties } from 'react'
import type { FinanceEntry, Task, View } from '../../../types'
import type { ScheduleItem } from '../../schedule/schedule.types'
import { scheduleOccursOnDate } from '../../schedule/schedule.date'
import { MiDIcon, type MiDIconName } from '../../../components/ui/MiDIcon'

interface FeatureLandscapeProps {
  activeView: View
  onNavigate: (view: View) => void
  tasks: Task[]
  schedule: ScheduleItem[]
  finance: FinanceEntry[]
  now: Date
  timezone: string
}

type CompassPosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

interface WorkspaceFeature {
  id: View
  index: string
  label: string
  meta: string
  icon: MiDIconName
  position?: CompassPosition
}

const features: WorkspaceFeature[] = [
  { id: 'dashboard', index: '001', label: 'Today', meta: 'orientation & daily signals', icon: 'home' },
  { id: 'schedule', index: '002', label: 'Schedule', meta: 'time, rhythm & commitments', icon: 'clock', position: 'n' },
  { id: 'insights', index: '008', label: 'Insights', meta: 'patterns & signals', icon: 'chart', position: 'ne' },
  { id: 'tasks', index: '003', label: 'Tasks', meta: 'focus, progress & priorities', icon: 'check', position: 'e' },
  { id: 'habits', index: '009', label: 'Habits', meta: 'rhythm & consistency', icon: 'habit', position: 'se' },
  { id: 'finance', index: '004', label: 'Finance', meta: 'spending & resources', icon: 'wallet', position: 's' },
  { id: 'social', index: '005', label: 'Social', meta: 'digital pulse & signals', icon: 'pulse', position: 'sw' },
  { id: 'assistant', index: '006', label: 'Assistant', meta: 'guided next actions', icon: 'spark', position: 'w' },
  { id: 'profile', index: '007', label: 'Profile', meta: 'identity & preferences', icon: 'user', position: 'nw' },
]

const compassFeatures = features.filter((feature) => feature.position)

type CompassTarget = 'dashboard' | 'schedule' | 'tasks' | 'finance'

interface CompassState {
  target: CompassTarget
  index: string
  label: string
  status: string
  title: string
  detail: string
  action: string
  angle: number
}

const parseMinutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5))

function buildCompassState(today: string, nowMinutes: number, tasks: Task[], schedule: ScheduleItem[], finance: FinanceEntry[]): CompassState {
  const todaySchedule = schedule
    .filter((item) => scheduleOccursOnDate(item, today))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const currentSchedule = todaySchedule.find((item) => {
    const start = parseMinutes(item.startTime)
    const end = parseMinutes(item.endTime)
    return nowMinutes >= start && nowMinutes < end
  })

  if (currentSchedule) return {
    target: 'schedule', index: '002', label: 'Schedule', status: 'NOW',
    title: 'Stay with what is happening now.',
    detail: currentSchedule.startTime + '–' + currentSchedule.endTime + ' · ' + currentSchedule.title,
    action: 'Open schedule', angle: 0,
  }

  const overdue = tasks
    .filter((task) => task.status !== 'done' && task.dueDate && task.dueDate < today)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
  if (overdue.length) return {
    target: 'tasks', index: '003', label: 'Tasks', status: 'ATTENTION',
    title: 'Clear the oldest open loop first.',
    detail: overdue.length + ' overdue · ' + overdue[0].title,
    action: 'Open tasks', angle: 90,
  }

  const priorityToday = tasks.find((task) => task.status !== 'done' && task.priority === 'high' && task.dueDate === today)
  if (priorityToday) return {
    target: 'tasks', index: '003', label: 'Tasks', status: 'FOCUS',
    title: 'Protect today’s priority.',
    detail: 'High priority · ' + priorityToday.title,
    action: 'Open tasks', angle: 90,
  }

  const nextSchedule = todaySchedule.find((item) => parseMinutes(item.startTime) >= nowMinutes)
  if (nextSchedule && parseMinutes(nextSchedule.startTime) - nowMinutes <= 120) return {
    target: 'schedule', index: '002', label: 'Schedule', status: 'NEXT',
    title: 'Prepare for what is next.',
    detail: nextSchedule.startTime + ' · ' + nextSchedule.title,
    action: 'Open schedule', angle: 0,
  }

  const openTasks = tasks.filter((task) => task.status !== 'done').length
  if (openTasks) return {
    target: 'tasks', index: '003', label: 'Tasks', status: 'NEXT',
    title: 'Choose one useful next step.',
    detail: openTasks + ' open task' + (openTasks === 1 ? '' : 's') + ' · keep the queue moving',
    action: 'Open tasks', angle: 90,
  }

  const monthKey = today.slice(0, 7)
  const monthFinance = finance.filter((entry) => entry.date.startsWith(monthKey))
  const monthIncome = monthFinance.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0)
  const monthExpense = monthFinance.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0)
  if (monthIncome - monthExpense < 0) return {
    target: 'finance', index: '004', label: 'Finance', status: 'REVIEW',
    title: 'Your month needs a financial check.',
    detail: 'Current month balance is below zero.',
    action: 'Open finance', angle: 180,
  }

  return {
    target: 'dashboard', index: '001', label: 'Today', status: 'READY',
    title: 'Your day has room to move.',
    detail: 'No urgent signal is pulling you elsewhere.',
    action: 'Stay on Today', angle: 0,
  }
}

export function FeatureLandscape({ activeView, onNavigate, tasks, schedule, finance, now, timezone }: FeatureLandscapeProps) {
  const activeFeature = features.find((feature) => feature.id === activeView) ?? features[0]
  const activeIsToday = activeView === 'dashboard'
  const compass = useMemo(() => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now)
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now)
    const nowMinutes = Number(parts.find((part) => part.type === 'hour')?.value ?? 0) * 60 + Number(parts.find((part) => part.type === 'minute')?.value ?? 0)
    return buildCompassState(today, nowMinutes, tasks, schedule, finance)
  }, [finance, now, schedule, tasks, timezone])
  const compassStyle = { '--compass-angle': compass.angle + 'deg' } as CSSProperties

  return (
    <section className="feature-landscape" aria-labelledby="feature-landscape-title">
      <div className="feature-landscape-heading">
        <div>
          <div className="feature-level" aria-hidden="true">
            <span>FIELD GUIDE 001</span>
            <i>/</i>
            <strong>MID DAILY</strong>
          </div>
          <span className="section-kicker">DAILY COMPASS · WORKSPACE COMPASS · {compass.status}</span>
          <h3 id="feature-landscape-title">Everything has a place.</h3>
          <p>
            The center is Today. The needle reads your live day and points toward the workspace that matters next.
          </p>
        </div>
        <span className="feature-landscape-hint">{compass.action}</span>
      </div>

      <div className="feature-compass-status" aria-live="polite">
        <span className="feature-compass-status-label">{compass.status}</span>
        <strong>{compass.index} · {compass.label}</strong>
        <span>{compass.detail}</span>
      </div>

      <div className="feature-scene" aria-label={`Workspace compass. Current workspace: ${activeFeature.label}`}>
        <div className="feature-compass-orbit feature-compass-orbit-a" aria-hidden="true" />
        <div className="feature-compass-orbit feature-compass-orbit-b" aria-hidden="true" />
        <div className="feature-compass-crosshair feature-compass-crosshair-x" aria-hidden="true" />
        <div className="feature-compass-crosshair feature-compass-crosshair-y" aria-hidden="true" />

        {compassFeatures.map((feature) => {
          const active = activeView === feature.id
          const target = compass.target === feature.id
          return (
            <button
              key={feature.id}
              type="button"
              className={active ? `feature-node feature-node--${feature.position} is-active` : `feature-node feature-node--${feature.position}`}
              data-feature={feature.id}
              data-compass-target={target ? 'true' : undefined}
              aria-current={active ? 'page' : undefined}
              aria-label={target ? compass.action + ': ' + feature.label : 'Open ' + feature.label + ' workspace'}
              onClick={() => onNavigate(feature.id)}
            >
              <span className="feature-node-label">
                <span className="feature-node-icon"><MiDIcon name={feature.icon} size={20} /></span>
                <span className="feature-node-title">{feature.label}</span>
                <span className="feature-node-index">{feature.index}</span>
              </span>
              <span className="feature-node-meta">{feature.meta}</span>
              <span className="feature-node-status">{target ? compass.status : active ? 'HERE' : 'OPEN'}</span>
            </button>
          )
        })}

        <button
          className={compass.target === 'dashboard' ? 'feature-core is-active' : 'feature-core'}
          type="button"
          style={compassStyle}
          onClick={() => onNavigate(compass.target)}
          aria-label={compass.action + ': ' + compass.title + '. Return to Today from the center.'}
          aria-current={activeIsToday && compass.target === 'dashboard' ? 'page' : undefined}
        >
          <span className="feature-core-needle" aria-hidden="true" />
          <span className="feature-core-label">
            <strong>{compass.target === 'dashboard' ? 'M' : compass.index}</strong>
            <span>{compass.target === 'dashboard' ? '001 · Today' : compass.label}</span>
            <small>{compass.title}</small>
          </span>
        </button>

        <div className="feature-scene-caption" aria-hidden="true">
          <span className="scene-caption-line" />
          <span>{compass.target === 'dashboard' ? 'CENTER' : 'DIRECTION'}</span>
          <strong>{compass.status} · {compass.label}</strong>
        </div>
      </div>

      <nav className="feature-directory" aria-label="All MiD Daily workspaces">
        {features.map((feature) => {
          const active = activeView === feature.id
          return (
            <button
              key={feature.id}
              type="button"
              className={active ? 'feature-directory-item is-active' : 'feature-directory-item'}
              aria-current={active ? 'page' : undefined}
              onClick={() => onNavigate(feature.id)}
            >
              <span className="feature-directory-index">{feature.index}</span>
              <span className="feature-directory-copy">
                <strong>{feature.label}</strong>
                <small>{feature.meta}</small>
              </span>
              <span className="feature-directory-mark" aria-hidden="true">↗</span>
            </button>
          )
        })}
      </nav>
    </section>
  )
}
