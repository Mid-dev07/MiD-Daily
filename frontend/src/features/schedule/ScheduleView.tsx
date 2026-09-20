import { useMemo, useState } from 'react'
import { EmptyState } from '../../components/ui/EmptyState'
import { ScheduleDetail } from './components/ScheduleDetail'
import { ScheduleForm } from './components/ScheduleForm'
import { ScheduleItemCard } from './components/ScheduleItemCard'
import { ScheduleToolbar } from './components/ScheduleToolbar'
import { initialScheduleItems } from './schedule.data'
import { validateScheduleDraft } from './schedule.validation'
import type { ScheduleDraft, ScheduleItem, ScheduleType } from './schedule.types'

const today = '2026-09-20'

interface ScheduleViewProps {
  schedule: ScheduleItem[]
  onScheduleChange: (next: ScheduleItem[]) => void
}

export function ScheduleView({ schedule, onScheduleChange }: ScheduleViewProps) {
  const [date, setDate] = useState(today)
  const [filter, setFilter] = useState<ScheduleType | 'ALL'>('ALL')
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ScheduleItem>()
  const [detailItem, setDetailItem] = useState<ScheduleItem>()

  const visibleItems = useMemo(() => schedule
    .filter((item) => item.date === date)
    .filter((item) => filter === 'ALL' || item.type === filter)
    .sort((a, b) => a.startTime.localeCompare(b.startTime)), [date, filter, schedule])

  const shiftDate = (days: number) => {
    const [year, month, day] = date.split('-').map(Number)
    const next = new Date(year, month - 1, day)
    next.setDate(next.getDate() + days)
    setDate(next.toISOString().slice(0, 10))
  }

  const openCreate = () => { setEditingItem(undefined); setFormOpen(true) }
  const openEdit = (item: ScheduleItem) => { setDetailItem(undefined); setEditingItem(item); setFormOpen(true) }

  const saveSchedule = (draft: ScheduleDraft, editingId?: number) => {
    const result = validateScheduleDraft(draft, schedule, editingId)
    if (!result.valid) return result.message

    if (editingId) {
      onScheduleChange(schedule.map((item) => item.id === editingId ? { ...item, ...draft } : item))
    } else {
      onScheduleChange([...schedule, { ...draft, id: Date.now(), googleCalendarConnected: false }])
    }
    return null
  }

  const deleteSchedule = (id: number) => {
    const item = schedule.find((entry) => entry.id === id)
    if (!item) return
    if (!window.confirm(`Delete “${item.title}”?`)) return
    onScheduleChange(schedule.filter((entry) => entry.id !== id))
  }

  const resetToSeed = () => {
    if (!window.confirm('Reset schedule to the starter activities?')) return
    onScheduleChange(initialScheduleItems)
  }

  return (
    <section className="workspace page-enter">
      <div className="page-intro schedule-intro">
        <div><span className="section-kicker">AGENDA</span><h2>Make time visible.</h2><p>One flexible schedule for classes, work, study, appointments, and everything in between.</p></div>
        <div className="schedule-header-actions">
          <button className="secondary-button" type="button" onClick={resetToSeed}>Reset demo</button>
          <button className="primary-button" type="button" onClick={openCreate}>+ Add activity</button>
        </div>
      </div>

      <ScheduleToolbar date={date} filter={filter} onShiftDate={shiftDate} onResetDate={() => setDate(today)} onFilterChange={setFilter} />
      <div className="schedule-summary"><span>{visibleItems.length} {visibleItems.length === 1 ? 'activity' : 'activities'}</span><span>•</span><span>Local persistence active. Native reminder and Google Calendar layers come later.</span></div>

      <div className="content-card schedule-events-card">
        {visibleItems.length === 0 ? <EmptyState title="Nothing scheduled" description="Choose another date, clear the filter, or add a new activity." /> : <div className="schedule-events">{visibleItems.map((item, index) => <ScheduleItemCard key={item.id} item={item} index={index} onView={setDetailItem} onEdit={openEdit} onDelete={deleteSchedule} />)}</div>}
      </div>

      <ScheduleForm open={formOpen} initialItem={editingItem} defaultDate={date} onClose={() => setFormOpen(false)} onSubmit={saveSchedule} />
      <ScheduleDetail item={detailItem} onClose={() => setDetailItem(undefined)} onEdit={openEdit} />
    </section>
  )
}
