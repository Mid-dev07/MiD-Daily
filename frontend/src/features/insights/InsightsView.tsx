import { useMemo } from 'react'
import { WorkspaceHeader } from '../../components/ui/WorkspaceHeader'
import type { FinanceEntry, Task } from '../../types'
import type { ScheduleItem } from '../schedule/schedule.types'
import { scheduleOccursOnDate, shiftDate } from '../schedule/schedule.date'
import { currency, formatDate } from '../../lib/format'

interface InsightsViewProps {
  tasks: Task[]
  schedule: ScheduleItem[]
  finance: FinanceEntry[]
  onNavigate: (view: 'tasks' | 'schedule' | 'finance' | 'assistant') => void
}

const APP_TIMEZONE = 'Asia/Jakarta'
const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: APP_TIMEZONE }).format(new Date())

function minutes(start: string, end: string) {
  if (!start || !end) return 0
  const toMinutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5))
  return Math.max(0, toMinutes(end) - toMinutes(start))
}

export function InsightsView({ tasks, schedule, finance, onNavigate }: InsightsViewProps) {
  const date = today()
  const endDate = shiftDate(date, 6)
  const financeStartDate = shiftDate(date, -6)
  const nextSevenDates = useMemo(() => Array.from({ length: 7 }, (_, index) => shiftDate(date, index)), [date])

  const openTasks = tasks.filter((task) => task.status !== 'done')
  const completedTasks = tasks.filter((task) => task.status === 'done')
  const overdueTasks = openTasks.filter((task) => task.dueDate && task.dueDate < date)
  const dueSoon = openTasks.filter((task) => task.dueDate && task.dueDate >= date && task.dueDate <= endDate)

  const nextWeekSchedule = useMemo(() => nextSevenDates.flatMap((targetDate) =>
    schedule
      .filter((item) => scheduleOccursOnDate(item, targetDate))
      .map((item) => ({ item, targetDate })),
  ), [nextSevenDates, schedule])

  const fixedMinutes = nextWeekSchedule.reduce((sum, entry) => sum + minutes(entry.item.startTime, entry.item.endTime), 0)
  const expenseWindow = finance.filter((entry) => entry.date >= financeStartDate && entry.date <= date)
  const windowExpense = expenseWindow.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0)
  const windowIncome = expenseWindow.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0)

  const topCategories = useMemo(() => {
    const totals = new Map<string, number>()
    for (const entry of expenseWindow) {
      if (entry.type !== 'expense') continue
      totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount)
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
  }, [expenseWindow])

  const reviewNotes = [
    overdueTasks.length
      ? overdueTasks.length + ' task' + (overdueTasks.length === 1 ? '' : 's') + ' are overdue.'
      : 'No overdue tasks right now.',
    dueSoon.length
      ? dueSoon.length + ' task' + (dueSoon.length === 1 ? '' : 's') + ' fall within the next 7 days.'
      : 'No upcoming task deadlines in the next 7 days.',
    nextWeekSchedule.length
      ? nextWeekSchedule.length + ' scheduled activit' + (nextWeekSchedule.length === 1 ? 'y' : 'ies') + ' are on the next-7-day calendar.'
      : 'The next 7 days are currently open.',
  ]

  return (
    <section className="workspace page-enter">
      <WorkspaceHeader
        index="008"
        kicker="PATTERNS"
        title="Weekly snapshot"
        description="See your current workload, upcoming schedule, and finance context without pretending we have history we do not store."
        action={<button className="primary-button" type="button" onClick={() => onNavigate('assistant')}>Review with Assistant</button>}
      />

      <section className="insights-metric-grid" aria-label="Weekly overview">
        <article className="content-card insights-metric"><span>Task completion</span><strong>{tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%</strong><small>{completedTasks.length} done · {openTasks.length} open</small></article>
        <article className="content-card insights-metric"><span>Focus load</span><strong>{Math.round(fixedMinutes / 60 * 10) / 10}h</strong><small>fixed schedule in next 7 days</small></article>
        <article className="content-card insights-metric"><span>Near deadlines</span><strong>{dueSoon.length}</strong><small>{overdueTasks.length} overdue right now</small></article>
        <article className="content-card insights-metric"><span>7-day net</span><strong className={windowExpense > windowIncome ? 'amount-negative' : 'amount-positive'}>{currency.format(windowIncome - windowExpense)}</strong><small>recorded income minus expenses</small></article>
      </section>

      <div className="insights-grid">
        <section className="content-card">
          <div className="card-heading">
            <div><span className="section-kicker">SIGNALS</span><h3>What deserves attention</h3></div>
            <button className="text-button" type="button" onClick={() => onNavigate('tasks')}>Open tasks</button>
          </div>
          <div className="review-note-list">
            {reviewNotes.map((note) => <div className="review-note" key={note}><span aria-hidden="true">•</span><p>{note}</p></div>)}
          </div>
        </section>

        <section className="content-card">
          <div className="card-heading">
            <div><span className="section-kicker">MONEY</span><h3>Recorded last 7 days</h3></div>
            <button className="text-button" type="button" onClick={() => onNavigate('finance')}>Open finance</button>
          </div>
          <div className="insights-finance-values">
            <div><span>Income</span><strong className="amount-positive">{currency.format(windowIncome)}</strong></div>
            <div><span>Expenses</span><strong className="amount-negative">{currency.format(windowExpense)}</strong></div>
          </div>
          <div className="insights-category-list">
            {topCategories.length ? topCategories.map(([category, amount]) => <div className="insights-category-row" key={category}><span>{category}</span><strong>{currency.format(amount)}</strong></div>) : <div className="empty-state"><strong>No expense data in the window.</strong><span>Recorded expenses will appear here.</span></div>}
          </div>
        </section>
      </div>

      <section className="content-card">
        <div className="card-heading">
          <div><span className="section-kicker">NEXT 7 DAYS</span><h3>Schedule load</h3></div>
          <button className="text-button" type="button" onClick={() => onNavigate('schedule')}>Open schedule</button>
        </div>
        <div className="insights-schedule-list">
          {nextWeekSchedule.length ? nextWeekSchedule.slice(0, 10).map(({ item, targetDate }) => (
            <button className="insights-schedule-row" key={item.id + '-' + targetDate} type="button" onClick={() => onNavigate('schedule')}>
              <span>{formatDate(targetDate)}</span>
              <strong>{item.startTime || 'Flexible'}</strong>
              <div><b>{item.title}</b><small>{item.type}{item.location ? ' · ' + item.location : ''}</small></div>
            </button>
          )) : <div className="empty-state"><strong>No fixed activities coming up.</strong><span>Your next 7 days are open right now.</span></div>}
        </div>
      </section>
    </section>
  )
}
