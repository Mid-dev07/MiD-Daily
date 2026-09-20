import type { FinanceEntry } from '../../types'

const DEFAULT_CATEGORY = 'General'
const DEFAULT_DATE = new Intl.DateTimeFormat('sv-SE').format(new Date())

export function normalizeFinanceEntry(input: Partial<FinanceEntry> & Pick<FinanceEntry, 'id' | 'title' | 'type' | 'amount'>): FinanceEntry {
  return {
    id: input.id,
    type: input.type,
    title: input.title,
    amount: Number.isFinite(input.amount) ? Math.abs(input.amount) : 0,
    category: input.category?.trim() || DEFAULT_CATEGORY,
    date: input.date || DEFAULT_DATE,
    notes: input.notes?.trim() || undefined,
  }
}

export function normalizeFinanceList(items: FinanceEntry[]): FinanceEntry[] {
  return items.map(normalizeFinanceEntry)
}
