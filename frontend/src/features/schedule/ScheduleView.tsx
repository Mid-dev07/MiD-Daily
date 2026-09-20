import { useMemo, useState } from 'react'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatDateLong, shiftDate } from './schedule.date'
import { normalizeScheduleList } from './schedule.migration'
import { ScheduleDetail } from './components/ScheduleDetail'
import { ScheduleForm } from './components/ScheduleForm'
import { ScheduleItemCard } from './components/ScheduleItemCard'
import { ScheduleToolbar } from './components/ScheduleToolbar'
import { initialScheduleItems } from './schedule.data'
import { validateScheduleDraft } from './schedule.validation'
import { getReminderState } from './schedule.reminder'
import { getNotificationSupport, requestNotificationPermission, showNotification } from '../../integrations/notifications/browserNotification'
import type { ScheduleDraft, ScheduleItem, ScheduleType } from './schedule.types'

const getToday = () => new Intl.DateTimeFormat('sv-SE').format(new Date())

interface ScheduleViewProps {
  schedule: ScheduleItem[]
  onScheduleChange: (next: ScheduleItem[]) => void
}

export function ScheduleView({ schedule, onScheduleChange }: ScheduleViewProps) {
  const [date, setDate] = useState(getToday)
  const [filter, setFilter] = useState<ScheduleType | 'ALL'>('ALL')
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ScheduleItem>()
  const [detailItem, setDetailItem] = useState<ScheduleItem>()
  const [notificationSupport, setNotificationSupport] = useState(getNotificationSupport)

  const normalizedSchedule = useMemo(() => normalizeScheduleList(schedule), [schedule])
  const visibleItems = useMemo(() => normalizedSchedule
    .filter((item) => item.date === date)
    .filter((item) => filter === 'ALL' || item.type === filter)
    .sort((a, b) => a.startTime.localeCompare(b.startTime)), [date, filter, normalizedSchedule])

  const openCreate = () => { setEditingItem(undefined); setFormOpen(true) }
  const openEdit = (item: ScheduleItem) => { setDetailItem(undefined); setEditingItem(item); setFormOpen(true) }

  const saveSchedule = (draft: ScheduleDraft, editingId?: number) => {
    const result = validateScheduleDraft(draft, normalizedSchedule, editingId)
    if (!result.valid) return result.message

    if (editingId) {
      onScheduleChange(normalizedSchedule.map((item) => item.id === editingId ? { ...item, ...draft } : item))
    } else {
      onScheduleChange([...normalizedSchedule, { ...draft, id: Date.now(), googleCalendarConnected: false }])
    }
    return null
  }

  const deleteSchedule = (id: number) => {
    const item = normalizedSchedule.find((entry) => entry.id === id)
    if (!item || !window.confirm('Delete “' + item.title + '”?')) return
    onScheduleChange(normalizedSchedule.filter((entry) => entry.id !== id))
  }

  const resetToSeed = () => {
    if (!window.confirm('Reset schedule to the starter activities?')) return
    onScheduleChange(initialScheduleItems)
  }

  const enableNotifications = async () => {
    const permission = await requestNotificationPermission()
    setNotificationSupport(permission)

    if (permission === 'granted') {
      await showNotification('MiD-Daily • Notifications enabled', {
        body: 'Schedule reminders are ready.',
        tag: 'mid-daily.notification-test',
        data: { type: 'notification-test', url: '/' },
      })
    }
  }

  const reminderCount = visibleItems.filter((item) => getReminderState(item, new Date()).status === 'scheduled').length

  const notificationLabel = notificationSupport === 'granted'
    ? 'Notifications enabled'
    : notificationSupport === 'denied'
      ? 'Notifications blocked'
      : notificationSupport === 'unsupported'
        ? 'Notifications unavailable'
        : 'Notifications not enabled'

  const notificationDescription = notificationSupport === 'granted'
    ? 'Browser/device notifications are active. Background delivery will be strengthened by the PWA/native layer later.'
    : notificationSupport === 'denied'
      ? 'Permission is blocked. Enable notifications in the browser or device settings.'
      : notificationSupport === 'unsupported'
        ? 'This browser does not expose the required notification API.'
        : 'Allow notifications to receive Schedule reminders while MiD-Daily is running.'

  return (
    <section className="workspace page-enter">
      <div className="page-intro schedule-intro">
        <div><span className="section-kicker">AGENDA</span><h2>Make time visible.</h2><p>One flexible schedule for classes, work, study, appointments, and everything in between.</p></div>
        <div className="schedule-header-actions"><button className="secondary-button" type="button" onClick={resetToSeed}>Reset demo</button><button className="primary-button" type="button" onClick={openCreate}>+ Add activity</button></div>
      </div>

      <ScheduleToolbar date={date} filter={filter} onShiftDate={(days) => setDate(shiftDate(date, days))} onResetDate={() => setDate(getToday())} onFilterChange={setFilter} />

      <div className="notification-card schedule-integration-card">
        <div className="notification-copy">
          <span className="integration-label">DEVICE NOTIFICATIONS</span>
          <strong className={notificationSupport === 'granted' ? 'notification-status' : ''}>{notificationLabel}</strong>
          <span>{notificationDescription}</span>
        </div>
        <div className="notification-actions">
          {notificationSupport === 'granted' ? (
            <button className="secondary-button" type="button" onClick={() => void showNotification('MiD-Daily • Test reminder', { body: 'Your notification channel is working.', tag: 'mid-daily.notification-test', data: { url: '/' } })}>Test</button>
          ) : (
            <button className="secondary-button" type="button" disabled={notificationSupport === 'unsupported' || notificationSupport === 'denied'} onClick={() => void enableNotifications()}>Enable</button>
          )}
        </div>
      </div>

      <div className="schedule-date-caption"><strong>{formatDateLong(date)}</strong><span>{visibleItems.length} {visibleItems.length === 1 ? 'activity' : 'activities'} visible</span></div>
      <div className="schedule-summary"><span>Reminder engine active.</span><span>•</span><span>{reminderCount} reminder {reminderCount === 1 ? 'is' : 'are'} scheduled for this date.</span></div>

      <div className="content-card schedule-events-card">
        {visibleItems.length === 0 ? <EmptyState title="Nothing scheduled" description="Choose another date, clear the filter, or add a new activity." /> : <div className="schedule-events">{visibleItems.map((item, index) => <ScheduleItemCard key={item.id} item={item} index={index} onView={setDetailItem} onEdit={openEdit} onDelete={deleteSchedule} />)}</div>}
      </div>

      <ScheduleForm open={formOpen} initialItem={editingItem} defaultDate={date} onClose={() => setFormOpen(false)} onSubmit={saveSchedule} />
      <ScheduleDetail item={detailItem} onClose={() => setDetailItem(undefined)} onEdit={openEdit} />
    </section>
  )
}
