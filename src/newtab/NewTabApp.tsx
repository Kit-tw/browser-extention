import React, { useEffect, useState } from 'react'
import { useSettings } from '../hooks/useSettings'
import { useBackground } from '../hooks/useBackground'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { Header } from '../components/layout/Header'
import { Dashboard } from '../components/layout/Dashboard'
import { SettingsPanel } from '../components/settings/SettingsPanel'
import { FloatingNotes } from '../components/FloatingNotes'
import type { ActiveWidget } from '../hooks/useSettings'

function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }
}

function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { key: 'J', desc: 'Open Jira panel' },
    { key: 'G', desc: 'Open GitLab / GitHub panel (press twice to cycle)' },
    { key: 'T', desc: 'Open Todo panel — focuses the input field' },
    { key: 'R', desc: 'Open Reminders panel' },
    { key: 'N', desc: 'Open / close floating notes' },
    { key: '?', desc: 'Toggle this shortcuts reference' },
    { key: 'Esc', desc: 'Blur active input  ·  close this panel' },
  ]
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-[#141920] border border-[#E8EBF0] dark:border-[#1E2330]
          rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[11px] font-semibold tracking-[0.18em] uppercase
            text-[#9BA3B0] dark:text-[#8B95A8]">
            Keyboard shortcuts
          </span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded
              text-[#C2CAD8] dark:text-[#3A4555]
              hover:text-[#374151] dark:hover:text-[#CDD3DF]
              hover:bg-[#F4F6FA] dark:hover:bg-[#1A1E28] transition-colors"
            aria-label="Close"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ul className="space-y-2.5">
          {shortcuts.map(({ key, desc }) => (
            <li key={key} className="flex items-start gap-3">
              <kbd className="shrink-0 inline-flex items-center justify-center
                min-w-[28px] h-6 px-1.5 rounded
                bg-[#F4F6FA] dark:bg-[#1E2535]
                border border-[#DDE1E9] dark:border-[#2A3347]
                font-mono text-[11px] font-semibold
                text-[#374151] dark:text-[#CDD3DF]">
                {key}
              </kbd>
              <span className="text-xs text-[#6B7585] dark:text-[#8B95A8] leading-6">{desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function NewTabApp() {
  const { dashboard, initialized } = useSettings()
  const { bg, blobUrl, mediaType, hasBg } = useBackground()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [activeWidget, setActiveWidget] = useState<ActiveWidget | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)

  // Initialize activeWidget from defaultWidget once settings load
  useEffect(() => {
    if (initialized && activeWidget === null) {
      setActiveWidget(dashboard.defaultWidget ?? 'jira')
    }
  }, [initialized])

  const handleSelectWidget = (w: ActiveWidget) => {
    if (activeWidget === w) {
      setPanelOpen((v) => !v) // toggle
    } else {
      setActiveWidget(w)
      setPanelOpen(true)
    }
  }

  useKeyboardShortcuts(
    () => setShortcutsOpen((v) => !v),
    shortcutsOpen,
    handleSelectWidget,
    () => setNotesOpen((v) => !v),
  )

  // Toggle has-bg on <html> so .widget-card-root CSS rules activate
  useEffect(() => {
    if (hasBg) {
      document.documentElement.classList.add('has-bg')
    } else {
      document.documentElement.classList.remove('has-bg')
    }
    return () => document.documentElement.classList.remove('has-bg')
  }, [hasBg])

  useEffect(() => {
    if (initialized) {
      applyTheme(dashboard.theme)
    }
  }, [dashboard.theme, initialized])

  useEffect(() => {
    if (!initialized || dashboard.theme !== 'system') return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [dashboard.theme, initialized])

  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#F4F6FA] dark:bg-[#0D1117] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen relative overflow-hidden flex flex-col">
      {/* Background layer */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {hasBg && blobUrl ? (
          <>
            {mediaType === 'video' ? (
              <video
                key={blobUrl}
                className="absolute inset-0 w-full h-full"
                style={{
                  objectFit: bg.fit === 'center' ? 'none' : bg.fit,
                  objectPosition: 'center',
                  ...(bg.blur > 0
                    ? { filter: `blur(${bg.blur + 4}px)`, transform: 'scale(1.08)' }
                    : {}),
                }}
                src={blobUrl}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${blobUrl})`,
                  backgroundSize: bg.fit === 'center' ? 'auto' : bg.fit,
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  ...(bg.blur > 0
                    ? { filter: `blur(${bg.blur + 4}px)`, transform: 'scale(1.08)' }
                    : {}),
                }}
              />
            )}
            <div
              className="absolute inset-0"
              style={{ backgroundColor: `rgba(0,0,0,${bg.opacity})` }}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-[#F4F6FA] dark:bg-[#0D1117] transition-colors" />
        )}
      </div>

      {/* Content */}
      <Header
        activeWidget={activeWidget}
        panelOpen={panelOpen}
        onSelect={handleSelectWidget}
        onToggleNotes={() => setNotesOpen((v) => !v)}
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleShortcuts={() => setShortcutsOpen((v) => !v)}
      />
      <Dashboard activeWidget={activeWidget} panelOpen={panelOpen} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {shortcutsOpen && <ShortcutsHelp onClose={() => setShortcutsOpen(false)} />}
      <FloatingNotes open={notesOpen} onClose={() => setNotesOpen(false)} />
    </div>
  )
}
