import { useMemo, useState } from 'react'
import type { Task, TaskPriority } from '../../types'

interface TasksViewProps {
  tasks: Task[]
  onAddTask: (title: string, priority: TaskPriority) => void
  onToggleTask: (id: number) => void
}

export function TasksView({ tasks, onAddTask, onToggleTask }: TasksViewProps) {
  const [query, setQuery] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const filtered = useMemo(() => tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase())), [tasks, query])

  const submit = () => {
    const title = window.prompt('Task title')?.trim()
    if (title) onAddTask(title, priority)
  }

  return (
    <section className="workspace page-enter">
      <div className="page-intro">
        <span className="section-kicker">MODULE</span>
        <h2>Tasks</h2>
        <p>Track work, priorities, and progress without adding unnecessary complexity.</p>
      </div>
      <div className="composer-row standalone-composer">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks" aria-label="Search tasks" />
        <select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)} aria-label="New task priority">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button className="primary-button" type="button" onClick={submit}>Add task</button>
      </div>
      <div className="content-card module-list">
        {filtered.map((task) => (
          <button className="task-row" key={task.id} type="button" onClick={() => onToggleTask(task.id)}>
            <span className={task.status === 'done' ? 'task-check is-done' : 'task-check'}>{task.status === 'done' ? '✓' : ''}</span>
            <span className="task-copy"><strong className={task.status === 'done' ? 'is-complete' : ''}>{task.title}</strong><small>{task.category}</small></span>
            <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
