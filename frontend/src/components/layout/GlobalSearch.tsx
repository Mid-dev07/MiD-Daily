import { useEffect, useMemo, useRef, useState } from 'react'
import type { FinanceEntry, Task, View } from '../../types'
import type { ScheduleItem } from '../schedule/schedule.types'
import { scheduleOccursOnDate } from '../schedule/schedule.date'
import { currency, formatDate } from '../../lib/format'

interface GlobalSearchProps {
  tasks: Task[]
  finance: FinanceEntry[]
  schedule: ScheduleItem[]
  onNavigate: (view: View) => void
  onClose: () => void
}

type SearchResult = {
  id: string
  type: 'Task' | 'Finance' | 'Schedule'
  title: string
  meta: string
  view: 'tasks' | 'finance' | 'schedule'
}

const APP_TIMEZONE = 'Asia/Jakarta'

function today() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: APP_TIMEZONE }).format(new Date())
}

export function GlobalSearch({ tasks, finance, schedule, onNavigate, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const todayValue = today()

  useEffect(() => {
    inputRef.current?.focus()
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const results = useMemo<SearchResult[]>(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      const nextSchedule = schedule
        .filter((item) => scheduleOccursOnDate(item, todayValue))
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .slice(0, 5)
        .map((item) => ({
          id: 'schedule-' + item.id,
          type: 'Schedule' as const,
          title: item.title,
          meta: (item.startTime || 'Flexible') + (item.location ? ' · ' + item.location : ''),
          view: 'schedule' as const,
        }))
      const focusTasks = tasks
        .filter((task) => task.status !== 'done')
        .slice(0, 5)
        .map((task) => ({
          id: 'task-' + task.id,
          type: 'Task' as const,
          title: task.title,
          meta: task.category + (task.dueDate ? ' · due ' + task.dueDate : ''),
          view: 'tasks' as const,
        }))
      return [...nextSchedule, ...focusTasks].slice(0, 10)
    }

    const matches: SearchResult[] = []
    for (const task of tasks) {
      const haystack = [task.title, task.category, task.notes ?? '', task.priority, task.status].join(' ').toLowerCase()
      if (haystack.includes(normalized)) {
        matches.push({
          id: 'task-' + task.id,
          type: 'Task',
          title: task.title,
          meta: task.category + (task.dueDate ? ' · due ' + task.dueDate : ''),
          view: 'tasks',
        })
      }
    }
    for (const entry of finance) {
      const haystack = [entry.title, entry.category, entry.notes ?? '', entry.type].join(' ').toLowerCase()
      if (haystack.includes(normalized)) {
        matches.push({
          id: 'finance-' + entry.id,
          type: 'Finance',
          title: entry.title,
          meta: entry.category + ' · ' + currency.format(entry.amount) + ' · ' + entry.date,
          view: 'finance',
        })
      }
    }
    for (const item of schedule) {
      const haystack = [item.title, item.type, item.location, item.notes].join(' ').toLowerCase()
      if (haystack.includes(normalized)) {
        matches.push({
          id: 'schedule-' + item.id,
          type: 'Schedule',
          title: item.title,
          meta: item.activityMode === 'FLEXIBLE' ? 'Flexible · ' + formatDate(item.date) : formatDate(item.date) + ' · ' + item.startTime,
          view: 'schedule',
        })
      }
    }
    return matches.slice(0, 12)
  }, [finance, query, schedule, tasks, todayValue])

  const openResult = (result: SearchResult) => {
    onNavigate(result.view)
    onClose()
  }

  return (
    <div className="modal-backdrop search-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="global-search-dialog" role="dialog" aria-modal="true" aria-labelledby="global-search-title">
        <div className="global-search-header">
          <div>
            <span className="section-kicker">COMMAND CENTER</span>
            <h2 id="global-search-title">Search MiD-Daily</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close search">×</button>
        </div>

        <div className="global-search-input-wrap">
          <span aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks, expenses, schedule…"
            aria-label="Search workspace"
          />
          <kbd>ESC</kbd>
        </div>

        <div className="global-search-results" aria-live="polite">
          {results.length ? results.map((result) => (
            <button className="global-search-result" type="button" key={result.id} onClick={() => openResult(result)}>
              <span className="global-search-type">{result.type}</span>
              <span className="global-search-copy"><strong>{result.title}</strong><small>{result.meta}</small></span>
              <span className="global-search-arrow" aria-hidden="true">→</span>
            </button>
          )) : (
            <div className="empty-state"><strong>No matches.</strong><span>Try another keyword or open a module directly.</span></div>
          )}
        </div>

        <div className="global-search-footer">
          <span>Tip</span>
          <span>Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> anytime to open search.</span>
        </div>
      </section>
    </div>
  )
}
