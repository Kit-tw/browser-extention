# PRD: Reminders Widget

## Problem Statement

As a developer and freelancer managing multiple recurring financial obligations — SaaS subscriptions, credit card payments, house rent — I have no single place to track what's due and when. Bills get missed because reminders live in separate apps or phone calendars that are easy to ignore. I open a new tab dozens of times a day; that moment of attention should surface what needs action.

## Solution

A **Reminders widget** on the new tab dashboard that tracks subscriptions and payments, shows countdowns to due dates, fires browser notifications at configured times, and requires manual confirmation each cycle so nothing silently rolls over.

## User Stories

1. As a user, I want to add a Subscription reminder (e.g., Claude Code) with a name, optional amount, billing cycle, and due date, so that I can track recurring charges from my new tab page.
2. As a user, I want to add a Payment reminder (e.g., credit card, house rent) with a name, optional amount, billing cycle, and due date model, so that I can track manual payments I must make each cycle.
3. As a user, I want to choose a **Fixed Due Day** due date model (e.g., the 15th of every month) when creating a reminder, so that calendar-aligned bills like rent are tracked accurately.
4. As a user, I want to choose a **Billing Offset** due date model (e.g., 45 days after the 1st of each month) when creating a reminder, so that credit cards with statement-close and payment-due offsets are tracked correctly.
5. As a user, I want to set the billing cycle to monthly, yearly, weekly, or every N days, so that reminders with non-standard recurrence (e.g., a 30-day trial) are supported.
6. As a user, I want the optional amount field on a reminder, so that fixed-cost subscriptions show their cost at a glance while variable bills (like credit cards) are not forced to show a misleading fixed number.
7. As a user, I want to see upcoming reminders in the widget as "Name · N days", so that I can assess urgency without reading a full date.
8. As a user, I want overdue reminders to float to the top of the widget with a red badge, so that missed payments are impossible to overlook.
9. As a user, I want a "Mark Paid" button on each overdue and upcoming reminder in the widget, so that I can confirm payment in one click without leaving the new tab page.
10. As a user, I want clicking "Mark Paid" to advance the reminder's due date by one billing cycle, so that the reminder reappears automatically next cycle without me re-entering anything.
11. As a user, I want an unpaid reminder to remain overdue and keep surfacing across cycles, so that I am never silently let off the hook — if I didn't pay last month's credit card, this month's reminder still shows alongside the overdue one.
12. As a user, I want to receive browser push notifications when reminders are due within my configured threshold, so that I am alerted even on days I don't open a new tab.
13. As a user, I want to configure multiple daily notification fire times (e.g., 9:00 AM and 6:00 PM), so that reminders surface at moments that fit my schedule.
14. As a user, I want to configure a "warn within N days" threshold, so that I control how far in advance I start receiving reminders.
15. As a user, I want to add, edit, and delete reminders from the Settings panel, so that reminder management is consistent with how other accounts and settings are handled in the extension.
16. As a user, I want to enable or disable the Reminders widget from the Settings panel, so that I can hide it if I don't need it.
17. As a user, I want the Reminders widget to be draggable and positionable on the dashboard like all other widgets, so that I can arrange my dashboard layout freely.
18. As a user, I want reminders to persist across browser restarts, so that I don't have to re-enter them after closing Chrome.
19. As a user, I want the widget to clearly distinguish between a Subscription type and a Payment type with a label or icon, so that I can scan the list and understand what each item requires of me.
20. As a user, I want to collapse the Reminders widget, so that I can hide it when there is nothing urgent without removing it from the dashboard.

## Implementation Decisions

### Data model

A new `Reminder` type is added to the types layer. Key shape decisions:

- `type: 'subscription' | 'payment'` — display label only; both types share identical lifecycle logic
- `billingCycle` is a discriminated union: `{ unit: 'monthly' | 'yearly' | 'weekly' } | { unit: 'every-n-days', n: number }`
- `dueDateModel` is a discriminated union: `{ kind: 'fixed-day', dayOfCycle: number }` for calendar-aligned bills; `{ kind: 'billing-offset', billingStartDay: number, offsetDays: number }` for credit-card-style offsets
- `nextDueDate: string` (ISO date) — the computed next due date, advanced on each Mark Paid
- `amount?: string` — optional free-text field; not a number, to avoid currency parsing complexity
- Each reminder has a UUID `id`

### Storage

Reminders are stored as a top-level `reminders` array inside the existing `StoredSettings` object under the `"settings"` key in `chrome.storage.local`. This keeps all user-configured data in one place, consistent with how `jiraAccounts`, `gitlabAccounts`, etc. are stored. The settings store is extended with `addReminder`, `updateReminder`, `removeReminder`, and `markReminderPaid` actions following the same persist pattern.

