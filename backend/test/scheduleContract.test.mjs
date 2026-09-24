import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeScheduleWrite } from '../dist/scheduleStore.js'

test('flexible schedules persist without fixed time slots', () => {
  const result = normalizeScheduleWrite({
    title: 'Study',
    type: 'STUDY',
    activityMode: 'FLEXIBLE',
    date: '2026-09-24',
    startTime: '',
    endTime: '',
    location: '',
    notes: '',
    reminderEnabled: false,
    reminderOffset: 15,
    recurrence: { frequency: 'NONE', interval: 1 },
    targetCount: 3,
    targetPeriod: 'WEEK',
    durationMinutes: 45,
    preferredStartTime: '18:00',
    preferredEndTime: '21:00',
    activityDeadline: '2026-09-30',
    googleCalendar: { status: 'not-synced', calendarId: 'primary' },
  })

  assert.equal(result.start_time, null)
  assert.equal(result.end_time, null)
  assert.equal(result.activity_mode, 'FLEXIBLE')
  assert.equal(result.target_count, 3)
  assert.equal(result.duration_minutes, 45)
})

test('fixed schedules preserve their explicit time slots', () => {
  const result = normalizeScheduleWrite({
    title: 'Class',
    type: 'CLASS',
    activityMode: 'FIXED',
    date: '2026-09-24',
    startTime: '08:00',
    endTime: '10:00',
  })

  assert.equal(result.start_time, '08:00')
  assert.equal(result.end_time, '10:00')
  assert.equal(result.activity_mode, 'FIXED')
})
