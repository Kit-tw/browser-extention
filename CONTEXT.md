# Context

## Reminder

A tracked financial obligation the user wants to be reminded about. Has a name, optional amount, billing cycle, due date model, and a paid state. All reminders require manual confirmation — even subscriptions — because the user wants to consciously acknowledge each charge.

Subtypes are **Subscription** and **Payment**; they share identical lifecycle behavior and differ only in label/icon.

## Subscription

A Reminder for a service that auto-charges on a recurring basis (e.g., Claude Code, Netflix). The user still manually marks it paid each cycle to confirm awareness.

## Payment

A Reminder for a bill the user must actively transfer money for (e.g., credit card, house rent). Functionally identical to Subscription in the domain model.

## Billing Cycle

The recurrence interval of a Reminder. One of: `monthly`, `yearly`, `weekly`, `every-n-days` (where N is user-defined). After a Reminder is marked paid, its next due date is computed by advancing the current due date by one Billing Cycle.

## Due Date Model

How a Reminder's due date is defined. Per-item choice of:

- **Fixed Due Day** — a specific day each cycle (e.g., the 15th of every month, or March 3rd every year)
- **Billing Offset** — N days after a billing start date (e.g., 45 days after the 1st of each month); used for credit cards where the statement close date differs from the payment due date

## Overdue

The state of a Reminder whose due date has passed without being marked paid. An overdue Reminder continues to fire notifications and appears at the top of the Reminders widget with a red badge. It remains overdue until the user clicks Mark Paid.

## Mark Paid

The user action confirming a Reminder has been settled for the current cycle. Transitions the Reminder from Overdue or Upcoming to the next cycle's Upcoming state by advancing the due date by one Billing Cycle.

## Reminder Notification

A browser push notification fired by the service worker when one or more Reminders are due within the user's configured warning threshold. Can fire multiple times per day at user-configured times.

## Notification Schedule

User-configured settings for Reminder Notifications: a list of daily fire times (e.g., 9:00 AM, 6:00 PM) and a "warn within N days" threshold. Stored alongside other dashboard settings.
