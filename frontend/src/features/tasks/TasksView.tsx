import { useMemo, useState } from 'react'
import type { Task, TaskPriority } from '../../types'

interface TasksViewProps {
  tasks: Task[]
  onAddTask: (title: string, priority: TaskPriority) => void
  onToggleTask: (id: number) => void
}

export function TasksView({ tasks, onAddTask, onToggleTask }: TasksViewProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all')

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    if (filter === 'open') return task.status !== 'done'
    if (filter === 'done') return task.status === 'done'
    return true
  }), [filter, tasks])

  const submit = () => {
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    onAddTask(cleanTitle, priority)
    setTitle('')
    setPriority('medium')
  }

  return (
    <section className="workspace">
      <div className="page-intro">
        <span className="section-kicker">MODULE</span>
        <h2>Tasks</h2>
        <p>Capture work, priorities, and progress without unnecessary complexity.</p>
      </div>

      <div className="content-card composer-card">
        <div className="composer-row">
          <input value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} placeholder="Add a task…" aria-label="Task title" />
          <select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)} aria-label="Task priority">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
          <button type="button" className="primary-button" onClick={submit}>Add task</button>
        </div>
      </div>

      <div className="filter-row" role="group" aria-label="Task filter">
        {(['all', 'open', 'done'] as const).map((value) => (
          <button key={value} type="button" className={filter === value ? 'filter-button is-active' : 'filter-button'} onClick={() => setFilter(value)}>
            {value === 'all' ? 'All' : value === 'open' ? 'Open' : 'Completed'}
          </button>
        ))}
      </div>

      <div className="content-card module-list">
        {visibleTasks.length === 0 && <p className="empty-state">Nothing here yet.</p>}
        {visibleTasks.map((task) => (
          <button className="module-row module-button" key={task.id} onClick={() => onToggleTask(task.id)} type="button">
            <span className={task.status === 'done' ? 'task-check is-done' : 'task-check'} aria-hidden="true">{task.status === 'done' ? '✓' : ''}</span>
            <div className="module-main"><strong className={task.status === 'done' ? 'is-complete' : ''}>{task.title}</strong><span>{task.category} · {task.status}</span></div>
            <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
