import { useEffect, useState, type FormEvent } from 'react'
import { useModalBehavior } from '../../../lib/useModalBehavior'
import type { ReminderOffset, RecurrenceFrequency, ScheduleDraft, ScheduleItem, ScheduleType } from '../schedule.types'

interface ScheduleFormProps {
  open: boolean
  initialItem?: ScheduleItem
  defaultDate: string
  onClose: () => void
  onSubmit: (draft: ScheduleDraft, editingId?: number) => string | null | Promise<string | null>
}

const types: ScheduleType[] = ['CLASS', 'WORK', 'MEETING', 'STUDY', 'PERSONAL', 'APPOINTMENT', 'EVENT', 'OTHER']
const reminders: ReminderOffset[] = [0, 5, 10, 15, 30, 60]
const recurrenceOptions: Array<{ value: RecurrenceFrequency; label: string }> = [
  { value: 'NONE', label: 'Does not repeat' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
]

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
  recurrence: { frequency: 'NONE', interval: 1 },
})

export function ScheduleForm({ open, initialItem, defaultDate, onClose, onSubmit }: ScheduleFormProps) {
  const [draft, setDraft] = useState<ScheduleDraft>(() => emptyDraft(defaultDate))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useModalBehavior(open, onClose, saving)

  useEffect(() => {
    if (!open) return
    setDraft(initialItem ? { ...initialItem, recurrence: { ...initialItem.recurrence } } : emptyDraft(defaultDate))
    setError('')
    setSaving(false)
  }, [open, initialItem, defaultDate])

  if (!open) return null

  const setField = <K extends keyof ScheduleDraft>(field: K, value: ScheduleDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setError('')
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const result = await onSubmit(draft, initialItem?.id)
      if (result) {
        setError(result)
        return
      }
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save activity.')
    } finally {
      setSaving(false)
    }
  }

  const updateRecurrence = (field: keyof ScheduleDraft['recurrence'], value: string | number | undefined) => {
    setField('recurrence', { ...draft.recurrence, [field]: value })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="schedule-form-title">
        <div className="modal-header">
          <div><span className="section-kicker">SCHEDULE</span><h3 id="schedule-form-title">{initialItem ? 'Edit activity' : 'Add activity'}</h3></div>
          <button className="icon-button" type="button" disabled={saving} onClick={onClose} aria-label="Close form">×</button>
        </div>

        <form className="schedule-form" onSubmit={submit}>
          <label>Title<input disabled={saving} value={draft.title} onChange={(e) => setField('title', e.target.value)} placeholder="e.g. Team meeting" autoFocus maxLength={200} /></label>

          <div className="form-grid two">
            <label>Type<select disabled={saving} value={draft.type} onChange={(e) => setField('type', e.target.value as ScheduleType)}>{types.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
            <label>Date<input disabled={saving} type="date" value={draft.date} onChange={(e) => setField('date', e.target.value)} /></label>
          </div>

          <div className="form-grid two">
            <label>Start<input disabled={saving} type="time" value={draft.startTime} onChange={(e) => setField('startTime', e.target.value)} /></label>
            <label>End<input disabled={saving} type="time" value={draft.endTime} onChange={(e) => setField('endTime', e.target.value)} /></label>
          </div>

          <label>Location<input disabled={saving} value={draft.location} onChange={(e) => setField('location', e.target.value)} placeholder="Optional" maxLength={200} /></label>
          <label>Notes<textarea disabled={saving} value={draft.notes} onChange={(e) => setField('notes', e.target.value)} rows={3} placeholder="Optional notes" maxLength={5000} /></label>

          <div className="form-section">
            <div className="form-section-heading"><strong>Repeat</strong><span>Stored locally; sync-safe model.</span></div>
            <div className="form-grid two">
              <label>Frequency<select disabled={saving} value={draft.recurrence.frequency} onChange={(e) => updateRecurrence('frequency', e.target.value as RecurrenceFrequency)}>{recurrenceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <label>Every<input disabled={saving || draft.recurrence.frequency === 'NONE'} type="number" min="1" max="30" value={draft.recurrence.interval} onChange={(e) => updateRecurrence('interval', Number(e.target.value))} /></label>
            </div>
            {draft.recurrence.frequency !== 'NONE' && (
              <label>Repeat until<input type="date" value={draft.recurrence.until ?? ''} onChange={(e) => updateRecurrence('until', e.target.value || undefined)} /></label>
            )}
          </div>

          <div className="form-section">
            <div className="form-section-heading"><strong>Reminder</strong><span>Active while MiD-Daily is open; browser/device delivery uses your notification permission.</span></div>
            <div className="reminder-row">
              <label className="switch-field"><input disabled={saving} type="checkbox" checked={draft.reminderEnabled} onChange={(e) => setField('reminderEnabled', e.target.checked)} /><span>Enable reminder</span></label>
              <select value={draft.reminderOffset} disabled={!draft.reminderEnabled} onChange={(e) => setField('reminderOffset', Number(e.target.value) as ReminderOffset)} aria-label="Reminder offset">
                {reminders.map((value) => <option key={value} value={value}>{value === 0 ? 'At start' : `${value} minutes before`}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="modal-actions"><button className="secondary-button" disabled={saving} type="button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving} type="submit">{saving ? 'Saving…' : initialItem ? 'Save changes' : 'Add activity'}</button></div>
        </form>
      </section>
    </div>
  )
}
