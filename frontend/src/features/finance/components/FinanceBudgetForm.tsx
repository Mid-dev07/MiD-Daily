import { useEffect, useState, type FormEvent } from 'react'
import { useModalBehavior } from '../../../lib/useModalBehavior'
import type { FinanceBudget, FinanceBudgetDraft, FinanceBudgetPeriod } from '../../../types'

interface FinanceBudgetFormProps {
  open: boolean
  initialBudget?: FinanceBudget
  defaultDate: string
  onClose: () => void
  onSubmit: (draft: FinanceBudgetDraft, editingId?: number) => string | null | Promise<string | null>
}

const periods: Array<{ value: FinanceBudgetPeriod; label: string }> = [
  { value: 'WEEK', label: 'Weekly' },
  { value: 'MONTH', label: 'Monthly' },
]

const emptyDraft = (date: string): FinanceBudgetDraft => ({
  name: '',
  category: '',
  amount: 0,
  period: 'MONTH',
  startsOn: date,
  endsOn: '',
  notes: '',
})

export function FinanceBudgetForm({ open, initialBudget, defaultDate, onClose, onSubmit }: FinanceBudgetFormProps) {
  const [draft, setDraft] = useState<FinanceBudgetDraft>(() => emptyDraft(defaultDate))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const dialogRef = useModalBehavior(open, onClose, saving)

  useEffect(() => {
    if (!open) return
    setDraft(initialBudget ? {
      ...initialBudget,
      endsOn: initialBudget.endsOn ?? '',
      notes: initialBudget.notes ?? '',
    } : emptyDraft(defaultDate))
    setError('')
    setSaving(false)
  }, [open, initialBudget, defaultDate])

  if (!open) return null

  const setField = <K extends keyof FinanceBudgetDraft>(field: K, value: FinanceBudgetDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setError('')
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const result = await onSubmit(draft, initialBudget?.id)
      if (result) setError(result)
      else onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save budget.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
      <section ref={dialogRef} className="modal-card" role="dialog" aria-modal="true" aria-labelledby="budget-form-title">
        <div className="modal-header">
          <div><span className="section-kicker">FINANCE</span><h3 id="budget-form-title">{initialBudget ? 'Edit budget' : 'Add budget'}</h3></div>
          <button className="icon-button" type="button" disabled={saving} onClick={onClose} aria-label="Close form">×</button>
        </div>

        <form className="schedule-form" onSubmit={submit}>
          <label>Name<input disabled={saving} value={draft.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. Food allowance" autoFocus maxLength={200} /></label>
          <div className="form-grid two">
            <label>Category <span className="optional-label">Optional</span><input disabled={saving} value={draft.category} onChange={(e) => setField('category', e.target.value)} placeholder="e.g. Food" maxLength={100} /></label>
            <label>Amount<input disabled={saving} type="number" min="1" step="0.01" value={draft.amount || ''} onChange={(e) => setField('amount', Number(e.target.value))} placeholder="0" /></label>
          </div>

          <div className="form-grid two">
            <label>Period<select disabled={saving} value={draft.period} onChange={(e) => setField('period', e.target.value as FinanceBudgetPeriod)}>{periods.map((period) => <option key={period.value} value={period.value}>{period.label}</option>)}</select></label>
            <label>Starts on<input disabled={saving} type="date" value={draft.startsOn} onChange={(e) => setField('startsOn', e.target.value)} /></label>
          </div>

          <label>Ends on <span className="optional-label">Optional</span><input disabled={saving} type="date" value={draft.endsOn ?? ''} min={draft.startsOn} onChange={(e) => setField('endsOn', e.target.value || undefined)} /></label>
          <label>Notes <span className="optional-label">Optional</span><textarea disabled={saving} value={draft.notes ?? ''} onChange={(e) => setField('notes', e.target.value || undefined)} rows={3} maxLength={5000} placeholder="What is this budget for?" /></label>

          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="modal-actions">
            <button className="secondary-button" disabled={saving} type="button" onClick={onClose}>Cancel</button>
            <button className="primary-button" disabled={saving} type="submit">{saving ? 'Saving…' : initialBudget ? 'Save changes' : 'Add budget'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
