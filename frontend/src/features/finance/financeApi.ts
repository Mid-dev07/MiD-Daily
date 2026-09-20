import type { FinanceDraft, FinanceEntry } from '../../types'
import { apiRequest } from '../../lib/api'

export async function listRemoteFinance() {
  const data = await apiRequest<{ items: FinanceEntry[] }>('/api/finance')
  return data.items
}

export async function createRemoteFinance(draft: FinanceDraft) {
  const data = await apiRequest<{ item: FinanceEntry }>('/api/finance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  })
  return data.item
}

export async function updateRemoteFinance(id: number, draft: Partial<FinanceDraft>) {
  const data = await apiRequest<{ item: FinanceEntry }>(`/api/finance/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  })
  return data.item
}

export async function deleteRemoteFinance(id: number) {
  await apiRequest<{ deleted: boolean }>(`/api/finance/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
