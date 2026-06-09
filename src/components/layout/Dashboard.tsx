import React, { useState, useEffect } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { useJira } from '../../hooks/useJira'
import { useGitLab } from '../../hooks/useGitLab'
import { useGitHub } from '../../hooks/useGitHub'
import { JiraWidget } from '../widgets/JiraWidget'
import { GitLabWidget } from '../widgets/GitLabWidget'
import { GitHubWidget } from '../widgets/GitHubWidget'
import { TodoWidget } from '../widgets/TodoWidget'
import { RemindersWidget } from '../widgets/RemindersWidget'
import { ErrorBanner } from '../shared/ErrorBanner'
import { formatRelativeTime } from '../../utils/time'
import type { ActiveWidget } from '../../types/settings.types'

// ── Clock ──────────────────────────────────────────────────────────────────

function CenterClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <>
      <p className="clock-text font-mono font-thin tabular-nums leading-none
        text-[#111520]/75 dark:text-white/75"
        style={{ fontSize: 'clamp(64px, 10vw, 120px)' }}>
        {time}
      </p>
      <p className="clock-text font-mono uppercase tracking-[0.3em] mt-3
        text-[#111520]/75 dark:text-white/75"
        style={{ fontSize: 'clamp(10px, 1.1vw, 14px)' }}>
        {date}
      </p>
    </>
  )
}

// ── Panel header ───────────────────────────────────────────────────────────

