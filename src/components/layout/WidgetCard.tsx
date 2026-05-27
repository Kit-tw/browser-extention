import React from 'react'
import { formatRelativeTime } from '../../utils/time'
import { ErrorBanner } from '../shared/ErrorBanner'

export type WidgetAccent = 'cyan' | 'amber' | 'green' | 'violet'

const ACCENT_COLOR: Record<WidgetAccent, string> = {
  cyan:   'bg-[#2272FF]',
  amber:  'bg-[#FC6D26]',
  green:  'bg-[#34D399]',
  violet: 'bg-[#A78BFA]',
}

interface WidgetCardProps {
  title: string
  icon: React.ReactNode
  collapsed: boolean
  onToggleCollapse: () => void
  summary?: React.ReactNode
  children: React.ReactNode
  lastSync?: string | null
  error?: string | null
  loading?: boolean
  className?: string
  onRetry?: () => void
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  accent?: WidgetAccent
}

function GripDots() {
  return (
    <svg className="w-3 h-3.5" viewBox="0 0 12 16" fill="currentColor">
      <circle cx="3" cy="3"  r="1.1" /><circle cx="9" cy="3"  r="1.1" />
      <circle cx="3" cy="8"  r="1.1" /><circle cx="9" cy="8"  r="1.1" />
      <circle cx="3" cy="13" r="1.1" /><circle cx="9" cy="13" r="1.1" />
    </svg>
  )
}

export function WidgetCard({
  title, icon, collapsed, onToggleCollapse, summary, children,
  lastSync, error, loading, className = '', onRetry, dragHandleProps, accent,
}: WidgetCardProps) {
  return (
    <div tabIndex={-1} className={`
      widget-card-root
      relative group overflow-hidden rounded-lg
      bg-white dark:bg-[#1C2535]
      border border-[#E2E6EF] dark:border-[#252D3D]
      shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-none
      transition-[background-color,border-color,box-shadow,backdrop-filter] duration-200
      hover:border-[#C8CCDA] dark:hover:border-[#2A3040]
      hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.04)]
      ${className}
    `}>

      {/* Accent strip */}
      {accent && (
        <div className={`absolute left-0 inset-y-0 w-[3px] ${ACCENT_COLOR[accent]}`} aria-hidden="true" />
      )}

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">

        {/* Drag handle — invisible until hover */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="shrink-0 cursor-grab active:cursor-grabbing
              text-transparent group-hover:text-[#9BA3B0] dark:group-hover:text-[#6B7585]
              transition-colors duration-150"
            aria-label="Drag to reposition"
          >
            <GripDots />
          </div>
        )}

        {/* Icon — brand-colored, passed from parent */}
        <span className="shrink-0 w-4 h-4 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
          {icon}
        </span>

        {/* Title */}
        <span className={`font-mono text-[10px] font-semibold uppercase tracking-[0.1em]
          text-[#6B7280] dark:text-[#8B95A8] select-none
          ${collapsed ? 'whitespace-nowrap' : 'flex-1 truncate'}`}>
          {title}
        </span>

        {/* Collapsed summary */}
        {collapsed && summary && (
          <span className="flex items-center gap-1 shrink-0">{summary}</span>
        )}

        {/* Loading indicator */}
        {loading && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#CBD2DE] dark:bg-[#2A3040] animate-pulse shrink-0" />
        )}

        {/* Chevron */}
        <button
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand widget' : 'Collapse widget'}
          className="shrink-0 p-0.5 rounded
            text-[#C2CAD8] dark:text-[#5A6578]
            hover:text-[#6B7280] dark:hover:text-[#A0A8B8]
            transition-colors duration-150"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Divider */}
      {!collapsed && (
        <div className="h-px bg-[#F0F3F7] dark:bg-[#1A1E28] mx-3" />
      )}

      {/* Body */}
      <div className={`overflow-hidden transition-[max-height] duration-300 ease-out ${collapsed ? 'max-h-0 w-0' : 'max-h-[2000px]'}`}>
        <div className={`px-3 pt-2.5 pb-1.5 transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
          {children}
        </div>

        {/* Footer */}
        <div className="px-3 pb-3 pt-1">
          {error ? (
            <ErrorBanner message={error} onRetry={onRetry} />
          ) : lastSync ? (
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#B8BFCC] dark:text-[#6B7585]">
              synced {formatRelativeTime(lastSync)}
            </p>
          ) : !loading ? (
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#B8BFCC] dark:text-[#6B7585]">
              never synced
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
