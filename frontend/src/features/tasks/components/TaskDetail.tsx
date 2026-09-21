import { formatDate } from '../../../lib/format'
import { useModalBehavior } from '../../../lib/useModalBehavior'
import type { Task } from '../../../types'

interface TaskDetailProps {
  task?: Task
  onClose: () => void
  onEdit: (task: Task) => void
}

export function TaskDetail({ task, onClose, onEdit }: TaskDetailProps) {
  if (!task) return null
  useModalBehavior(Boolean(task), onClose)

  const progress = task.progress ?? (task.status === 'done' ? 100 : 0)
  const statusLabel = task.status === 'done' ? 'Done' : task.status === 'in-progress' ? 'In progress' : 'To do'

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card detail-card" role="dialog" aria-modal="true" aria-labelledby="task-detail-title">
        <div className="modal-header">
          <div><span className="section-kicker">TASK</span><h3 id="task-detail-title">{task.title}</h3></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close task details">×</button>
        </div>

        <div className="detail-grid">
          <div><span>Category</span><strong>{task.category}</strong></div>
          <div><span>Priority</span><strong>{task.priority}</strong></div>
          <div><span>Status</span><strong>{statusLabel}</strong></div>
          <div><span>Progress</span><strong>{progress}%</strong></div>
          <div><span>Due date</span><strong>{task.dueDate ? formatDate(task.dueDate) : 'No due date'}</strong></div>
        </div>

        {task.notes && <div className="detail-notes"><span>Notes</span><p>{task.notes}</p></div>}

        <div className="task-progress-track"><span style={{ width: `${progress}%` }} /></div>
        <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Close</button><button className="primary-button" type="button" onClick={() => { onClose(); onEdit(task) }}>Edit task</button></div>
      </section>
    </div>
  )
}
