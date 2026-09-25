import { useMemo, useState } from 'react'
import { TaskDetail } from './components/TaskDetail'
import { WorkspaceHeader } from '../../components/ui/WorkspaceHeader'
import { TaskForm } from './components/TaskForm'
import type { Task, TaskDraft, TaskPriority, TaskStatus } from '../../types'

interface TasksViewProps {
  tasks: Task[]
  onSaveTask: (draft: TaskDraft, editingId?: number) => string | null | Promise<string | null>
  onToggleTask: (id: number) => void
  onDeleteTask: (id: number) => void
}

const statusOptions: Array<{ value: 'ALL' | TaskStatus; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'todo', label: 'To do' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
]

export function TasksView({ tasks, onSaveTask, onToggleTask, onDeleteTask }: TasksViewProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'ALL' | TaskStatus>('ALL')
  const [priority, setPriority] = useState<'ALL' | TaskPriority>('ALL')
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task>()
  const [detailTask, setDetailTask] = useState<Task>()

  const filtered = useMemo(() => tasks.filter((task) => {
    const queryValue = query.toLowerCase()
    const matchesQuery = task.title.toLowerCase().includes(queryValue) || task.category.toLowerCase().includes(queryValue)
    const matchesStatus = status === 'ALL' || task.status === status
    const matchesPriority = priority === 'ALL' || task.priority === priority
    return matchesQuery && matchesStatus && matchesPriority
  }), [tasks, query, status, priority])

  const openCreate = () => { setEditingTask(undefined); setFormOpen(true) }
  const openEdit = (task: Task) => { setDetailTask(undefined); setEditingTask(task); setFormOpen(true) }

  const remove = (id: number) => {
    const task = tasks.find((entry) => entry.id === id)
    if (!task || !window.confirm('Delete “' + task.title + '”?')) return
    onDeleteTask(id)
  }

  return (
    <section className="workspace page-enter">
      <WorkspaceHeader
        index="003"
        kicker="FOCUS"
        title="Tasks"
        description="Track work, deadlines, priority, and progress without adding unnecessary complexity."
        action={<button className="primary-button" type="button" onClick={openCreate}>+ Add task</button>}
      />

      <div className="task-toolbar workspace-toolbar-surface content-card">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or category" aria-label="Search tasks" />
        <div className="filter-row">
          {statusOptions.map((option) => <button key={option.value} className={status === option.value ? 'filter-button is-active' : 'filter-button'} type="button" onClick={() => setStatus(option.value)}>{option.label}</button>)}
        </div>
        <select value={priority} onChange={(event) => setPriority(event.target.value as 'ALL' | TaskPriority)} aria-label="Filter by priority">
          <option value="ALL">All priorities</option><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option>
        </select>
      </div>

      <div className="content-card module-list">
        {filtered.length === 0 ? (
          <div className="empty-state"><strong>No matching tasks</strong><span>Adjust the filters or create a new task.</span></div>
        ) : filtered.map((task) => {
          const progress = task.progress ?? (task.status === 'done' ? 100 : 0)
          const showProgress = typeof task.progress === 'number' || task.status === 'done'
          const statusLabel = task.status === 'in-progress' ? 'In progress' : task.status === 'done' ? 'Complete' : 'To do'
          return (
            <article className="task-item-card" key={task.id}>
              <button className="task-row" type="button" onClick={() => onToggleTask(task.id)}>
                <span className={task.status === 'done' ? 'task-check is-done' : 'task-check'}>{task.status === 'done' ? '✓' : ''}</span>
                <span className="task-copy"><strong className={task.status === 'done' ? 'is-complete' : ''}>{task.title}</strong><small>{task.category}{task.dueDate ? ' · due ' + task.dueDate : ''}</small></span>
                <span className={'priority-badge ' + task.priority}>{task.priority}</span>
              </button>
              <div className="task-item-footer">
                {showProgress ? (
                  <>
                    <div className="task-progress-track" aria-label={'Progress ' + progress + '%'}><span style={{ width: progress + '%' }} /></div>
                    <span className="task-progress-label">{progress}%</span>
                  </>
                ) : (
                  <span className="task-status-label">{statusLabel}</span>
                )}
                <details className="task-actions-menu">
                  <summary aria-label={'Manage ' + task.title}>•••</summary>
                  <div>
                    <button className="text-button" type="button" onClick={() => setDetailTask(task)}>Details</button>
                    <button className="text-button" type="button" onClick={() => openEdit(task)}>Edit</button>
                    <button className="text-button danger" type="button" onClick={() => remove(task.id)}>Delete</button>
                  </div>
                </details>
              </div>
            </article>
          )
        })}
      </div>

      <TaskForm open={formOpen} initialTask={editingTask} onClose={() => setFormOpen(false)} onSubmit={onSaveTask} />
      <TaskDetail task={detailTask} onClose={() => setDetailTask(undefined)} onEdit={openEdit} />
    </section>
  )
}
