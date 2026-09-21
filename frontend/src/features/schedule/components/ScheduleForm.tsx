import { useEffect, useState, type FormEvent } from 'react'
import { useModalBehavior } from '../../../lib/useModalBehavior'
import type { ActivityMode, ReminderOffset, RecurrenceFrequency, ScheduleDraft, ScheduleItem, ScheduleType, TargetPeriod } from '../schedule.types'

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
const modeOptions: Array<{ value: ActivityMode; label: string; description: string }> = [
  { value: 'FIXED', label: 'Fixed', description: 'A time-bound activity, optionally recurring.' },
  { value: 'FLEXIBLE', label: 'Flexible', description: 'A target to fit into available time instead of a fixed slot.' },
  { value: 'ONE_TIME', label: 'One-time', description: 'A single activity with a specific date and time.' },
]
const targetPeriods: Array<{ value: TargetPeriod; label: string }> = [
  { value: 'DAY', label: 'per day' },
  { value: 'WEEK', label: 'per week' },
  { value: 'MONTH', label: 'per month' },
]

const emptyDraft = (date: string): ScheduleDraft => ({
  title: '',
  type: 'PERSONAL',
  activityMode: 'ONE_TIME',
  date,
  startTime: '',
  endTime: '',
  location: '',
  notes: '',
  reminderEnabled: false,
  reminderOffset: 15,
  recurrence: { frequency: 'NONE', interval: 1 },
  targetCount: 3,
  targetPeriod: 'WEEK',
  durationMinutes: 60,
  preferredStartTime: '',
  preferredEndTime: '',
  activityDeadline: date,
})

function normalizedModeDraft(draft: ScheduleDraft, mode: ActivityMode): ScheduleDraft {
  if (mode === 'FLEXIBLE') {
    return {
      ...draft,
      activityMode: mode,
      startTime: '',
      endTime: '',
      recurrence: { frequency: 'NONE', interval: 1 },
      reminderEnabled: false,
      targetCount: draft.targetCount ?? 3,
      targetPeriod: draft.targetPeriod ?? 'WEEK',
      durationMinutes: draft.durationMinutes ?? 60,
      activityDeadline: draft.activityDeadline ?? draft.date,
    }
  }

  return {
    ...draft,
    activityMode: mode,
    targetCount: undefined,
    targetPeriod: undefined,
    durationMinutes: undefined,
    preferredStartTime: undefined,
    preferredEndTime: undefined,
    activityDeadline: undefined,
    startTime: draft.startTime || '09:00',
    endTime: draft.endTime || '10:00',
    recurrence: mode === 'ONE_TIME' ? { frequency: 'NONE', interval: 1 } : draft.recurrence,
  }
}

