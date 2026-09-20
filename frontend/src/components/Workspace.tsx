import type { FinanceEntry, ScheduleItem, Task, View } from '../types'

interface WorkspaceProps {
  view: Exclude<View, 'dashboard'>
  tasks: Task[]
  schedule: ScheduleItem[]
  finance: FinanceEntry[]
  onToggleTask: (id: number) => void
}

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function Workspace({ view, tasks, schedule, finance, onToggleTask }: WorkspaceProps) {
  const titles = {
    schedule: ['Schedule', 'Manage activities beyond classes — work, study, personal, meetings, and events.'],
    tasks: ['Tasks', 'Track work, priorities, and progress without adding unnecessary complexity.'],
    finance: ['Finance', 'Keep income and expenses visible before connecting a real database.'],
  } as const

  return (
    <section className="workspace">
      <div className="page-intro">
        <span className="section-kicker">MODULE</span>
        <h2>{titles[view][0]}</h2>
        <p>{titles[view][1]}</p>
      </div>

      {view === 'schedule' && (
        <div className="content-card module-list">
          {schedule.map((item) => (
            <div className="module-row" key={item.id}>
              <div className="module-leading">
                <strong>{item.start} — {item.end}</strong>
                <span>{item.location}</span>
              </div>
              <div className="module-main">
                <strong>{item.title}</strong>
                <span>{item.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'tasks' && (
        <div className="content-card module-list">
          {tasks.map((task) => (
            <button className="module-row module-button" key={task.id} onClick={() => onToggleTask(task.id)} type="button">
              <span className={task.status === 'done' ? 'task-check is-done' : 'task-check'}>
                {task.status === 'done' ? '✓' : ''}
              </span>
              <div className="module-main">
                <strong className={task.status === 'done' ? 'is-complete' : ''}>{task.title}</strong>
                <span>{task.category} · {task.status}</span>
              </div>
              <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
            </button>
          ))}
        </div>
      )}

      {view === 'finance' && (
        <div className="finance-layout">
          <div className="stat-card">
            <span>Income</span>
            <strong>{currency.format(finance.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0))}</strong>
            <small>tracked locally</small>
          </div>
          <div className="stat-card">
            <span>Expense</span>
            <strong>{currency.format(finance.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0))}</strong>
            <small>tracked locally</small>
          </div>
          <div className="content-card module-list finance-list">
            {finance.map((entry) => (
              <div className="module-row" key={entry.id}>
                <div className="module-main">
                  <strong>{entry.title}</strong>
                  <span>{entry.type}</span>
                </div>
                <strong className={entry.type === 'income' ? 'amount-positive' : 'amount-negative'}>
                  {entry.type === 'income' ? '+' : '-'}{currency.format(entry.amount)}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
