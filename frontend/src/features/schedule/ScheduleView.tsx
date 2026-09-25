import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../components/ui/EmptyState'
import { WorkspaceHeader } from '../../components/ui/WorkspaceHeader'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { formatDateLong, scheduleOccursOnDate, shiftDate } from './schedule.date'
import { normalizeScheduleList } from './schedule.migration'
import { ScheduleDetail } from './components/ScheduleDetail'
import { ScheduleForm } from './components/ScheduleForm'
import { ScheduleItemCard } from './components/ScheduleItemCard'
import { ScheduleToolbar } from './components/ScheduleToolbar'
import { GoogleCalendarIntegrationCard } from './components/GoogleCalendarIntegrationCard'
import { initialScheduleItems } from './schedule.data'
import { validateScheduleDraft } from './schedule.validation'
import { getReminderState } from './schedule.reminder'
import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from '../../integrations/calendar/calendarApi'
import { toGoogleCalendarEventPayload } from '../../integrations/calendar/googleCalendar'
import { getNotificationSupport, requestNotificationPermission, showNotification } from '../../integrations/notifications/browserNotification'
import type { ScheduleDraft, ScheduleItem, ScheduleType } from './schedule.types'

import { APP_TIMEZONE, getToday as getAppToday } from '../../lib/dateTime'


interface ScheduleViewProps {
  schedule: ScheduleItem[]
  onScheduleChange: (next: ScheduleItem[]) => void | Promise<void>
  demoMode?: boolean
}

