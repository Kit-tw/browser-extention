import type { Reminder } from '../types/reminder.types'

function parseDate(ddmmyyyy: string): Date {
  const [day, month, year] = ddmmyyyy.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Returns a Date clamped to the last day of the target month when the day overflows (e.g. Jan 31 + 1 month → Feb 28).
function clampToMonth(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(day, lastDay))
}

function toDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

export function advanceDueDate(reminder: Reminder): string {
  const d = parseDate(reminder.nextDueDate)
  const cycle = reminder.billingCycle

  if (cycle.unit === 'monthly') {
    return toDate(clampToMonth(d.getFullYear(), d.getMonth() + 1, d.getDate()))
  }
  if (cycle.unit === 'yearly') {
    return toDate(clampToMonth(d.getFullYear() + 1, d.getMonth(), d.getDate()))
  }
  if (cycle.unit === 'weekly') {
    return toDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7))
  }
  if (cycle.unit === 'every-n-days') {
    return toDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + cycle.n))
  }

  throw new Error(`Unhandled billing cycle: ${(cycle as { unit: string }).unit}`)
}

export function daysUntilDue(reminder: Reminder, today: string): number {
  const todayDate = parseDate(today)
  const due = parseDate(reminder.nextDueDate)
  return Math.floor((due.getTime() - todayDate.getTime()) / 86_400_000)
}

export function dateToDisplay(d: Date): string {
  return toDate(d)
}

export function formatDDMMYYYY(ddmmyyyy: string): string {
  return ddmmyyyy.replace(/-/g, '/')
}

export function getDueReminders(
  reminders: Reminder[],
  today: string,
  warnWithinDays: number,
): Reminder[] {
  const todayDate = parseDate(today)
  return reminders.filter((r) => {
    const due = parseDate(r.nextDueDate)
    const daysUntil = Math.floor((due.getTime() - todayDate.getTime()) / 86_400_000)
    return daysUntil <= warnWithinDays
  })
}