export function ScheduleForm({ open, initialItem, defaultDate, onClose, onSubmit }: ScheduleFormProps) {
  const [draft, setDraft] = useState<ScheduleDraft>(() => emptyDraft(defaultDate))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useModalBehavior(open, onClose, saving)

  useEffect(() => {
    if (!open) return
    setDraft(initialItem
      ? { ...initialItem, recurrence: { ...initialItem.recurrence }, preferredStartTime: initialItem.preferredStartTime ?? '', preferredEndTime: initialItem.preferredEndTime ?? '' }
      : emptyDraft(defaultDate))
    setError('')
    setSaving(false)
  }, [open, initialItem, defaultDate])

  if (!open) return null

  const setField = <K extends keyof ScheduleDraft>(field: K, value: ScheduleDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setError('')
  }

  const updateMode = (mode: ActivityMode) => {
    setDraft((current) => normalizedModeDraft(current, mode))
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

  const flexible = draft.activityMode === 'FLEXIBLE'
  const fixed = draft.activityMode === 'FIXED'

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="schedule-form-title">
        <div className="modal-header">
          <div><span className="section-kicker">PLANNER</span><h3 id="schedule-form-title">{initialItem ? 'Edit activity' : 'Add activity'}</h3></div>
          <button className="icon-button" type="button" disabled={saving} onClick={onClose} aria-label="Close form">×</button>
        </div>

        <form className="schedule-form" onSubmit={submit}>
          <label>Title<input disabled={saving} value={draft.title} onChange={(e) => setField('title', e.target.value)} placeholder="e.g. Study for database exam" autoFocus maxLength={200} /></label>

          <div className="form-section">
            <div className="form-section-heading"><strong>Planning style</strong><span>Choose whether time is fixed or should stay flexible.</span></div>
            <div className="planner-mode-options">
              {modeOptions.map((option) => (
                <button key={option.value} className={draft.activityMode === option.value ? 'planner-mode-option is-active' : 'planner-mode-option'} type="button" disabled={saving} onClick={() => updateMode(option.value)}>
                  <strong>{option.label}</strong><span>{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid two">
            <label>Type<select disabled={saving} value={draft.type} onChange={(e) => setField('type', e.target.value as ScheduleType)}>{types.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
            <label>{flexible ? 'Planning starts' : 'Date'}<input disabled={saving} type="date" value={draft.date} onChange={(e) => setField('date', e.target.value)} /></label>
          </div>

          {flexible ? (
            <>
              <div className="form-section">
                <div className="form-section-heading"><strong>Flexible target</strong><span>Set an outcome; MiD-Daily can later fit it around your fixed schedule.</span></div>
                <div className="form-grid two">
                  <label>Target sessions<input disabled={saving} type="number" min="1" max="100" value={draft.targetCount ?? 3} onChange={(e) => setField('targetCount', Number(e.target.value))} /></label>
                  <label>Target period<select disabled={saving} value={draft.targetPeriod ?? 'WEEK'} onChange={(e) => setField('targetPeriod', e.target.value as TargetPeriod)}>{targetPeriods.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                </div>
                <div className="form-grid two">
                  <label>Session duration<input disabled={saving} type="number" min="5" max="1440" value={draft.durationMinutes ?? 60} onChange={(e) => setField('durationMinutes', Number(e.target.value))} /><span className="field-hint">minutes</span></label>
                  <label>Deadline<input disabled={saving} type="date" value={draft.activityDeadline ?? draft.date} min={draft.date} onChange={(e) => setField('activityDeadline', e.target.value || undefined)} /></label>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-heading"><strong>Preferred window <span className="optional-label">Optional</span></strong><span>Helps future scheduling without making the time mandatory.</span></div>
                <div className="form-grid two">
                  <label>From<input disabled={saving} type="time" value={draft.preferredStartTime ?? ''} onChange={(e) => setField('preferredStartTime', e.target.value || undefined)} /></label>
                  <label>Until<input disabled={saving} type="time" value={draft.preferredEndTime ?? ''} onChange={(e) => setField('preferredEndTime', e.target.value || undefined)} /></label>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-grid two">
                <label>Start<input disabled={saving} type="time" value={draft.startTime} onChange={(e) => setField('startTime', e.target.value)} /></label>
                <label>End<input disabled={saving} type="time" value={draft.endTime} onChange={(e) => setField('endTime', e.target.value)} /></label>
              </div>

              {fixed && (
                <div className="form-section">
                  <div className="form-section-heading"><strong>Repeat</strong><span>Recurring fixed-time activities stay in your agenda automatically.</span></div>
                  <div className="form-grid two">
                    <label>Frequency<select disabled={saving} value={draft.recurrence.frequency} onChange={(e) => updateRecurrence('frequency', e.target.value as RecurrenceFrequency)}>{recurrenceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                    <label>Every<input disabled={saving || draft.recurrence.frequency === 'NONE'} type="number" min="1" max="30" value={draft.recurrence.interval} onChange={(e) => updateRecurrence('interval', Number(e.target.value))} /></label>
                  </div>
                  {draft.recurrence.frequency !== 'NONE' && (
                    <label>Repeat until<input disabled={saving} type="date" value={draft.recurrence.until ?? ''} min={draft.date} onChange={(e) => updateRecurrence('until', e.target.value || undefined)} /></label>
                  )}
                </div>
              )}

              <div className="form-section">
                <div className="form-section-heading"><strong>Reminder</strong><span>Use reminders only when the activity has a concrete time.</span></div>
                <div className="reminder-row">
                  <label className="switch-field"><input disabled={saving} type="checkbox" checked={draft.reminderEnabled} onChange={(e) => setField('reminderEnabled', e.target.checked)} /><span>Enable reminder</span></label>
                  <select value={draft.reminderOffset} disabled={saving || !draft.reminderEnabled} onChange={(e) => setField('reminderOffset', Number(e.target.value) as ReminderOffset)} aria-label="Reminder offset">
                    {reminders.map((value) => <option key={value} value={value}>{value === 0 ? 'At start' : value + ' minutes before'}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          <label>Location<input disabled={saving} value={draft.location} onChange={(e) => setField('location', e.target.value)} placeholder="Optional" maxLength={200} /></label>
          <label>Notes<textarea disabled={saving} value={draft.notes} onChange={(e) => setField('notes', e.target.value)} rows={3} placeholder="Optional notes" maxLength={5000} /></label>

          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="modal-actions"><button className="secondary-button" disabled={saving} type="button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving} type="submit">{saving ? 'Saving…' : initialItem ? 'Save changes' : 'Add activity'}</button></div>
        </form>
      </section>
    </div>
  )
}
