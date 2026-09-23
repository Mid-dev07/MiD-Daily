import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { Task } from '../../../types'

interface FocusModeProps {
  tasks: Task[]
  onToggleTask: (id: number) => void
}

const FOCUS_SECONDS = 25 * 60

export function FocusMode({ tasks, onToggleTask }: FocusModeProps) {
  const focusable = useMemo(() => tasks.filter((task) => task.status !== 'done').slice(0, 8), [tasks])
  const [selectedId, setSelectedId] = useState<number | null>(focusable[0]?.id ?? null)
  const [seconds, setSeconds] = useState(FOCUS_SECONDS)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (selectedId === null && focusable[0]) setSelectedId(focusable[0].id)
    if (selectedId !== null && !focusable.some((task) => task.id === selectedId)) setSelectedId(focusable[0]?.id ?? null)
  }, [focusable, selectedId])

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          setRunning(false)
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running])

  const selected = focusable.find((task) => task.id === selectedId)
  const reset = () => {
    setRunning(false)
    setSeconds(FOCUS_SECONDS)
  }
  const complete = () => {
    if (!selected) return
    onToggleTask(selected.id)
    setRunning(false)
    setSeconds(FOCUS_SECONDS)
  }
  const minutes = Math.floor(seconds / 60)
  const remainder = String(seconds % 60).padStart(2, '0')
  const progress = ((FOCUS_SECONDS - seconds) / FOCUS_SECONDS) * 100

  return (
    <section className="content-card focus-mode-card">
      <div className="card-heading">
        <div><span className="section-kicker">FOCUS MODE</span><h3>One thing, 25 minutes.</h3></div>
        <span className="card-meta">{selected ? selected.category : 'No open task'}</span>
      </div>
      {selected ? (
        <>
          <div className="focus-task-select">
            <select value={selected.id} onChange={(event) => { setSelectedId(Number(event.target.value)); reset() }} aria-label="Choose focus task">
              {focusable.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
            </select>
          </div>
          <div className="focus-timer" style={{ '--focus-progress': progress + '%' } as CSSProperties} aria-live="polite">
            <strong>{minutes}:{remainder}</strong>
            <span>{seconds === 0 ? 'Session complete' : running ? 'Stay with this task.' : 'Ready when you are.'}</span>
          </div>
          <div className="focus-actions">
            <button className="primary-button" type="button" onClick={() => setRunning((value) => !value)}>{running ? 'Pause' : seconds === 0 ? 'Restart' : 'Start focus'}</button>
            <button className="secondary-button" type="button" onClick={complete}>Mark complete</button>
            <button className="text-button" type="button" onClick={reset}>Reset</button>
          </div>
        </>
      ) : (
        <div className="empty-state"><strong>Your task queue is clear.</strong><span>Nothing needs a focus session right now.</span></div>
      )}
    </section>
  )
}
