import type { Task, TaskDraft } from '../../types'
import { apiRequest } from '../../lib/api'

export async function listRemoteTasks() {
  const data = await apiRequest<{ items: Task[] }>('/api/tasks')
  return data.items
}

export async function createRemoteTask(draft: TaskDraft) {
  const data = await apiRequest<{ item: Task }>('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  })
  return data.item
}

export async function updateRemoteTask(id: number, draft: Partial<TaskDraft>) {
  const data = await apiRequest<{ item: Task }>(`/api/tasks/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  })
  return data.item
}

export async function deleteRemoteTask(id: number) {
  await apiRequest<{ deleted: boolean }>(`/api/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
