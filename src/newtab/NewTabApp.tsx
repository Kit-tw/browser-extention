import React, { useEffect, useState } from 'react'
import { useSettings } from '../hooks/useSettings'
import { useBackground } from '../hooks/useBackground'
import { Header } from '../components/layout/Header'
import { Dashboard } from '../components/layout/Dashboard'
import { SettingsPanel } from '../components/settings/SettingsPanel'

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

export function NewTabApp() {
  const { dashboard, initialized } = useSettings()
  const { bg, blobUrl, hasBg } = useBackground()
  const [settingsOpen, setSettingsOpen] = useState(false)

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
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background layer */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {hasBg && blobUrl ? (
          <>
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
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <Dashboard />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
