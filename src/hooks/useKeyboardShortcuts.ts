import { useEffect, useRef } from 'react'
import { useSettingsStore } from '../store/settings.store'

function highlightWidget(widgetKey: string) {
  const wrappers = document.querySelectorAll(`[data-widget="${widgetKey}"]`)
  wrappers.forEach((wrapper, i) => {
    const card = (wrapper.querySelector('.widget-card-root') ?? wrapper) as HTMLElement
    card.classList.remove('widget-highlight')
    void card.offsetWidth
    card.classList.add('widget-highlight')
    setTimeout(() => card.classList.remove('widget-highlight'), 900)
    if (i === 0) card.focus({ preventScroll: false })
  })
}

function expandWidget(widgetKey: 'note' | 'todo') {
  const { dashboard, setCollapsed } = useSettingsStore.getState()
  if (dashboard.collapsed[widgetKey]) setCollapsed(widgetKey, false)
}

function focusIn(widgetKey: string, selector: string) {
  setTimeout(() => {
    const el = document.querySelector(`[data-widget="${widgetKey}"] ${selector}`) as HTMLElement | null
    el?.focus()
  }, 60)
}

export function useKeyboardShortcuts(onToggleHelp: () => void, isHelpOpen: boolean) {
  const gCycleRef = useRef<{ time: number; last: 'gitlab' | 'github' } | null>(null)
  // Use refs so the single event-listener closure always sees current values
  const onToggleHelpRef = useRef(onToggleHelp)
  const isHelpOpenRef = useRef(isHelpOpen)
  useEffect(() => { onToggleHelpRef.current = onToggleHelp }, [onToggleHelp])
  useEffect(() => { isHelpOpenRef.current = isHelpOpen }, [isHelpOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Escape: exit input OR close help modal — always handled
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

      // All other shortcuts are blocked when help modal is open or typing in an input
      if (isHelpOpenRef.current || inInput) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const key = e.key

      if (key === '?') {
        e.preventDefault()
        onToggleHelpRef.current()
      } else if (key === 'j' || key === 'J') {
        e.preventDefault()
        highlightWidget('jira')
      } else if (key === 'n' || key === 'N') {
        e.preventDefault()
        expandWidget('note')
        highlightWidget('note')
        // Ask NoteWidget to enter rename mode on the active tab
        document.dispatchEvent(new CustomEvent('note:focus-title'))
      } else if (key === 't' || key === 'T') {
        e.preventDefault()
        expandWidget('todo')
        highlightWidget('todo')
        focusIn('todo', 'input[type="text"]')
      } else if (key === 'g' || key === 'G') {
        e.preventDefault()
        const { gitlabAccounts, githubAccounts } = useSettingsStore.getState()
        const hasGitLab = gitlabAccounts.length > 0
        const hasGitHub = githubAccounts.length > 0
        if (!hasGitLab && !hasGitHub) return

        if (hasGitLab && !hasGitHub) {
          highlightWidget('gitlab')
        } else if (!hasGitLab && hasGitHub) {
          highlightWidget('github')
        } else {
          // Both: cycle on consecutive G presses within 1 second
          const now = Date.now()
          const prev = gCycleRef.current
          if (prev && now - prev.time < 1000 && prev.last === 'gitlab') {
            highlightWidget('github')
            gCycleRef.current = { time: now, last: 'github' }
          } else {
            highlightWidget('gitlab')
            gCycleRef.current = { time: now, last: 'gitlab' }
          }
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, []) // stable: all dependencies accessed via refs
}
