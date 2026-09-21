import assert from 'node:assert/strict'
import test from 'node:test'
import { addDays, addMonths, occursOnDate, reminderIsDue, triggerWallClock, wallClockParts } from '../dist/backgroundReminderRules.js'

test('daily recurrence matches exact interval', () => {
  const item = { event_date: '2026-09-01', recurrence: { frequency: 'DAILY', interval: 2 } }
  assert.equal(occursOnDate(item, '2026-09-03'), true)
  assert.equal(occursOnDate(item, '2026-09-04'), false)
})

test('weekly recurrence respects interval', () => {
  const item = { event_date: '2026-09-01', recurrence: { frequency: 'WEEKLY', interval: 2 } }
  assert.equal(occursOnDate(item, '2026-09-15'), true)
  assert.equal(occursOnDate(item, '2026-09-08'), false)
})

test('monthly recurrence clamps dates like the frontend scheduler', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28')
  const item = { event_date: '2026-01-31', recurrence: { frequency: 'MONTHLY', interval: 1 } }
  assert.equal(occursOnDate(item, '2026-02-28'), true)
})

test('repeat-until excludes dates after the rule', () => {
  const item = { event_date: '2026-09-01', recurrence: { frequency: 'DAILY', interval: 1, until: '2026-09-03' } }
  assert.equal(occursOnDate(item, '2026-09-03'), true)
  assert.equal(occursOnDate(item, '2026-09-04'), false)
})

test('one hour reminder can cross to the previous day', () => {
  assert.deepEqual(triggerWallClock('2026-09-22', '00:15', 60), { date: '2026-09-21', time: '23:15' })
})

test('reminder due window accepts current minute and short late delivery', () => {
  assert.equal(reminderIsDue({ date: '2026-09-21', time: '10:15' }, { date: '2026-09-21', time: '10:15' }), true)
  assert.equal(reminderIsDue({ date: '2026-09-21', time: '10:15' }, { date: '2026-09-21', time: '10:17' }), true)
  assert.equal(reminderIsDue({ date: '2026-09-21', time: '10:15' }, { date: '2026-09-21', time: '10:18' }), false)
})

test('wall clock conversion honors application timezone', () => {
  const parts = wallClockParts(new Date('2026-09-21T10:00:00.000Z'), 'Asia/Jakarta')
  assert.deepEqual(parts, { date: '2026-09-21', time: '17:00' })
})

test('day arithmetic is stable around month and year boundaries', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01')
})
