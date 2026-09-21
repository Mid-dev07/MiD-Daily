import type { FinanceBudget, FinanceEntry, Task } from '../../types'
import type { ScheduleItem } from '../schedule/schedule.types'
import { apiRequest } from '../../lib/api'

export interface WorkspaceBootstrap {
  tasks: Task[]
  finance: FinanceEntry[]
  schedule: ScheduleItem[]
  budgets: FinanceBudget[]
}

export async function loadWorkspaceBootstrap() {
  return apiRequest<WorkspaceBootstrap>('/api/workspace/bootstrap')
}
