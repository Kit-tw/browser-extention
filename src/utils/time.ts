/**
 * Formats an ISO date string as a human-readable relative time.
 * Examples: "just now", "2m ago", "3h ago", "5d ago", "2w ago"
 */
export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return 'never'

  const date = new Date(isoString)
  if (isNaN(date.getTime())) return 'unknown'

  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)

  if (diffSeconds < 60) return 'just now'
  if (diffSeconds < 3600) {
    const mins = Math.floor(diffSeconds / 60)
    return `${mins}m ago`
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600)
    return `${hours}h ago`
  }
  if (diffSeconds < 604800) {
    const days = Math.floor(diffSeconds / 86400)
    return `${days}d ago`
  }
  const weeks = Math.floor(diffSeconds / 604800)
  return `${weeks}w ago`
}

/**
 * Returns true if the given ISO date string represents a date in the past.
 */
export function isOverdue(isoString: string | undefined): boolean {
  if (!isoString) return false
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return false
  // Compare date only (no time component for due dates)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}
