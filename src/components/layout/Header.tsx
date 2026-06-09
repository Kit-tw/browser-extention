import React, { useCallback } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { useJira } from '../../hooks/useJira'
import { useGitLab } from '../../hooks/useGitLab'
import { useGitHub } from '../../hooks/useGitHub'
import { useTodos } from '../../hooks/useTodos'
import { daysUntilDue, dateToDisplay } from '../../utils/reminders'
import type { ActiveWidget } from '../../types/settings.types'

interface NavBarProps {
  activeWidget: ActiveWidget | null
  panelOpen: boolean
  onSelect: (w: ActiveWidget) => void
  onToggleNotes: () => void
  onOpenSettings: () => void
  onToggleShortcuts: () => void
}

function Badge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full
      bg-[#4F90F0] text-white text-[9px] font-bold flex items-center justify-center leading-none">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function NavIcon({
  icon, label, badge = 0, active, onClick,
}: {
  icon: React.ReactNode
  label: string
  badge?: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150
        ${active
          ? 'bg-[#4F90F0]/15 text-[#4F90F0] dark:text-[#6BAAF8]'
          : 'text-[#6B7280] dark:text-[#8B95A8] hover:text-[#111827] dark:hover:text-[#CDD3DF] hover:bg-black/[0.06] dark:hover:bg-white/[0.07]'
        }`}
    >
      {icon}
      <Badge count={badge} />
    </button>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────

function HexLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="none">
      <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" strokeWidth="1.5" className="stroke-[#4F90F0]" />
      <polygon points="12,7 16,9.5 16,14.5 12,17 8,14.5 8,9.5" fill="rgba(79,144,240,0.15)" strokeWidth="0.5" stroke="rgba(79,144,240,0.3)" />
    </svg>
  )
}

const JiraIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.976 0C5.364 0 0 5.364 0 11.976c0 6.613 5.364 11.977 11.976 11.977 6.613 0 11.977-5.364 11.977-11.977C23.953 5.364 18.589 0 11.976 0zm-.597 17.61l-4.8-4.8 1.412-1.412 3.388 3.389 6.788-6.789 1.412 1.412-8.2 8.2z" />
  </svg>
)

const GitLabIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 014.82 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0118.6 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.51L23 13.45a.84.84 0 01-.35.94z" />
  </svg>
)

const GitHubIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
)

const TodoIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)

const BellIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

const NoteIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

// ── NavBar ─────────────────────────────────────────────────────────────────

export function Header({ activeWidget, panelOpen, onSelect, onToggleNotes, onOpenSettings, onToggleShortcuts }: NavBarProps) {
  const { dashboard, updateDashboard, jiraAccounts, gitlabAccounts, githubAccounts, reminders } = useSettings()
  const jira = useJira()
  const gitlab = useGitLab()
  const github = useGitHub()
  const { todos } = useTodos()

  const cycleTheme = useCallback(() => {
    const order: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
    const next = order[(order.indexOf(dashboard.theme) + 1) % order.length]
    updateDashboard({ theme: next })
  }, [dashboard.theme, updateDashboard])

  const themeLabel = { light: '☀', dark: '☾', system: '⊙' }

  // Badge counts
  const jiraBadge = jiraAccounts.reduce((sum, a) => sum + (jira.accountData[a.id]?.issues.length ?? 0), 0)
  const gitlabBadge = gitlabAccounts.reduce((sum, a) => {
    const d = gitlab.accountData[a.id]
    return sum + (d ? d.assigned.length + d.authored.length + d.reviewer.length : 0)
  }, 0)
  const githubBadge = githubAccounts.reduce((sum, a) => {
    const d = github.accountData[a.id]
    return sum + (d ? d.assigned.length + d.authored.length + d.reviewRequested.length : 0)
  }, 0)
  const todoBadge = todos.filter((t) => !t.done).length
  const today = dateToDisplay(new Date())
  const remindersBadge = reminders.filter((r) => daysUntilDue(r, today) <= dashboard.notificationSchedule.warnWithinDays).length

  const handleSelect = (w: ActiveWidget) => {
    if (activeWidget === w && panelOpen) {
      onSelect(w) // triggers toggle in parent
    } else {
      onSelect(w)
    }
  }

  return (
    <header className="
      relative z-10 h-11 shrink-0 flex items-center gap-1 px-3
      bg-white/50 dark:bg-[#0E1117]/70 backdrop-blur-md
      border-b border-black/[0.06] dark:border-white/[0.06]
    ">
      {/* Logo */}
      <div className="flex items-center shrink-0 mr-2">
        <HexLogo />
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1 shrink-0" />

      {/* Widget nav icons */}
      <div className="flex items-center gap-0.5">
        {jiraAccounts.length > 0 && (
          <NavIcon icon={<JiraIcon />} label="Jira" badge={jiraBadge}
            active={activeWidget === 'jira' && panelOpen} onClick={() => handleSelect('jira')} />
        )}
        {gitlabAccounts.length > 0 && (
          <NavIcon icon={<GitLabIcon />} label="GitLab" badge={gitlabBadge}
            active={activeWidget === 'gitlab' && panelOpen} onClick={() => handleSelect('gitlab')} />
        )}
        {githubAccounts.length > 0 && (
          <NavIcon icon={<GitHubIcon />} label="GitHub" badge={githubBadge}
            active={activeWidget === 'github' && panelOpen} onClick={() => handleSelect('github')} />
        )}
        <NavIcon icon={<TodoIcon />} label="Todos" badge={todoBadge}
          active={activeWidget === 'todo' && panelOpen} onClick={() => handleSelect('todo')} />
        <NavIcon icon={<BellIcon />} label="Reminders" badge={remindersBadge}
          active={activeWidget === 'reminders' && panelOpen} onClick={() => handleSelect('reminders')} />

        {/* Divider before Notes */}
        <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1 shrink-0" />

        <NavIcon icon={<NoteIcon />} label="Notes" active={false} onClick={onToggleNotes} />
      </div>

      <div className="flex-1" />

      {/* Right controls */}
      <button onClick={cycleTheme} title={`Theme: ${dashboard.theme}`}
        className="w-7 h-7 rounded text-sm flex items-center justify-center shrink-0 font-mono
          text-[#6B7280] dark:text-[#8B95A8] hover:text-[#111827] dark:hover:text-[#CDD3DF]
          hover:bg-black/[0.06] dark:hover:bg-white/[0.07] transition-colors duration-150"
        aria-label={`Current theme: ${dashboard.theme}`}
      >
        {themeLabel[dashboard.theme]}
      </button>

      <button onClick={onToggleShortcuts} title="Keyboard shortcuts (?)"
        className="w-7 h-7 rounded flex items-center justify-center shrink-0
          text-[#6B7280] dark:text-[#8B95A8] hover:text-[#111827] dark:hover:text-[#CDD3DF]
          hover:bg-black/[0.06] dark:hover:bg-white/[0.07] transition-colors duration-150"
        aria-label="Keyboard shortcuts"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <rect x="2" y="6" width="20" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
        </svg>
      </button>

      <button onClick={onOpenSettings} title="Settings"
        className="w-7 h-7 rounded flex items-center justify-center shrink-0
          text-[#6B7280] dark:text-[#8B95A8] hover:text-[#111827] dark:hover:text-[#CDD3DF]
          hover:bg-black/[0.06] dark:hover:bg-white/[0.07] transition-colors duration-150"
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
