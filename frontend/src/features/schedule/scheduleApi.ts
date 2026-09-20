import type { ScheduleItem } from './schedule.types'
import { apiRequest } from '../../lib/api'

export async function listRemoteSchedule() {
  const data = await apiRequest<{ items: ScheduleItem[] }>('/api/schedule')
  return data.items
}

export async function createRemoteSchedule(item: ScheduleItem) {
  const data = await apiRequest<{ item: ScheduleItem }>('/api/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  return data.item
}

export async function updateRemoteSchedule(id: number, item: Partial<ScheduleItem>) {
  const data = await apiRequest<{ item: ScheduleItem }>(`/api/schedule/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  return data.item
}

export async function deleteRemoteSchedule(id: number) {
  await apiRequest<{ deleted: boolean }>(`/api/schedule/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