### Due date advancement

`markReminderPaid` computes the next due date as a pure function of the current `nextDueDate` + `billingCycle`. For `monthly`: advance by 1 calendar month. For `yearly`: advance by 1 calendar year. For `weekly`: advance by 7 days. For `every-n-days`: advance by N days. The new date overwrites `nextDueDate` in storage.

### Service worker — notification alarm

A new `chrome.alarms` entry named `reminder-check` is created on install and whenever the Notification Schedule changes. Because Chrome alarms cannot fire multiple times per day at specified clock times using a single alarm, each configured daily time becomes a separate named alarm: `reminder-check-0`, `reminder-check-1`, etc. On alarm fire, the SW reads `settings.reminders`, compares `nextDueDate` against today + `warnWithinDays`, and calls `chrome.notifications.create` for each reminder that qualifies.

### Notification Schedule settings

Two new fields under `DashboardSettings`:
- `reminderNotificationTimes: string[]` — list of "HH:MM" strings (24h)
- `reminderWarnWithinDays: number` — default 7

### Widget

`RemindersWidget` follows the same `WidgetCard` wrapper pattern as existing widgets. The `WidgetId` union is extended with `'reminders'`. Default position is added to `DEFAULT_POSITIONS`. Widget toggle and collapsed state are extended in `DEFAULT_DASHBOARD`.

### Settings panel

A new "Reminders" section in `SettingsPanel` contains:
- List of existing reminders with edit/delete actions
- "Add Reminder" form (name, type, optional amount, billing cycle, due date model, first due date)
- Notification Schedule sub-section (fire times, warn-within-days threshold)

## Testing Decisions

Since no test runner is currently configured, the primary verification strategy is **manual testing in Chrome** at widget and notification boundaries. The following logical seams are the highest-value candidates if a test runner is added:

**What makes a good test:** test external behavior (what does the reminder list look like after Mark Paid?), not implementation details (don't assert on internal store shape). Tests should be deterministic — pass a fixed "today" date rather than relying on `Date.now()`.

**Seam 1 — due date advancement (pure function):** Given a `Reminder` with a known `nextDueDate` and `billingCycle`, calling `markReminderPaid` produces the correct `nextDueDate`. No Chrome APIs required. Cover: monthly, yearly, weekly, every-n-days, and edge cases (month-end overflow, e.g., Jan 31 → Feb 28).

**Seam 2 — notification eligibility (pure function):** Given a list of `Reminder`s, a fixed "today" date, and a `warnWithinDays` value, the eligibility function returns the correct subset. Cover: upcoming within threshold, overdue, not yet within threshold.

**Seam 3 — reminder store operations:** Add, remove, and markPaid operations write the correct state to `chrome.storage.local`. Prior art: `useSettingsStore` in `src/store/settings.store.ts` — same pattern of `set()` + `persist()`.

**Seam 4 — widget display (manual):** Verify in Chrome that overdue items float to top with red badge, "Mark Paid" advances the cycle, amount line appears only when set, and collapsing/dragging behaves like other widgets.

**Seam 5 — browser notification (manual):** Set a reminder due within `warnWithinDays`, configure a fire time 1–2 minutes ahead, wait for the alarm to fire, confirm the Chrome notification appears.

## Out of Scope

- **Budget tracking / spending analytics** — amounts are display-only; no aggregation, charts, or monthly summaries
- **Cloud sync across devices** — reminders live in `chrome.storage.local` only; `chrome.storage.sync` is not used (quota constraints with large reminder lists)
- **Import from bank statements or external services** — all reminders are entered manually
- **Shared reminders** — no multi-user or shared household support
- **Payment history log** — no record of past Mark Paid events; only the current cycle is tracked
- **Currency formatting** — amount is a free-text string; no currency conversion or locale formatting
- **Smart due date inference** — no OCR, no email parsing; user enters dates manually

## Further Notes

- The "overdue carries over" behavior (question 11) means a user who misses two consecutive credit card payments will see two separate overdue items in the widget — one for each unpaid cycle. This is intentional: each cycle is an independent obligation.
- The Notification Schedule alarm approach (one `chrome.alarms` entry per configured time) means Chrome's minimum alarm interval of 1 minute applies. Times configured less than 1 minute apart will be deduplicated or coalesced by Chrome.
- The `reminder-check` alarms must be recreated on extension update (in the `onInstalled` handler) because Chrome clears all alarms on extension reload.
