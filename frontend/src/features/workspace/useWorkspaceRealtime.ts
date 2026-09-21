import { useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { normalizeTaskList } from '../../tasks/task.migration'
import { normalizeFinanceList } from '../../finance/finance.migration'
import { normalizeScheduleList } from '../../schedule/schedule.migration'
import type { FinanceEntry, Task } from '../../../types'
import type { ScheduleItem } from '../../schedule/schedule.types'

type Row = Record<string, unknown>
type ChangePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Row
  old: Row
}

function mapTask(row: Row): Task {
  return normalizeTaskList([{
    id: Number(row.id),
    title: String(row.title ?? ''),
    category: String(row.category ?? ''),
    priority: row.priority as Task['priority'],
    status: row.status as Task['status'],
    dueDate: typeof row.due_date === 'string' ? row.due_date : undefined,
    notes: typeof row.notes === 'string' ? row.notes : undefined,
    progress: Number(row.progress ?? 0),
  }])[0]
}

function mapFinance(row: Row): FinanceEntry {
  return normalizeFinanceList([{
    id: Number(row.id),
    type: row.type as FinanceEntry['type'],
    title: String(row.title ?? ''),
    amount: Number(row.amount ?? 0),
    category: String(row.category ?? ''),
    date: String(row.entry_date ?? ''),
    notes: typeof row.notes === 'string' ? row.notes : undefined,
  }])[0]
}

function mapSchedule(row: Row): ScheduleItem {
  return normalizeScheduleList([{
    id: Number(row.id),
    title: String(row.title ?? ''),
    type: row.type as ScheduleItem['type'],
    date: String(row.event_date ?? ''),
    startTime: String(row.start_time ?? '').slice(0, 5),
    endTime: String(row.end_time ?? '').slice(0, 5),
    location: String(row.location ?? ''),
    notes: String(row.notes ?? ''),
    reminderEnabled: Boolean(row.reminder_enabled),
    reminderOffset: Number(row.reminder_offset ?? 15) as ScheduleItem['reminderOffset'],
    recurrence: (row.recurrence ?? { frequency: 'NONE', interval: 1 }) as ScheduleItem['recurrence'],
    googleCalendar: (row.google_calendar ?? { status: 'not-synced', calendarId: 'primary' }) as ScheduleItem['googleCalendar'],
  }])[0]
}

export function useWorkspaceRealtime(
  userId: string | undefined,
  onTasks: (updater: (current: Task[]) => Task[]) => void,
  onFinance: (updater: (current: FinanceEntry[]) => FinanceEntry[]) => void,
  onSchedule: (updater: (current: ScheduleItem[]) => ScheduleItem[]) => void,
) {
  useEffect(() => {
    if (!userId || !supabase) return

    const upsertById = <T extends { id: number }>(items: T[], next: T) => {
      const existing = items.some((item) => item.id === next.id)
      return existing ? items.map((item) => item.id === next.id ? next : item) : [...items, next]
    }

    const channel = supabase
      .channel('workspace:' + userId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: 'user_id=eq.' + userId },
        (payload) => {
          const change = payload as unknown as ChangePayload
          if (change.eventType === 'DELETE') {
            const id = Number(change.old.id)
            onTasks((current) => current.filter((item) => item.id !== id))
            return
          }
          const next = mapTask(change.new)
          onTasks((current) => upsertById(current, next))
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'finance_entries', filter: 'user_id=eq.' + userId },
        (payload) => {
          const change = payload as unknown as ChangePayload
          if (change.eventType === 'DELETE') {
            const id = Number(change.old.id)
            onFinance((current) => current.filter((item) => item.id !== id))
            return
          }
          const next = mapFinance(change.new)
          onFinance((current) => upsertById(current, next))
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedule_items', filter: 'user_id=eq.' + userId },
        (payload) => {
          const change = payload as unknown as ChangePayload
          if (change.eventType === 'DELETE') {
            const id = Number(change.old.id)
            onSchedule((current) => current.filter((item) => item.id !== id))
            return
          }
          const next = mapSchedule(change.new)
          onSchedule((current) => upsertById(current, next))
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('MiD-Daily realtime channel:', status)
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, onTasks, onFinance, onSchedule])
}
