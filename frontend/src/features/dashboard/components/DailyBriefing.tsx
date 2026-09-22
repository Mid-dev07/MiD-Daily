import { useMemo } from 'react'
import type { FinanceEntry, Task } from '../../../types'
import type { ScheduleItem } from '../../schedule/schedule.types'
import { scheduleOccursOnDate, shiftDate } from '../../schedule/schedule.date'
import { currency } from '../../../lib/format'

interface DailyBriefingProps {
  tasks: Task[]
  schedule: ScheduleItem[]
  finance: FinanceEntry[]
  onNavigate: (view: 'schedule' | 'tasks' | 'finance' | 'assistant') => void
}

const APP_TIMEZONE = 'Asia/Jakarta'
const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: APP_TIMEZONE }).format(new Date())

export function DailyBriefing({ tasks, schedule, finance, onNavigate }: DailyBriefingProps) {
  const date = today()
  const nextDate = shiftDate(date, 1)

  const openTasks = useMemo(() => tasks.filter((task) => task.status !== 'done'), [tasks])
  const overdue = useMemo(() => openTasks.filter((task) => task.dueDate && task.dueDate < date), [openTasks, date])
  const dueSoon = useMemo(() => openTasks
    .filter((task) => task.dueDate && task.dueDate >= date && task.dueDate <= shiftDate(date, 2))
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 3), [openTasks, date])

  const todaySchedule = useMemo(() => schedule
    .filter((item) => scheduleOccursOnDate(item, date))
    .sort((a, b) => a.startTime.localeCompare(b.startTime)), [schedule, date])

  const tomorrowSchedule = useMemo(() => schedule
    .filter((item) => scheduleOccursOnDate(item, nextDate))
    .sort((a, b) => a.startTime.localeCompare(b.startTime)), [schedule, nextDate])

  const todayExpense = useMemo(() => finance
    .filter((entry) => entry.type === 'expense' && entry.date === date)
    .reduce((sum, entry) => sum + entry.amount, 0), [finance, date])

  const lead = overdue.length
    ? overdue[0].title + ' needs attention.'
    : dueSoon.length
      ? dueSoon[0].title + ' is coming up next.'
      : todaySchedule.length
        ? todaySchedule[0].title + ' starts your agenda.'
        : 'Your day has room to breathe.'

  return (
    <section className="content-card daily-briefing-card">
      <div className="card-heading">
        <div>
          <span className="section-kicker">DAILY BRIEFING</span>
          <h3>{lead}</h3>
        </div>
        <button className="text-button" type="button" onClick={() => onNavigate('assistant')}>Open Assistant</button>
      </div>

      <div className="briefing-grid">
        <button type="button" className="briefing-item" onClick={() => onNavigate('tasks')}>
          <span>Attention</span>
          <strong>{overdue.length}</strong>
          <small>{overdue.length ? 'overdue task' + (overdue.length === 1 ? '' : 's') : 'nothing overdue'}</small>
        </button>
        <button type="button" className="briefing-item" onClick={() => onNavigate('schedule')}>
          <span>Today</span>
          <strong>{todaySchedule.length}</strong>
          <small>{todaySchedule.length ? 'scheduled activit' + (todaySchedule.length === 1 ? 'y' : 'ies') : 'open schedule'}</small>
        </button>
        <button type="button" className="briefing-item" onClick={() => onNavigate('tasks')}>
          <span>Next</span>
          <strong>{dueSoon.length}</strong>
          <small>{dueSoon.length ? dueSoon[0].dueDate : 'no near deadline'}</small>
        </button>
        <button type="button" className="briefing-item" onClick={() => onNavigate('finance')}>
          <span>Spent today</span>
          <strong>{currency.format(todayExpense)}</strong>
          <small>{tomorrowSchedule.length} planned tomorrow</small>
        </button>
      </div>
    </section>
  )
}
