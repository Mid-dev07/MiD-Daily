import type { FinanceDraft, FinanceEntry } from '../../types'

export interface FinanceValidationResult {
  valid: boolean
  message: string
}

export function validateFinanceDraft(draft: FinanceDraft, existing: FinanceEntry[], editingId?: number): FinanceValidationResult {
  if (!draft.title.trim()) return { valid: false, message: 'Title is required.' }
  if (!draft.category.trim()) return { valid: false, message: 'Category is required.' }
  if (!Number.isFinite(draft.amount) || draft.amount <= 0) return { valid: false, message: 'Amount must be greater than zero.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return { valid: false, message: 'Date is invalid.' }

  const duplicate = existing.some((entry) =>
    entry.id !== editingId &&
    entry.type === draft.type &&
    entry.title.trim().toLowerCase() === draft.title.trim().toLowerCase() &&
    entry.date === draft.date
  )

  if (duplicate) return { valid: false, message: 'A transaction with this title already exists on this date.' }
  return { valid: true, message: '' }
}
