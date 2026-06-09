export type ReminderType = 'subscription' | 'payment'

export type BillingCycle =
  | { unit: 'monthly' }
  | { unit: 'yearly' }
  | { unit: 'weekly' }
  | { unit: 'every-n-days'; n: number }

export type DueDateModel =
  | { kind: 'fixed-day'; dayOfCycle: number }
  | { kind: 'billing-offset'; billingStartDay: number; offsetDays: number }

export interface Reminder {
  id: string
  name: string
  type: ReminderType
  amount?: string
  billingCycle: BillingCycle
  dueDateModel: DueDateModel
  nextDueDate: string // date string DD-MM-YYYY
}
