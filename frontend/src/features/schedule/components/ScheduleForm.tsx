import { useEffect, useState } from 'react'
import type { ReminderOffset, ScheduleDraft, ScheduleItem, ScheduleType } from '../schedule.types'

interface ScheduleFormProps {
  open: boolean
  initialItem?: ScheduleItem
  defaultDate: string
  onClose: () => void
  onSubmit: (draft: ScheduleDraft, editingId?: number) => string | null
}

const types: ScheduleType[] = ['CLASS', 'WORK', 'MEETING', 'STUDY', 'PERSONAL', 'APPOINTMENT', 'EVENT', 'OTHER']
const reminders: ReminderOffset[] = [0, 5, 10, 15, 30, 60]

const emptyDraft = (date: string): ScheduleDraft => ({
  title: '',
  type: 'PERSONAL',
  date,
  startTime: '09:00',
  endTime: '10:00',
  location: '',
  notes: '',
  reminderEnabled: false,
  reminderOffset: 15,
})

export function ScheduleForm({ open, initialItem, defaultDate, onClose, onSubmit }: ScheduleFormProps) {
  const [draft, setDraft] = useState<ScheduleDraft>(() => emptyDraft(defaultDate))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setDraft(initialItem ? {
      title: initialItem.title,
      type: initialItem.type,
      date: initialItem.date,
      startTime: initialItem.startTime,
      endTime: initialItem.endTime,
      location: initialItem.location,
      notes: initialItem.notes,
      reminderEnabled: initialItem.reminderEnabled,
      reminderOffset: initialItem.reminderOffset,
    } : emptyDraft(defaultDate))
    setError('')
  }, [open, initialItem, defaultDate])

  if (!open) return null

  const setField = <K extends keyof ScheduleDraft>(field: K, value: ScheduleDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setError('')
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const result = onSubmit(draft, initialItem?.id)
    if (result) {
      setError(result)
      return
    }
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="schedule-form-title">
        <div className="modal-header">
          <div>
            <span className="section-kicker">SCHEDULE</span>
            <h3 id="schedule-form-title">{initialItem ? 'Edit activity' : 'Add activity'}</h3>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close form">×</button>
        </div>

        <form className="schedule-form" onSubmit={submit}>
          <label>Title<input value={draft.title} onChange={(e) => setField('title', e.target.value)} placeholder="e.g. Team meeting" autoFocus /></label>
          <div className="form-grid two">
            <label>Type<select value={draft.type} onChange={(e) => setField('type', e.target.value as ScheduleType)}>{types.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
            <label>Date<input type="date" value={draft.date} onChange={(e) => setField('date', e.target.value)} /></label>
          </div>
          <div className="form-grid two">
            <label>Start<input type="time" value={draft.startTime} onChange={(e) => setField('startTime', e.target.value)} /></label>
            <label>End<input type="time" value={draft.endTime} onChange={(e) => setField('endTime', e.target.value)} /></label>
          </div>
          <label>Location<input value={draft.location} onChange={(e) => setField('location', e.target.value)} placeholder="Optional" /></label>
          <label>Notes<textarea value={draft.notes} onChange={(e) => setField('notes', e.target.value)} rows={3} placeholder="Optional notes" /></label>

          <div className="form-section">
            <div className="form-section-heading"><strong>Reminder</strong><span>Native notification layer comes later.</span></div>
            <div className="reminder-row">
              <label className="switch-field"><input type="checkbox" checked={draft.reminderEnabled} onChange={(e) => setField('reminderEnabled', e.target.checked)} /><span>Enable reminder</span></label>
              <select value={draft.reminderOffset} disabled={!draft.reminderEnabled} onChange={(e) => setField('reminderOffset', Number(e.target.value) as ReminderOffset)} aria-label="Reminder offset">
                {reminders.map((value) => <option key={value} value={value}>{value === 0 ? 'At start' : `${value} minutes before`}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}

          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
            <button className="primary-button" type="submit">{initialItem ? 'Save changes' : 'Add activity'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
