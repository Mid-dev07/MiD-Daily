import { createClient } from '@supabase/supabase-js'

export interface TaskRecord {
  id: number
  title: string
  category: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in-progress' | 'done'
  dueDate?: string
  notes?: string
  progress: number
}

export interface FinanceRecord {
  id: number
  type: 'income' | 'expense'
  title: string
  amount: number
  category: string
  date: string
  notes?: string
}

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? ''

function db() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error('Supabase persistence is not configured.')
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
}

function taskFromRow(row: Record<string, unknown>): TaskRecord {
  return {
    id: Number(row.id),
    title: String(row.title),
    category: String(row.category),
    priority: row.priority as TaskRecord['priority'],
    status: row.status as TaskRecord['status'],
    dueDate: typeof row.due_date === 'string' ? row.due_date : undefined,
    notes: typeof row.notes === 'string' ? row.notes : undefined,
    progress: Number(row.progress ?? 0),
  }
}

function financeFromRow(row: Record<string, unknown>): FinanceRecord {
  return {
    id: Number(row.id),
    type: row.type as FinanceRecord['type'],
    title: String(row.title),
    amount: Number(row.amount),
    category: String(row.category),
    date: String(row.entry_date),
    notes: typeof row.notes === 'string' ? row.notes : undefined,
  }
}

export async function listTasks(userId: string) {
  const { data, error } = await db().from('tasks').select('id,title,category,priority,status,due_date,notes,progress').eq('user_id', userId).order('due_date', { ascending: true, nullsFirst: false }).order('id', { ascending: false })
  if (error) throw new Error(`Task read failed: ${error.message}`)
  return (data ?? []).map(taskFromRow)
}

export async function createTask(userId: string, task: TaskRecord) {
  const { data, error } = await db().from('tasks').insert({
    user_id: userId,
    title: task.title,
    category: task.category,
    priority: task.priority,
    status: task.status,
    due_date: task.dueDate ?? null,
    notes: task.notes ?? null,
    progress: task.progress,
  }).select('id,title,category,priority,status,due_date,notes,progress').single()

  if (error) throw new Error(`Task create failed: ${error.message}`)
  return taskFromRow(data)
}

export async function updateTask(userId: string, id: number, task: Partial<TaskRecord>) {
  const { data, error } = await db().from('tasks').update({
    ...(task.title === undefined ? {} : { title: task.title }),
    ...(task.category === undefined ? {} : { category: task.category }),
    ...(task.priority === undefined ? {} : { priority: task.priority }),
    ...(task.status === undefined ? {} : { status: task.status }),
    ...(task.dueDate === undefined ? {} : { due_date: task.dueDate ?? null }),
    ...(task.notes === undefined ? {} : { notes: task.notes ?? null }),
    ...(task.progress === undefined ? {} : { progress: task.progress }),
  }).eq('id', id).eq('user_id', userId).select('id,title,category,priority,status,due_date,notes,progress').maybeSingle()

  if (error) throw new Error(`Task update failed: ${error.message}`)
  if (!data) return null
  return taskFromRow(data)
}

export async function deleteTask(userId: string, id: number) {
  const { data, error } = await db().from('tasks').delete().eq('id', id).eq('user_id', userId).select('id').maybeSingle()
  if (error) throw new Error(`Task delete failed: ${error.message}`)
  return Boolean(data)
}

export async function listFinance(userId: string) {
  const { data, error } = await db().from('finance_entries').select('id,type,title,amount,category,entry_date,notes').eq('user_id', userId).order('entry_date', { ascending: false }).order('id', { ascending: false })
  if (error) throw new Error(`Finance read failed: ${error.message}`)
  return (data ?? []).map(financeFromRow)
}

export async function createFinance(userId: string, entry: FinanceRecord) {
  const { data, error } = await db().from('finance_entries').insert({
    user_id: userId,
    type: entry.type,
    title: entry.title,
    amount: entry.amount,
    category: entry.category,
    entry_date: entry.date,
    notes: entry.notes ?? null,
  }).select('id,type,title,amount,category,entry_date,notes').single()

  if (error) throw new Error(`Finance create failed: ${error.message}`)
  return financeFromRow(data)
}

export async function updateFinance(userId: string, id: number, entry: Partial<FinanceRecord>) {
  const { data, error } = await db().from('finance_entries').update({
    ...(entry.type === undefined ? {} : { type: entry.type }),
    ...(entry.title === undefined ? {} : { title: entry.title }),
    ...(entry.amount === undefined ? {} : { amount: entry.amount }),
    ...(entry.category === undefined ? {} : { category: entry.category }),
    ...(entry.date === undefined ? {} : { entry_date: entry.date }),
    ...(entry.notes === undefined ? {} : { notes: entry.notes ?? null }),
  }).eq('id', id).eq('user_id', userId).select('id,type,title,amount,category,entry_date,notes').maybeSingle()

  if (error) throw new Error(`Finance update failed: ${error.message}`)
  if (!data) return null
  return financeFromRow(data)
}

export async function deleteFinance(userId: string, id: number) {
  const { data, error } = await db().from('finance_entries').delete().eq('id', id).eq('user_id', userId).select('id').maybeSingle()
  if (error) throw new Error(`Finance delete failed: ${error.message}`)
  return Boolean(data)
}

export function isDataPersistenceConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY)
}
