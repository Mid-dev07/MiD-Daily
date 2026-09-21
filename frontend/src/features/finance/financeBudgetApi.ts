import type { FinanceBudget, FinanceBudgetDraft } from '../../types'
import { apiRequest } from '../../lib/api'

export async function listRemoteFinanceBudgets() {
  const data = await apiRequest<{ items: FinanceBudget[] }>('/api/finance-budgets')
  return data.items
}

export async function createRemoteFinanceBudget(draft: FinanceBudgetDraft) {
  const data = await apiRequest<{ item: FinanceBudget }>('/api/finance-budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  })
  return data.item
}

export async function updateRemoteFinanceBudget(id: number, draft: Partial<FinanceBudgetDraft>) {
  const data = await apiRequest<{ item: FinanceBudget }>(`/api/finance-budgets/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  })
  return data.item
}

export async function deleteRemoteFinanceBudget(id: number) {
  await apiRequest<{ deleted: boolean }>(`/api/finance-budgets/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
