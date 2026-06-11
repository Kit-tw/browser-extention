import React from 'react'
import { useSettings } from '../../hooks/useSettings'
import { daysUntilDue, dateToDisplay, formatDDMMYYYY } from '../../utils/reminders'
import type { Reminder } from '../../types/reminder.types'

function ReminderRow({ reminder, onMarkPaid, warnWithinDays }: { reminder: Reminder; onMarkPaid: () => void; warnWithinDays: number }) {
  const today = dateToDisplay(new Date())
  const days = daysUntilDue(reminder, today)
  const isOverdue = days < 0
  const isToday = days === 0
  const isWarning = !isOverdue && days <= warnWithinDays

  let daysLabel: string
  if (isOverdue) daysLabel = `Overdue · ${Math.abs(days)} d`
  else if (isToday) daysLabel = 'Due today'
  else daysLabel = `${days} d`

  let pillClass: string
  if (isOverdue) pillClass = 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
  else if (isToday || isWarning) pillClass = 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
  else pillClass = 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'

  return (
    <div className="flex items-center gap-2 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{reminder.name}</span>
          <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${pillClass}`}>
            {daysLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
            {formatDDMMYYYY(reminder.nextDueDate)}
          </span>
          {reminder.amount && (
            <span className="text-xs text-gray-400 dark:text-gray-500">· {reminder.amount}</span>
          )}
        </div>
      </div>
      <button
        onClick={onMarkPaid}
        className="shrink-0 text-xs px-2 py-1 rounded border
          border-emerald-400 dark:border-emerald-600
          text-emerald-600 dark:text-emerald-400
          hover:bg-emerald-50 dark:hover:bg-emerald-900/20
          transition-colors"
      >
        Mark Paid
      </button>
    </div>
  )
}

export function RemindersWidget() {
  const { reminders, markReminderPaid, dashboard } = useSettings()
  const warnWithinDays = dashboard.notificationSchedule.warnWithinDays
  const today = dateToDisplay(new Date())

  if (!reminders || reminders.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
        No reminders. Add one in Settings → Reminders.
      </p>
    )
  }

  const overdue = reminders
    .filter((r) => daysUntilDue(r, today) < 0)
    .sort((a, b) => daysUntilDue(a, today) - daysUntilDue(b, today))

  const upcoming = reminders
    .filter((r) => daysUntilDue(r, today) >= 0)
    .sort((a, b) => daysUntilDue(a, today) - daysUntilDue(b, today))

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
      {overdue.map((r) => (
        <ReminderRow key={r.id} reminder={r} onMarkPaid={() => markReminderPaid(r.id)} warnWithinDays={warnWithinDays} />
      ))}
      {upcoming.map((r) => (
        <ReminderRow key={r.id} reminder={r} onMarkPaid={() => markReminderPaid(r.id)} warnWithinDays={warnWithinDays} />
      ))}
    </div>
  )
}
