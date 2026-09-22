import { useEffect, useMemo, useRef, useState } from 'react'
import type { FinanceEntry, Task } from '../../types'
import type { ScheduleItem } from '../../features/schedule/schedule.types'
import { scheduleOccursOnDate } from '../../features/schedule/schedule.date'
import { readUserStorage, writeUserStorage } from '../../lib/userStorage'

interface NotificationCenterProps {
  userId?: string
  tasks: Task[]
  schedule: ScheduleItem[]
  finance: FinanceEntry[]
  onNavigate: (view: 'tasks' | 'schedule' | 'finance') => void
}

interface Notice {
  id: string
  kind: 'Task' | 'Schedule' | 'Finance'
  title: string
  detail: string
  view: 'tasks' | 'schedule' | 'finance'
}

const KEY = 'mid-daily.dismissed-notifications'
const APP_TIMEZONE = 'Asia/Jakarta'

function today() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: APP_TIMEZONE }).format(new Date())
}

function nowMinutes() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: APP_TIMEZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date())
  return Number(parts.find((part) => part.type === 'hour')?.value ?? 0) * 60 + Number(parts.find((part) => part.type === 'minute')?.value ?? 0)
}

export function NotificationCenter({ userId, tasks, schedule, finance, onNavigate }: NotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState<string[]>(() => readUserStorage(KEY, userId, []))
  const [clock, setClock] = useState(() => Date.now())
  const ref = useRef<HTMLDivElement>(null)
  const date = today()
  const current = nowMinutes()
  void clock

  useEffect(() => {
    setDismissed(readUserStorage(KEY, userId, []))
  }, [userId])

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', handleOutside)
    return () => window.removeEventListener('mousedown', handleOutside)
  }, [open])

  const notices = useMemo<Notice[]>(() => {
    const result: Notice[] = []
    tasks.filter((task) => task.status !== 'done' && task.dueDate && task.dueDate < date).slice(0, 5).forEach((task) => {
      result.push({ id: 'overdue-task-' + task.id + '-' + date, kind: 'Task', title: task.title, detail: 'Overdue task', view: 'tasks' })
    })
    tasks.filter((task) => task.status !== 'done' && task.dueDate === date).slice(0, 5).forEach((task) => {
      result.push({ id: 'today-task-' + task.id + '-' + date, kind: 'Task', title: task.title, detail: 'Due today', view: 'tasks' })
    })
    schedule.filter((item) => scheduleOccursOnDate(item, date) && item.startTime).forEach((item) => {
      const start = Number(item.startTime.slice(0, 2)) * 60 + Number(item.startTime.slice(3, 5))
      const delta = start - current
      if (delta >= 0 && delta <= 60) {
        result.push({ id: 'soon-schedule-' + item.id + '-' + date, kind: 'Schedule', title: item.title, detail: delta === 0 ? 'Starting now' : 'Starts in ' + delta + 'm', view: 'schedule' })
      }
    })
    const todayExpenses = finance.filter((entry) => entry.type === 'expense' && entry.date === date).reduce((sum, entry) => sum + entry.amount, 0)
    if (todayExpenses > 0) result.push({ id: 'today-expense-' + date, kind: 'Finance', title: 'Today’s spending', detail: 'Recorded expenses are ' + new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(todayExpenses), view: 'finance' })
    return result
  }, [current, date, finance, schedule, tasks])

  const active = notices.filter((notice) => !dismissed.includes(notice.id))
  const dismiss = (id: string) => {
    const next = [...new Set([...dismissed, id])].slice(-80)
    setDismissed(next)
    writeUserStorage(KEY, userId, next)
  }
  const clearAll = () => {
    const next = [...new Set([...dismissed, ...notices.map((notice) => notice.id)])].slice(-80)
    setDismissed(next)
    writeUserStorage(KEY, userId, next)
  }

  return (
    <div className="notification-center" ref={ref}>
      <button className="notification-trigger" type="button" aria-expanded={open} aria-controls="mid-notification-popover" aria-label={'Notifications' + (active.length ? ', ' + active.length + ' unread' : '')} onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true">◌</span>
        {active.length > 0 && <b>{Math.min(active.length, 9)}</b>}
      </button>
      {open && (
        <section className="notification-popover" id="mid-notification-popover" role="dialog" aria-label="Notification center">
          <div className="notification-header">
            <div><span className="section-kicker">INBOX</span><strong>Attention</strong></div>
            <button className="text-button" type="button" onClick={clearAll} disabled={active.length === 0}>Clear all</button>
          </div>
          <div className="notification-list" aria-live="polite">
            {active.length ? active.map((notice) => (
              <div className="notification-item" key={notice.id}>
                <button type="button" onClick={() => { onNavigate(notice.view); setOpen(false) }} className="notification-main">
                  <span className={'notification-kind ' + notice.kind.toLowerCase()}>{notice.kind}</span>
                  <span><strong>{notice.title}</strong><small>{notice.detail}</small></span>
                </button>
                <button className="notification-dismiss" type="button" aria-label={'Dismiss ' + notice.title} onClick={() => dismiss(notice.id)}>×</button>
              </div>
            )) : <div className="empty-state"><strong>You’re caught up.</strong><span>No active attention items.</span></div>}
          </div>
        </section>
      )}
    </div>
  )
}