export function ScheduleView({ schedule, onScheduleChange, demoMode = false }: ScheduleViewProps) {
  const [date, setDate] = useState(() => getAppToday(APP_TIMEZONE))
  const [filter, setFilter] = useState<ScheduleType | 'ALL'>('ALL')
  const [now, setNow] = useState(() => new Date())
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ScheduleItem>()
  const [detailItem, setDetailItem] = useState<ScheduleItem>()
  const [notificationSupport, setNotificationSupport] = useState(getNotificationSupport)
  const [confirmRequest, setConfirmRequest] = useState<{ kind: 'delete'; item: ScheduleItem } | { kind: 'reset' }>()
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [confirmError, setConfirmError] = useState('')

  const today = getAppToday(APP_TIMEZONE)
  const isToday = date === today
  const currentTimeLabel = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const normalizedSchedule = useMemo(() => normalizeScheduleList(schedule), [schedule])
  const flexiblePlans = useMemo(() => normalizedSchedule
    .filter((item) => item.activityMode === 'FLEXIBLE')
    .sort((a, b) => (a.activityDeadline ?? '9999-12-31').localeCompare(b.activityDeadline ?? '9999-12-31')),
  [normalizedSchedule])

  const visibleItems = useMemo(() => normalizedSchedule
    .filter((item) => scheduleOccursOnDate(item, date))
    .filter((item) => filter === 'ALL' || item.type === filter)
    .map((item) => ({ item: { ...item, date }, source: item }))
    .sort((a, b) => a.item.startTime.localeCompare(b.item.startTime)), [date, filter, normalizedSchedule])

  const openCreate = () => { setEditingItem(undefined); setFormOpen(true) }
  const openEdit = (item: ScheduleItem) => { setDetailItem(undefined); setEditingItem(item); setFormOpen(true) }

  const saveSchedule = async (draft: ScheduleDraft, editingId?: number) => {
    const result = validateScheduleDraft(draft, normalizedSchedule, editingId)
    if (!result.valid) return result.message

    if (editingId) {
      const next = normalizedSchedule.map((item) => item.id === editingId
        ? {
            ...item,
            ...draft,
            googleCalendar: item.googleCalendar.status === 'synced' || item.googleCalendar.status === 'error'
              ? { ...item.googleCalendar, status: 'pending' as const, error: undefined }
              : item.googleCalendar,
          }
        : item)
      await onScheduleChange(next)
    } else {
      await onScheduleChange([...normalizedSchedule, {
        ...draft,
        id: Date.now(),
        googleCalendar: { status: 'not-synced', calendarId: 'primary' },
      }])
    }

    return null
  }

  const requestDeleteSchedule = (item: ScheduleItem) => {
    setConfirmError('')
    setConfirmRequest({ kind: 'delete', item })
  }

  const deleteSchedule = async (item: ScheduleItem) => {
    if (item.googleCalendar.eventId) await deleteGoogleCalendarEvent(item, item.googleCalendar.eventId)
    await onScheduleChange(normalizedSchedule.filter((entry) => entry.id !== item.id))
  }

  const requestResetToSeed = () => {
    if (!demoMode) return
    setConfirmError('')
    setConfirmRequest({ kind: 'reset' })
  }

  const resetToSeed = async () => {
    if (!demoMode) return
    await onScheduleChange(initialScheduleItems)
  }

  const confirmScheduleAction = async () => {
    if (!confirmRequest) return
    setConfirmBusy(true)
    setConfirmError('')
    try {
      if (confirmRequest.kind === 'delete') await deleteSchedule(confirmRequest.item)
      else await resetToSeed()
      setConfirmRequest(undefined)
    } catch (reason) {
      setConfirmError(reason instanceof Error ? reason.message : 'The schedule action could not be completed.')
    } finally {
      setConfirmBusy(false)
    }
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

  const reminderCount = visibleItems.filter(({ item }) => item.reminderEnabled).length

  const notificationLabel = notificationSupport === 'granted'
    ? 'Notifications enabled'
    : notificationSupport === 'denied'
      ? 'Notifications blocked'
      : notificationSupport === 'unsupported'
        ? 'Notifications unavailable'
        : 'Notifications not enabled'

  const notificationDescription = notificationSupport === 'granted'
    ? 'Browser/device notifications are active while MiD-Daily is open. Connected Telegram or WhatsApp can provide background delivery.'
    : notificationSupport === 'denied'
      ? 'Permission is blocked. Enable notifications in the browser or device settings.'
      : notificationSupport === 'unsupported'
        ? 'This browser does not expose the required notification API.'
        : 'Allow notifications to receive Schedule reminders while MiD-Daily is running.'

  const syncSchedule = async (item: ScheduleItem) => {
    const pending = { ...item.googleCalendar, status: 'pending' as const, error: undefined }
    await onScheduleChange(normalizedSchedule.map((entry) => entry.id === item.id ? { ...entry, googleCalendar: pending } : entry))

    try {
      const event = toGoogleCalendarEventPayload(item)
      let result
      try {
        result = item.googleCalendar.eventId
          ? await updateGoogleCalendarEvent(item, item.googleCalendar.eventId, event)
          : await createGoogleCalendarEvent(item, event)
      } catch (reason) {
        if (item.googleCalendar.eventId && reason instanceof Error && 'status' in reason && (reason as { status?: unknown }).status === 404) {
          result = await createGoogleCalendarEvent(item, event)
        } else {
          throw reason
        }
      }

      await onScheduleChange(normalizedSchedule.map((entry) => entry.id === item.id ? {
        ...entry,
        googleCalendar: {
          ...entry.googleCalendar,
          status: 'synced',
          eventId: result.eventId,
          lastSyncedAt: new Date().toISOString(),
          error: undefined,
        },
      } : entry))
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Calendar sync failed.'
      await onScheduleChange(normalizedSchedule.map((entry) => entry.id === item.id ? {
        ...entry,
        googleCalendar: {
          ...entry.googleCalendar,
          status: 'error',
          error: message,
        },
      } : entry))
      throw reason
    }
  }

  return (
    <section className="workspace page-enter">
      <WorkspaceHeader
        index="002"
        kicker="RHYTHM"
        title="Schedule"
        description="Plan classes, work, study, and personal time in one place."
        action={(
          <div className="schedule-header-actions">
            {demoMode && <button className="secondary-button" type="button" onClick={requestResetToSeed}>Reset demo</button>}
            <button className="primary-button" type="button" onClick={openCreate}>Add activity</button>
          </div>
        )}
      />

      <ScheduleToolbar date={date} filter={filter} onShiftDate={(days) => setDate(shiftDate(date, days))} onResetDate={() => setDate(getAppToday(APP_TIMEZONE))} onFilterChange={setFilter} />

      <div className="schedule-date-caption">
        <div><strong>{formatDateLong(date)}</strong><span>{visibleItems.length} {visibleItems.length === 1 ? 'activity' : 'activities'}</span></div>
        <span>{reminderCount} reminder{reminderCount === 1 ? '' : 's'}</span>
      </div>

      {isToday && (
        <div className="schedule-now-strip" aria-label={'Current time ' + currentTimeLabel}>
          <span className="schedule-now-label">NOW</span>
          <strong>{currentTimeLabel}</strong>
          <i aria-hidden="true" />
          <span>live day marker</span>
        </div>
      )}

      <div className="content-card schedule-events-card">
        {visibleItems.length === 0
          ? <EmptyState title="Nothing scheduled" description="Try another date, clear the filter, or add a fixed activity." />
          : <div className="schedule-events">{visibleItems.map(({ item, source }, index) => (
            <ScheduleItemCard
              key={source.id + '-' + item.date}
              item={item}
              index={index}
              onView={() => setDetailItem(source)}
              onEdit={() => openEdit(source)}
              onSync={() => syncSchedule(source)}
              onDelete={() => requestDeleteSchedule(source)}
            />
          ))}</div>}
      </div>

      {flexiblePlans.length > 0 && (
        <section className="content-card flexible-plans-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Flexible</span>
              <h3>Plans without fixed slots</h3>
            </div>
            <span className="card-meta">{flexiblePlans.length} plan{flexiblePlans.length === 1 ? '' : 's'}</span>
          </div>
          <div className="flexible-plan-list">
            {flexiblePlans.map((item) => (
              <article className="flexible-plan" key={item.id}>
                <button className="flexible-plan-main" type="button" onClick={() => setDetailItem(item)}>
                  <strong>{item.title}</strong>
                  <span>{item.targetCount} session{item.targetCount === 1 ? '' : 's'} · {item.targetPeriod?.toLowerCase()} · {item.durationMinutes} min each</span>
                </button>
                <div className="flexible-plan-meta">
                  <span>{item.preferredStartTime && item.preferredEndTime ? item.preferredStartTime + '–' + item.preferredEndTime : 'Any suitable time'}</span>
                  {item.activityDeadline && <span>due {item.activityDeadline}</span>}
                </div>
                <button className="text-button" type="button" onClick={() => openEdit(item)}>Edit</button>
              </article>
            ))}
          </div>
        </section>
      )}

      <details className="secondary-panel">
        <summary>Connections &amp; notifications</summary>
        <div className="schedule-integrations">
          <GoogleCalendarIntegrationCard />

          <div className="notification-card schedule-integration-card">
            <div className="notification-copy">
              <span className="integration-label">Device notifications</span>
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
        </div>
      </details>

      <ScheduleForm open={formOpen} initialItem={editingItem} defaultDate={date} onClose={() => setFormOpen(false)} onSubmit={saveSchedule} />
      <ScheduleDetail item={detailItem} onClose={() => setDetailItem(undefined)} onEdit={openEdit} onSync={syncSchedule} />
      <ConfirmDialog
        open={Boolean(confirmRequest)}
        eyebrow="SCHEDULE"
        title={confirmRequest?.kind === 'reset' ? 'Reset the demo schedule?' : 'Delete this activity?'}
        description={
          (confirmRequest?.kind === 'reset'
            ? 'Starter activities will replace the current demo schedule. This is intended only for demo data.'
            : confirmRequest
              ? '“' + confirmRequest.item.title + '” will be removed. Its Google Calendar event will be removed too when linked.'
              : '') + (confirmError ? ' ' + confirmError : '')
        }
        confirmLabel={confirmRequest?.kind === 'reset' ? 'Reset schedule' : 'Delete activity'}
        tone="danger"
        busy={confirmBusy}
        onCancel={() => setConfirmRequest(undefined)}
        onConfirm={confirmScheduleAction}
      />
    </section>
  )
}
