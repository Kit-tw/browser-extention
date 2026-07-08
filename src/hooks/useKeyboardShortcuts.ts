import { useEffect, useRef } from 'react'
import { useSettingsStore } from '../store/settings.store'
import type { ActiveWidget } from '../types/settings.types'

export function useKeyboardShortcuts(
  onToggleHelp: () => void,
  isHelpOpen: boolean,
  onSelectWidget: (w: ActiveWidget) => void,
  onToggleNotes: () => void,
) {
  const gCycleRef = useRef<{ time: number; last: 'gitlab' | 'github' } | null>(null)
  const onToggleHelpRef = useRef(onToggleHelp)
  const isHelpOpenRef = useRef(isHelpOpen)
  const onSelectWidgetRef = useRef(onSelectWidget)
  const onToggleNotesRef = useRef(onToggleNotes)
  useEffect(() => { onToggleHelpRef.current = onToggleHelp }, [onToggleHelp])
  useEffect(() => { isHelpOpenRef.current = isHelpOpen }, [isHelpOpen])
  useEffect(() => { onSelectWidgetRef.current = onSelectWidget }, [onSelectWidget])
  useEffect(() => { onToggleNotesRef.current = onToggleNotes }, [onToggleNotes])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if (e.key === 'Escape') {
        if (inInput) {
          e.preventDefault()
          target.blur()
        } else if (isHelpOpenRef.current) {
          e.preventDefault()
          onToggleHelpRef.current()
        }
        return
      }

      if (isHelpOpenRef.current || inInput) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const key = e.key

      if (key === '?') {
        e.preventDefault()
        onToggleHelpRef.current()
      } else if (key === 'j' || key === 'J') {
        e.preventDefault()
        onSelectWidgetRef.current('jira')
      } else if (key === 'n' || key === 'N') {
        e.preventDefault()
        onToggleNotesRef.current()
      } else if (key === 't' || key === 'T') {
        e.preventDefault()
        onSelectWidgetRef.current('todo')
        setTimeout(() => {
          const input = document.querySelector('input[type="text"]') as HTMLElement | null
          input?.focus()
        }, 60)
      } else if (key === 'r' || key === 'R') {
        e.preventDefault()
        onSelectWidgetRef.current('reminders')
      } else if (key === 'g' || key === 'G') {
        e.preventDefault()
        const { gitlabAccounts, githubAccounts } = useSettingsStore.getState()
        const hasGitLab = gitlabAccounts.length > 0
        const hasGitHub = githubAccounts.length > 0
        if (!hasGitLab && !hasGitHub) return

        if (hasGitLab && !hasGitHub) {
          onSelectWidgetRef.current('gitlab')
        } else if (!hasGitLab && hasGitHub) {
          onSelectWidgetRef.current('github')
        } else {
          const now = Date.now()
          const prev = gCycleRef.current
          if (prev && now - prev.time < 1000 && prev.last === 'gitlab') {
            onSelectWidgetRef.current('github')
            gCycleRef.current = { time: now, last: 'github' }
          } else {
            onSelectWidgetRef.current('gitlab')
            gCycleRef.current = { time: now, last: 'gitlab' }
          }
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
