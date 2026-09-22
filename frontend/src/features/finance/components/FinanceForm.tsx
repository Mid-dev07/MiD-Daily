import { useEffect, useState, type FormEvent } from 'react'
import { useModalBehavior } from '../../../lib/useModalBehavior'
import type { FinanceDraft, FinanceEntry, FinanceEntryType } from '../../../types'

interface FinanceFormProps {
  open: boolean
  initialEntry?: FinanceEntry
  defaultDate: string
  onClose: () => void
  onSubmit: (draft: FinanceDraft, editingId?: number) => string | null | Promise<string | null>
}

const getEmptyDraft = (date: string): FinanceDraft => ({
  type: 'expense',
  title: '',
  amount: 0,
  category: 'General',
  date,
  notes: '',
})

export function FinanceForm({ open, initialEntry, defaultDate, onClose, onSubmit }: FinanceFormProps) {
  const [draft, setDraft] = useState<FinanceDraft>(() => getEmptyDraft(defaultDate))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const dialogRef = useModalBehavior(open, onClose, saving)

  useEffect(() => {
    if (!open) return
    setDraft(initialEntry ? {
      type: initialEntry.type,
      title: initialEntry.title,
      amount: initialEntry.amount,
      category: initialEntry.category,
      date: initialEntry.date,
      notes: initialEntry.notes ?? '',
    } : getEmptyDraft(defaultDate))
    setError('')
    setSaving(false)
  }, [open, initialEntry, defaultDate])

  if (!open) return null

  const setField = <K extends keyof FinanceDraft>(field: K, value: FinanceDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setError('')
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const result = await onSubmit({ ...draft, amount: Math.abs(draft.amount) }, initialEntry?.id)
      if (result) {
        setError(result)
        return
      }
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save transaction.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
      <section ref={dialogRef} className="modal-card" role="dialog" aria-modal="true" aria-labelledby="finance-form-title">
        <div className="modal-header">
          <div><span className="section-kicker">FINANCE</span><h3 id="finance-form-title">{initialEntry ? 'Edit transaction' : 'Add transaction'}</h3></div>
          <button className="icon-button" type="button" disabled={saving} onClick={onClose} aria-label="Close finance form">×</button>
        </div>

        <form className="schedule-form" onSubmit={submit}>
          <div className="form-grid two">
            <label>Type<select disabled={saving} value={draft.type} onChange={(event) => setField('type', event.target.value as FinanceEntryType)}><option value="expense">Expense</option><option value="income">Income</option></select></label>
            <label>Date<input disabled={saving} type="date" value={draft.date} onChange={(event) => setField('date', event.target.value)} /></label>
          </div>

          <label>Title<input disabled={saving} value={draft.title} onChange={(event) => setField('title', event.target.value)} placeholder="e.g. Internet bill" autoFocus maxLength={200} /></label>

          <div className="form-grid two">
            <label>Amount<input disabled={saving} type="number" min="1" step="1" value={draft.amount || ''} onChange={(event) => setField('amount', Number(event.target.value))} placeholder="0" /></label>
            <label>Category<input disabled={saving} value={draft.category} onChange={(event) => setField('category', event.target.value)} placeholder="e.g. Food" maxLength={100} /></label>
          </div>

          <label>Notes<textarea disabled={saving} rows={4} value={draft.notes ?? ''} onChange={(event) => setField('notes', event.target.value)} placeholder="Optional note" maxLength={5000} /></label>

          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="modal-actions"><button className="secondary-button" disabled={saving} type="button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving} type="submit">{saving ? 'Saving…' : initialEntry ? 'Save changes' : 'Add transaction'}</button></div>
        </form>
      </section>
    </div>
  )
}
