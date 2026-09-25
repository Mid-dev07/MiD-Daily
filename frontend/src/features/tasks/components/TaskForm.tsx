import { useEffect, useState, type FormEvent } from 'react'
import { useModalBehavior } from '../../../lib/useModalBehavior'
import type { TaskDraft, Task, TaskPriority, TaskStatus } from '../../../types'

interface TaskFormProps {
  open: boolean
  initialTask?: Task
  onClose: () => void
  onSubmit: (draft: TaskDraft, editingId?: number) => string | null | Promise<string | null>
}

const emptyDraft: TaskDraft = {
  title: '',
  category: 'Personal',
  priority: 'medium',
  status: 'todo',
  dueDate: '',
  notes: '',
  progress: 0,
}

export function TaskForm({ open, initialTask, onClose, onSubmit }: TaskFormProps) {
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const dialogRef = useModalBehavior(open, onClose, saving)

  useEffect(() => {
    if (!open) return
    setDraft(initialTask ? {
      title: initialTask.title,
      category: initialTask.category,
      priority: initialTask.priority,
      status: initialTask.status,
      dueDate: initialTask.dueDate ?? '',
      notes: initialTask.notes ?? '',
      progress: initialTask.progress ?? (initialTask.status === 'done' ? 100 : 0),
    } : emptyDraft)
    setError('')
    setSaving(false)
  }, [open, initialTask])

  if (!open) return null

  const setField = <K extends keyof TaskDraft>(field: K, value: TaskDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setError('')
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const result = await onSubmit(draft, initialTask?.id)
      if (result) {
        setError(result)
        return
      }
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save task.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
      <section ref={dialogRef} className="modal-card" role="dialog" aria-modal="true" aria-labelledby="task-form-title">
        <div className="modal-header">
          <div><span className="section-kicker">TASK</span><h3 id="task-form-title">{initialTask ? 'Edit task' : 'Add task'}</h3></div>
          <button className="icon-button" type="button" disabled={saving} onClick={onClose} aria-label="Close task form">×</button>
        </div>

        <form className="schedule-form" aria-busy={saving} data-form-state={saving ? 'saving' : error ? 'error' : 'ready'} onSubmit={submit}>
          <label>Title<input disabled={saving} value={draft.title} onChange={(event) => setField('title', event.target.value)} placeholder="e.g. Finish API documentation" autoFocus maxLength={200} /></label>

          <div className="form-grid two">
            <label>Category<input disabled={saving} value={draft.category} maxLength={100} onChange={(event) => setField('category', event.target.value)} /></label>
            <label>Due date<input disabled={saving} type="date" value={draft.dueDate ?? ''} onChange={(event) => setField('dueDate', event.target.value)} /></label>
          </div>

          <div className="form-grid two">
            <label>Priority<select disabled={saving} value={draft.priority} onChange={(event) => setField('priority', event.target.value as TaskPriority)}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select></label>
            <label>Status<select disabled={saving} value={draft.status} onChange={(event) => {
              const next = event.target.value as TaskStatus
              setDraft((current) => ({ ...current, status: next, progress: next === 'done' ? 100 : current.progress }))
              setError('')
            }}>
              <option value="todo">To do</option><option value="in-progress">In progress</option><option value="done">Done</option>
            </select></label>
          </div>

          <label>Progress<input disabled={saving} type="number" min="0" max="100" value={draft.progress} onChange={(event) => setField('progress', Number(event.target.value))} /></label>
          <label>Notes<textarea disabled={saving} value={draft.notes ?? ''} onChange={(event) => setField('notes', event.target.value)} rows={4} placeholder="Optional context, acceptance criteria, or next step" maxLength={5000} /></label>

          {error && <div className="form-status form-status--error" role="alert">{error}</div>}
          {saving && <div className="form-status form-status--saving" role="status" aria-live="polite">Saving task…</div>}
          <div className="modal-actions"><button className="secondary-button" type="button" disabled={saving} onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving} type="submit">{saving ? 'Saving…' : initialTask ? 'Save changes' : 'Add task'}</button></div>
        </form>
      </section>
    </div>
  )
}
