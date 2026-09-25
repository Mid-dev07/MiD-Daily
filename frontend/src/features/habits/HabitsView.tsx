import { useEffect, useMemo, useState } from 'react'
import { WorkspaceHeader } from '../../components/ui/WorkspaceHeader'
import type { Habit, HabitLog } from '../../types'
import { archiveHabit, createHabit, listHabitLogs, listHabits, toggleHabitLog, updateHabit } from './habitApi'
import { shiftDate } from '../schedule/schedule.date'
import { weekday, weekDates, habitStreak, habitWeekProgress } from './habitRules'

const APP_TIMEZONE = 'Asia/Jakarta'
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function todayInAppTimezone() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: APP_TIMEZONE }).format(new Date())
}

export function HabitsView() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [name, setName] = useState('')
  const [targetDays, setTargetDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const today = todayInAppTimezone()
  const dates = useMemo(() => weekDates(today), [today])
  const logSet = useMemo(() => new Set(logs.map((log) => log.habitId + ':' + log.date)), [logs])
  const todayDue = useMemo(() => habits.filter((habit) => habit.targetDays.includes(weekday(today))), [habits, today])
  const todayComplete = useMemo(() => todayDue.filter((habit) => logSet.has(habit.id + ':' + today)), [todayDue, logSet, today])

  const refresh = async () => {
    const start = dates[0]
    const end = dates[dates.length - 1]
    const [nextHabits, nextLogs] = await Promise.all([listHabits(), listHabitLogs(shiftDate(start, -90), end)])
    setHabits(nextHabits)
    setLogs(nextLogs)
  }

  useEffect(() => {
    void refresh().catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load habits.'))
  }, [dates])

  const toggleDay = (day: number) => {
    setTargetDays((days) => days.includes(day) ? days.filter((value) => value !== day) : [...days, day].sort((a, b) => a - b))
  }

  const resetForm = () => {
    setName('')
    setTargetDays([1, 2, 3, 4, 5, 6, 7])
    setEditingId(null)
  }

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      if (editingId) {
        const next = await updateHabit(editingId, name, targetDays)
        setHabits((items) => items.map((habit) => habit.id === editingId ? next : habit))
        setNotice('Habit updated')
      } else {
        const next = await createHabit(name, targetDays)
        setHabits((items) => [...items, next])
        setNotice('Habit created')
      }
      resetForm()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save habit.')
    } finally {
      setBusy(false)
    }
  }

  const edit = (habit: Habit) => {
    setEditingId(habit.id)
    setName(habit.name)
    setTargetDays(habit.targetDays)
    setError('')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const archive = async (habit: Habit) => {
    if (!window.confirm('Archive "' + habit.name + '"? Your history will remain stored.')) return
    setBusy(true)
    setError('')
    try {
      await archiveHabit(habit.id)
      setHabits((items) => items.filter((item) => item.id !== habit.id))
      if (editingId === habit.id) resetForm()
      setNotice('Habit archived')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to archive habit.')
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (habit: Habit, date: string) => {
    if (date > today || !habit.targetDays.includes(weekday(date)) || busy) return
    const key = habit.id + ':' + date
    const completed = logSet.has(key)
    setBusy(true)
    setError('')
    setLogs((items) => completed ? items.filter((log) => !(log.habitId === habit.id && log.date === date)) : [...items, { habitId: habit.id, date }])
    try {
      await toggleHabitLog(habit.id, date, completed)
      setNotice(completed ? 'Habit check removed' : 'Habit completed')
    } catch (reason) {
      setLogs((items) => completed ? [...items, { habitId: habit.id, date }] : items.filter((log) => !(log.habitId === habit.id && log.date === date)))
      setError(reason instanceof Error ? reason.message : 'Unable to update habit.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="workspace page-enter">
      <WorkspaceHeader
        index="009"
        kicker="RHYTHM"
        title="Build your rhythm."
        description="Track repeatable habits without turning them into a pile of recurring tasks."
      />

      <section className="content-card habit-composer">
        <div className="card-heading">
          <div><span className="section-kicker">{editingId ? 'EDIT HABIT' : 'NEW HABIT'}</span><h3>{editingId ? 'Refine your routine' : 'Add a habit'}</h3></div>
          {editingId && <button className="text-button" type="button" onClick={resetForm}>Cancel edit</button>}
        </div>
        <div className="habit-compose-row">
          <input value={name} maxLength={80} disabled={busy} onChange={(event) => setName(event.target.value)} placeholder="e.g. Study Python" aria-label="Habit name" />
          <button className="primary-button" type="button" disabled={busy || !name.trim() || targetDays.length === 0} onClick={() => void submit()}>
            {busy ? 'Saving…' : editingId ? 'Save habit' : 'Add habit'}
          </button>
        </div>
        <div className="habit-days" aria-label="Habit target days">
          {dayNames.map((label, index) => {
            const day = index + 1
            return (
              <button key={day} className={targetDays.includes(day) ? 'habit-day is-selected' : 'habit-day'} type="button" disabled={busy} onClick={() => toggleDay(day)} aria-pressed={targetDays.includes(day)}>
                {label}
              </button>
            )
          })}
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        {notice && !error && <div className="auth-message is-success" role="status">{notice}</div>}
      </section>

      {habits.length === 0 ? (
        <section className="content-card empty-state habit-empty">
          <strong>No habits yet.</strong>
          <span>Create one above and your weekly rhythm will appear here.</span>
        </section>
      ) : (
        <section className="content-card habit-board">
          <div className="habit-week-header">
            <div>
              <span className="section-kicker">THIS WEEK</span>
              <strong>{dates[0]} → {dates[6]}</strong>
            </div>
            <div className="habit-week-summary">
              <span>Today</span>
              <strong>{todayComplete.length}/{todayDue.length}</strong>
              <small>due habits completed</small>
            </div>
            <div className="habit-week-days" aria-hidden="true">
              {dates.map((date, index) => <span key={date} className={date === today ? 'is-today' : ''}>{dayNames[index]}</span>)}
            </div>
          </div>

          <div className="habit-list">
            {habits.map((habit) => {
              const progress = habitWeekProgress(habit, logSet, dates, today)
              const streak = habitStreak(habit, logSet, today)
              return (
                <article className="habit-row" key={habit.id}>
                  <div className="habit-main">
                    <div>
                      <strong>{habit.name}</strong>
                      <small>{progress.complete}/{progress.due} due this week · {streak} day streak</small>
                    </div>
                    <div className="habit-row-actions">
                      <button className="text-button" type="button" disabled={busy} onClick={() => edit(habit)}>Edit</button>
                      <button className="text-button danger" type="button" disabled={busy} onClick={() => void archive(habit)}>Archive</button>
                    </div>
                  </div>

                  <div className="habit-week-grid">
                    {dates.map((date) => {
                      const due = habit.targetDays.includes(weekday(date))
                      const completed = logSet.has(habit.id + ':' + date)
                      const future = date > today
                      return (
                        <button
                          key={date}
                          className={'habit-check' + (completed ? ' is-done' : '') + (date === today ? ' is-today' : '') + (!due ? ' is-off' : '')}
                          type="button"
                          disabled={!due || future || busy}
                          onClick={() => void toggle(habit, date)}
                          aria-label={(completed ? 'Completed ' : 'Mark ') + habit.name + ' on ' + date}
                        >
                          {completed ? '✓' : due ? '·' : '–'}
                        </button>
                      )
                    })}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </section>
  )
}
