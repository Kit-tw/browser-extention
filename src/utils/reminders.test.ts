import { describe, it, expect } from 'vitest'
import { advanceDueDate, getDueReminders } from './reminders'
import type { Reminder } from '../types/reminder.types'

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: '1',
    name: 'Test',
    type: 'subscription',
    billingCycle: { unit: 'monthly' },
    dueDateModel: { kind: 'fixed-day', dayOfCycle: 15 },
    nextDueDate: '15-06-2026',
    ...overrides,
  }
}

// ── advanceDueDate ───────────────────────────────────────────────────────────

describe('advanceDueDate', () => {
  it('advances a monthly reminder by 1 month', () => {
    const reminder = makeReminder({ billingCycle: { unit: 'monthly' }, nextDueDate: '15-06-2026' })
    expect(advanceDueDate(reminder)).toBe('15-07-2026')
  })

  it('advances a yearly reminder by 1 year', () => {
    const reminder = makeReminder({ billingCycle: { unit: 'yearly' }, nextDueDate: '15-06-2026' })
    expect(advanceDueDate(reminder)).toBe('15-06-2027')
  })

  it('advances a weekly reminder by 7 days', () => {
    const reminder = makeReminder({ billingCycle: { unit: 'weekly' }, nextDueDate: '15-06-2026' })
    expect(advanceDueDate(reminder)).toBe('22-06-2026')
  })

  it('advances an every-n-days reminder by n days', () => {
    const reminder = makeReminder({ billingCycle: { unit: 'every-n-days', n: 30 }, nextDueDate: '15-06-2026' })
    expect(advanceDueDate(reminder)).toBe('15-07-2026')
  })

  it('clamps month-end overflow — Jan 31 monthly → Feb 28', () => {
    const reminder = makeReminder({ billingCycle: { unit: 'monthly' }, nextDueDate: '31-01-2026' })
    expect(advanceDueDate(reminder)).toBe('28-02-2026')
  })
})

// ── getDueReminders ──────────────────────────────────────────────────────────

describe('getDueReminders', () => {
  it('includes a reminder due within the threshold', () => {
    const reminder = makeReminder({ nextDueDate: '12-06-2026' })
    const result = getDueReminders([reminder], '09-06-2026', 7)
    expect(result).toContain(reminder)
  })

  it('excludes a reminder outside the threshold', () => {
    const reminder = makeReminder({ nextDueDate: '23-06-2026' })
    const result = getDueReminders([reminder], '09-06-2026', 7)
    expect(result).not.toContain(reminder)
  })

  it('includes an overdue reminder', () => {
    const reminder = makeReminder({ nextDueDate: '08-06-2026' })
    const result = getDueReminders([reminder], '09-06-2026', 7)
    expect(result).toContain(reminder)
  })

  it('returns empty for an empty list', () => {
    expect(getDueReminders([], '09-06-2026', 7)).toEqual([])
  })
})
