import React, { useState, useEffect, useCallback } from 'react'
import { useSettings } from '../../hooks/useSettings'

interface HeaderProps {
  onOpenSettings: () => void
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 5)  return 'still up?'
  if (h < 12) return 'good morning'
  if (h < 17) return 'good afternoon'
  if (h < 21) return 'good evening'
  return 'good night'
}

function LiveClock() {
  const fmt = () =>
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const [time, setTime] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="font-mono text-lg font-medium tabular-nums tracking-tight
      text-[#111520] dark:text-[#D4DAE8]">
      {time}
    </span>
  )
}

function HexLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none">
      <polygon
        points="12,2 21,7 21,17 12,22 3,17 3,7"
        strokeWidth="1.5"
        className="stroke-[#4F90F0] dark:stroke-[#4F90F0]"
      />
      <polygon
        points="12,7 16,9.5 16,14.5 12,17 8,14.5 8,9.5"
        fill="rgba(79,144,240,0.15)"
        strokeWidth="0.5"
        stroke="rgba(79,144,240,0.3)"
      />
    </svg>
  )
}

export function Header({ onOpenSettings }: HeaderProps) {
  const { dashboard, updateDashboard } = useSettings()

  const cycleTheme = useCallback(() => {
    const order: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
    const next = order[(order.indexOf(dashboard.theme) + 1) % order.length]
    updateDashboard({ theme: next })
  }, [dashboard.theme, updateDashboard])

  const themeLabel = { light: '☀', dark: '☾', system: '⊙' }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

  return (
    <header className="
      relative z-10 h-11 shrink-0 flex items-center gap-4 px-5
      bg-white dark:bg-[#0E1117]
      border-b border-[#E8EBF0] dark:border-[#1E2330]
    ">
      {/* Logo + wordmark */}
      <div className="flex items-center gap-2 shrink-0">
        <HexLogo />
        <span className="font-mono text-[10px] font-semibold tracking-[0.18em] uppercase
          text-[#9BA3B0] dark:text-[#8B95A8]">
          Dev Dashboard
        </span>
      </div>

      {/* Separator */}
      <div className="h-3.5 w-px bg-[#E8EBF0] dark:bg-[#1E2330] shrink-0" />

      {/* Clock + greeting */}
      <div className="flex items-baseline gap-2.5 shrink-0">
        <LiveClock />
        <span className="font-mono text-[11px] text-[#9BA3B0] dark:text-[#8B95A8] hidden sm:inline">
          {getGreeting()}
        </span>
      </div>

      {/* Date */}
      <span className="font-mono text-[10px] text-[#C2CAD8] dark:text-[#5A6578] hidden lg:inline">
        {today}
      </span>

      <div className="flex-1" />

      {/* Theme cycle */}
      <button
        onClick={cycleTheme}
        title={`Theme: ${dashboard.theme}`}
        className="
          w-7 h-7 rounded text-sm flex items-center justify-center shrink-0 font-mono
          text-[#9BA3B0] dark:text-[#8B95A8]
          hover:text-[#374151] dark:hover:text-[#CDD3DF]
          hover:bg-[#F4F6FA] dark:hover:bg-[#1A1E28]
          transition-colors duration-150
        "
        aria-label={`Current theme: ${dashboard.theme}`}
      >
        {themeLabel[dashboard.theme]}
      </button>

      {/* Settings */}
      <button
        onClick={onOpenSettings}
        className="
          w-7 h-7 rounded flex items-center justify-center shrink-0
          text-[#9BA3B0] dark:text-[#8B95A8]
          hover:text-[#374151] dark:hover:text-[#CDD3DF]
          hover:bg-[#F4F6FA] dark:hover:bg-[#1A1E28]
          transition-colors duration-150
        "
        aria-label="Settings"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </header>
  )
}