function PanelHeader({
  title, lastSync, loading, error, onRetry,
  accounts, selectedId, onSelectAccount,
}: {
  title: string
  lastSync?: string | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  accounts?: { id: string; label: string }[]
  selectedId?: string
  onSelectAccount?: (id: string) => void
}) {
  return (
    <div className="shrink-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#F0F3F7] dark:border-[#1A1E28]">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em]
          text-[#6B7280] dark:text-[#8B95A8] flex-1">
          {title}
        </span>
        {loading && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#CBD2DE] dark:bg-[#2A3040] animate-pulse" />
        )}
      </div>

      {/* Account tabs — only when >1 account */}
      {accounts && accounts.length > 1 && onSelectAccount && (
        <div className="flex border-b border-[#F0F3F7] dark:border-[#1A1E28] px-4 gap-1">
          {accounts.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelectAccount(a.id)}
              className={`py-2 px-2 text-xs font-medium border-b-2 -mb-px transition-colors
                ${selectedId === a.id
                  ? 'border-[#4F90F0] text-[#4F90F0] dark:text-[#6BAAF8]'
                  : 'border-transparent text-[#6B7280] dark:text-[#8B95A8] hover:text-[#374151] dark:hover:text-[#CDD3DF]'
                }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="px-4 pt-2">
          <ErrorBanner message={error} onRetry={onRetry} />
        </div>
      )}
    </div>
  )
}

function PanelFooter({ lastSync }: { lastSync?: string | null }) {
  if (!lastSync) return null
  return (
    <div className="shrink-0 px-4 py-2 border-t border-[#F0F3F7] dark:border-[#1A1E28]">
      <p className="font-mono text-[9px] uppercase tracking-widest text-[#B8BFCC] dark:text-[#6B7585]">
        synced {formatRelativeTime(lastSync)}
      </p>
    </div>
  )
}

// ── Panel content per widget ───────────────────────────────────────────────

function JiraPanel() {
  const { jiraAccounts } = useSettings()
  const jira = useJira()
  const [selectedId, setSelectedId] = useState(jiraAccounts[0]?.id ?? '')

  useEffect(() => {
    if (jiraAccounts.length > 0 && !jiraAccounts.find((a) => a.id === selectedId)) {
      setSelectedId(jiraAccounts[0].id)
    }
  }, [jiraAccounts])

  if (jiraAccounts.length === 0) {
    return <p className="p-4 text-sm text-gray-400">No Jira accounts. Add one in Settings.</p>
  }

  const account = jiraAccounts.find((a) => a.id === selectedId) ?? jiraAccounts[0]
  const data = jira.accountData[account.id] ?? { issues: [], loading: false, error: null, lastSync: null }

  return (
    <>
      <PanelHeader
        title={`Jira${jiraAccounts.length === 1 ? ` — ${account.label}` : ''}`}
        loading={data.loading} error={data.error} onRetry={jira.triggerSync} lastSync={data.lastSync}
        accounts={jiraAccounts} selectedId={account.id} onSelectAccount={setSelectedId}
      />
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <JiraWidget accountId={account.id} accountLabel="" issues={data.issues} loading={data.loading} baseUrl={account.baseUrl} />
      </div>
      <PanelFooter lastSync={data.lastSync} />
    </>
  )
}

function GitLabPanel() {
  const { gitlabAccounts } = useSettings()
  const gitlab = useGitLab()
  const [selectedId, setSelectedId] = useState(gitlabAccounts[0]?.id ?? '')

  useEffect(() => {
    if (gitlabAccounts.length > 0 && !gitlabAccounts.find((a) => a.id === selectedId)) {
      setSelectedId(gitlabAccounts[0].id)
    }
  }, [gitlabAccounts])

  if (gitlabAccounts.length === 0) {
    return <p className="p-4 text-sm text-gray-400">No GitLab accounts. Add one in Settings.</p>
  }

  const account = gitlabAccounts.find((a) => a.id === selectedId) ?? gitlabAccounts[0]
  const data = gitlab.accountData[account.id] ?? { assigned: [], authored: [], reviewer: [], loading: false, error: null, lastSync: null }

  return (
    <>
      <PanelHeader
        title={`GitLab${gitlabAccounts.length === 1 ? ` — ${account.label}` : ''}`}
        loading={data.loading} error={data.error} onRetry={gitlab.triggerSync} lastSync={data.lastSync}
        accounts={gitlabAccounts} selectedId={account.id} onSelectAccount={setSelectedId}
      />
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <GitLabWidget accountId={account.id} accountLabel="" assigned={data.assigned} authored={data.authored} reviewer={data.reviewer} loading={data.loading} />
      </div>
      <PanelFooter lastSync={data.lastSync} />
    </>
  )
}

function GitHubPanel() {
  const { githubAccounts } = useSettings()
  const github = useGitHub()
  const [selectedId, setSelectedId] = useState(githubAccounts[0]?.id ?? '')

  useEffect(() => {
    if (githubAccounts.length > 0 && !githubAccounts.find((a) => a.id === selectedId)) {
      setSelectedId(githubAccounts[0].id)
    }
  }, [githubAccounts])

  if (githubAccounts.length === 0) {
    return <p className="p-4 text-sm text-gray-400">No GitHub accounts. Add one in Settings.</p>
  }

  const account = githubAccounts.find((a) => a.id === selectedId) ?? githubAccounts[0]
  const data = github.accountData[account.id] ?? { assigned: [], authored: [], reviewRequested: [], loading: false, error: null, lastSync: null }

  return (
    <>
      <PanelHeader
        title={`GitHub${githubAccounts.length === 1 ? ` — ${account.label}` : ''}`}
        loading={data.loading} error={data.error} onRetry={github.triggerSync} lastSync={data.lastSync}
        accounts={githubAccounts} selectedId={account.id} onSelectAccount={setSelectedId}
      />
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <GitHubWidget assigned={data.assigned} authored={data.authored} reviewRequested={data.reviewRequested} loading={data.loading} />
      </div>
      <PanelFooter lastSync={data.lastSync} />
    </>
  )
}

function TodoPanel() {
  return (
    <>
      <PanelHeader title="Todos" />
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <TodoWidget />
      </div>
    </>
  )
}

function RemindersPanel() {
  return (
    <>
      <PanelHeader title="Reminders" />
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <RemindersWidget />
      </div>
    </>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────

interface DashboardProps {
  activeWidget: ActiveWidget | null
  panelOpen: boolean
}

export function Dashboard({ activeWidget, panelOpen }: DashboardProps) {
  return (
    <main className="flex flex-1 overflow-hidden">
      {/* Left panel */}
      {panelOpen && activeWidget && (
        <div
          key={activeWidget}
          className="panel-slide-in flex-shrink-0 flex flex-col w-[420px]
            bg-white dark:bg-[#1C2535]
            border-r border-[#E2E6EF] dark:border-[#252D3D]
            overflow-hidden"
        >
          {activeWidget === 'jira'      && <JiraPanel />}
          {activeWidget === 'gitlab'    && <GitLabPanel />}
          {activeWidget === 'github'    && <GitHubPanel />}
          {activeWidget === 'todo'      && <TodoPanel />}
          {activeWidget === 'reminders' && <RemindersPanel />}
        </div>
      )}

      {/* Clock area */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <CenterClock />
        </div>
      </div>
    </main>
  )
}
