import { supabase } from '../../lib/supabase'
import type { Habit, HabitLog } from '../../types'

interface HabitRow {
  id: number
  name: string
  target_days: number[]
  active: boolean
  created_at: string
  updated_at: string
}

interface HabitLogRow {
  habit_id: number
  log_date: string
}

function mapHabit(row: HabitRow): Habit {
  return {
    id: Number(row.id),
    name: row.name,
    targetDays: row.target_days.map(Number),
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listHabits(): Promise<Habit[]> {
  if (!supabase) throw new Error('Habit storage is not configured.')
  const { data, error } = await supabase
    .from('habits')
    .select('id,name,target_days,active,created_at,updated_at')
    .eq('active', true)
    .order('created_at', { ascending: true })

  if (error) throw new Error('Unable to load habits: ' + error.message)
  return (data ?? []).map(mapHabit)
}

export async function listHabitLogs(startDate: string, endDate: string): Promise<HabitLog[]> {
  if (!supabase) throw new Error('Habit storage is not configured.')
  const { data, error } = await supabase
    .from('habit_logs')
    .select('habit_id,log_date')
    .gte('log_date', startDate)
    .lte('log_date', endDate)

  if (error) throw new Error('Unable to load habit history: ' + error.message)
  return (data ?? []).map((row: HabitLogRow) => ({ habitId: Number(row.habit_id), date: row.log_date }))
}

export async function createHabit(name: string, targetDays: number[]): Promise<Habit> {
  if (!supabase) throw new Error('Habit storage is not configured.')
  const normalized = name.trim()
  const days = [...new Set(targetDays.map(Number))].sort((a, b) => a - b)
  if (normalized.length < 1 || normalized.length > 80) throw new Error('Habit name must be between 1 and 80 characters.')
  if (days.length < 1 || days.some((day) => !Number.isInteger(day) || day < 1 || day > 7)) throw new Error('Choose at least one valid day.')

  const { data, error } = await supabase
    .from('habits')
    .insert({ name: normalized, target_days: days })
    .select('id,name,target_days,active,created_at,updated_at')
    .single<HabitRow>()

  if (error) {
    if (error.code === '23505') throw new Error('A habit with this name already exists.')
    throw new Error('Unable to create habit: ' + error.message)
  }
  return mapHabit(data)
}

export async function updateHabit(habitId: number, name: string, targetDays: number[]): Promise<Habit> {
  if (!supabase) throw new Error('Habit storage is not configured.')
  const normalized = name.trim()
  const days = [...new Set(targetDays.map(Number))].sort((a, b) => a - b)
  if (normalized.length < 1 || normalized.length > 80) throw new Error('Habit name must be between 1 and 80 characters.')
  if (days.length < 1 || days.some((day) => !Number.isInteger(day) || day < 1 || day > 7)) throw new Error('Choose at least one valid day.')

  const { data, error } = await supabase
    .from('habits')
    .update({ name: normalized, target_days: days })
    .eq('id', habitId)
    .select('id,name,target_days,active,created_at,updated_at')
    .single<HabitRow>()

  if (error) {
    if (error.code === '23505') throw new Error('A habit with this name already exists.')
    throw new Error('Unable to update habit: ' + error.message)
  }
  return mapHabit(data)
}

export async function archiveHabit(habitId: number) {
  if (!supabase) throw new Error('Habit storage is not configured.')
  const { error } = await supabase.from('habits').update({ active: false }).eq('id', habitId)
  if (error) throw new Error('Unable to archive habit: ' + error.message)
}

export async function toggleHabitLog(habitId: number, date: string, completed: boolean) {
  if (!supabase) throw new Error('Habit storage is not configured.')
  if (completed) {
    const { error } = await supabase.from('habit_logs').insert({ habit_id: habitId, log_date: date })
    if (error && error.code !== '23505') throw new Error('Unable to mark habit complete: ' + error.message)
    return
  }

  const { error } = await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('log_date', date)
  if (error) throw new Error('Unable to undo habit completion: ' + error.message)
}
