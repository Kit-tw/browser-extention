import React from 'react'
import {
  DndContext,
  useDraggable,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useSettings } from '../../hooks/useSettings'
import { useSettingsStore } from '../../store/settings.store'
import { useJira } from '../../hooks/useJira'
import { useGitLab } from '../../hooks/useGitLab'
import { JiraWidget } from '../widgets/JiraWidget'
import { GitLabWidget } from '../widgets/GitLabWidget'
import { TodoWidget } from '../widgets/TodoWidget'
import { NoteWidget } from '../widgets/NoteWidget'
import { WidgetCard } from './WidgetCard'
import { Badge } from '../shared/Badge'
import type { JiraAccount, GitLabAccount, DashboardSettings, WidgetPosition } from '../../types/settings.types'
import type { WidgetAccent } from './WidgetCard'

// ── Icons ──────────────────────────────────────────────────────────────────

// Brand colors on icons only — the only place color is used for identity
function JiraIcon() {
  return (
    <svg className="w-4 h-4 text-[#2272FF]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.976 0C5.364 0 0 5.364 0 11.976c0 6.613 5.364 11.977 11.976 11.977 6.613 0 11.977-5.364 11.977-11.977C23.953 5.364 18.589 0 11.976 0zm-.597 17.61l-4.8-4.8 1.412-1.412 3.388 3.389 6.788-6.789 1.412 1.412-8.2 8.2z" />
    </svg>
  )
}

function GitLabIcon() {
  return (
    <svg className="w-4 h-4 text-[#FC6D26]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 014.82 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0118.6 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.51L23 13.45a.84.84 0 01-.35.94z" />
    </svg>
  )
}

function TodoIcon() {
  return (
    <svg className="w-4 h-4 text-[#6B7280] dark:text-[#4F90F0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}

function NoteIcon() {
  return (
    <svg className="w-4 h-4 text-[#A78BFA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function setExtendedPosition(key: string, pos: WidgetPosition) {
  const store = useSettingsStore.getState()
  const updatedPositions = { ...store.dashboard.positions, [key]: pos } as Record<string, WidgetPosition>
  store.updateDashboard({ positions: updatedPositions as DashboardSettings['positions'] })
}

function getExtendedPosition(
  positions: DashboardSettings['positions'],
  key: string,
  fallback: WidgetPosition,
): WidgetPosition {
  const extended = positions as Record<string, WidgetPosition>
  return extended[key] ?? fallback
}

// ── Individual draggable account widgets ──────────────────────────────────

function JiraAccountWidget({ account, idx, dashboard }: {
  account: JiraAccount
  idx: number
  dashboard: DashboardSettings
  accent?: WidgetAccent
}) {
  const { setCollapsed } = useSettings()
  const jira = useJira()

  const posKey = `jira_${account.id}`
  const basePos = dashboard.positions.jira
  const pos = getExtendedPosition(dashboard.positions, posKey, {
    ...basePos,
    x: basePos.x + idx * 20,
    y: basePos.y + idx * 20,
  })

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: posKey })

  const style: React.CSSProperties = {
    position: 'absolute',
    left: pos.x,
    top: pos.y,
    width: pos.w > 0 ? pos.w : undefined,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.85 : 1,
  }

  const data = jira.accountData[account.id] ?? { issues: [], loading: false, error: null, lastSync: null }
  const totalIssues = data.issues.length
  const summary = totalIssues > 0 ? (
    <Badge color="bg-[#F0F3F7] text-[#6B7280] dark:bg-[#1A1E28] dark:text-[#8B95A8]">{totalIssues}</Badge>
  ) : null

  return (
    <div ref={setNodeRef} style={{ ...style, animationDelay: `${idx * 80}ms` }} className="widget-enter">
      <WidgetCard
        title={`Jira — ${account.label}`}
        icon={<JiraIcon />}
        collapsed={dashboard.collapsed.jira}
        onToggleCollapse={() => setCollapsed('jira', !dashboard.collapsed.jira)}
        summary={summary}
        lastSync={data.lastSync}
        error={data.error}
        loading={data.loading}
        onRetry={jira.triggerSync}
        dragHandleProps={{ ...attributes, ...listeners }}
        accent="cyan"
      >
        <JiraWidget
          accountId={account.id}
          accountLabel=""
          issues={data.issues}
          loading={data.loading}
          baseUrl={account.baseUrl}
        />
      </WidgetCard>
    </div>
  )
}

function GitLabAccountWidget({ account, idx, dashboard }: {
  account: GitLabAccount
  idx: number
  dashboard: DashboardSettings
}) {
  const { setCollapsed } = useSettings()
  const gitlab = useGitLab()

  const posKey = `gitlab_${account.id}`
  const basePos = dashboard.positions.gitlab
  const pos = getExtendedPosition(dashboard.positions, posKey, {
    ...basePos,
    x: basePos.x + idx * 20,
    y: basePos.y + idx * 20,
  })

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: posKey })

  const style: React.CSSProperties = {
    position: 'absolute',
    left: pos.x,
    top: pos.y,
    width: pos.w > 0 ? pos.w : undefined,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.85 : 1,
  }

  const data = gitlab.accountData[account.id] ?? { assigned: [], authored: [], reviewer: [], loading: false, error: null, lastSync: null }
  const total = data.assigned.length + data.authored.length + data.reviewer.length
  const summary = total > 0 ? (
    <Badge color="bg-[#F0F3F7] text-[#6B7280] dark:bg-[#1A1E28] dark:text-[#8B95A8]">{total}</Badge>
  ) : null

  return (
    <div ref={setNodeRef} style={{ ...style, animationDelay: `${80 + idx * 80}ms` }} className="widget-enter">
      <WidgetCard
        title={`GitLab — ${account.label}`}
        icon={<GitLabIcon />}
        collapsed={dashboard.collapsed.gitlab}
        onToggleCollapse={() => setCollapsed('gitlab', !dashboard.collapsed.gitlab)}
        summary={summary}
        lastSync={data.lastSync}
        error={data.error}
        loading={data.loading}
        onRetry={gitlab.triggerSync}
        dragHandleProps={{ ...attributes, ...listeners }}
        accent="amber"
      >
        <GitLabWidget
          accountId={account.id}
          accountLabel=""
          assigned={data.assigned}
          authored={data.authored}
          reviewer={data.reviewer}
          loading={data.loading}
        />
      </WidgetCard>
    </div>
  )
}

function NoteWidgetItem({ dashboard }: { dashboard: DashboardSettings }) {
  const { setCollapsed } = useSettings()
  const pos = dashboard.positions.note

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: 'note' })

  const style: React.CSSProperties = {
    position: 'absolute',
    left: pos.x,
    top: pos.y,
    width: pos.w > 0 ? pos.w : undefined,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.85 : 1,
  }

  return (
    <div ref={setNodeRef} style={{ ...style, animationDelay: '240ms' }} className="widget-enter">
      <WidgetCard
        title="Notes"
        icon={<NoteIcon />}
        collapsed={dashboard.collapsed.note}
        onToggleCollapse={() => setCollapsed('note', !dashboard.collapsed.note)}
        lastSync={null}
        dragHandleProps={{ ...attributes, ...listeners }}
        accent="violet"
      >
        <NoteWidget />
      </WidgetCard>
    </div>
  )
}

function TodoWidgetItem({ dashboard }: { dashboard: DashboardSettings }) {
  const { setCollapsed } = useSettings()
  const pos = dashboard.positions.todo

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: 'todo' })

  const style: React.CSSProperties = {
    position: 'absolute',
    left: pos.x,
    top: pos.y,
    width: pos.w > 0 ? pos.w : undefined,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.85 : 1,
  }

  return (
    <div ref={setNodeRef} style={{ ...style, animationDelay: '160ms' }} className="widget-enter">
      <WidgetCard
        title="Todos"
        icon={<TodoIcon />}
        collapsed={dashboard.collapsed.todo}
        onToggleCollapse={() => setCollapsed('todo', !dashboard.collapsed.todo)}
        lastSync={null}
        dragHandleProps={{ ...attributes, ...listeners }}
        accent="green"
      >
        <TodoWidget />
      </WidgetCard>
    </div>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export function Dashboard() {
  const { dashboard, jiraAccounts, gitlabAccounts, setWidgetPosition } = useSettings()

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event
    if (!active || !delta) return

    const id = active.id as string
    let current: WidgetPosition | undefined

    if (id === 'todo' || id === 'note') {
      current = (dashboard.positions as Record<string, WidgetPosition>)[id]
    } else if (id.startsWith('jira_')) {
      const idx = jiraAccounts.findIndex((a) => `jira_${a.id}` === id)
      if (idx === -1) return
      current = getExtendedPosition(dashboard.positions, id, {
        ...dashboard.positions.jira,
        x: dashboard.positions.jira.x + idx * 20,
        y: dashboard.positions.jira.y + idx * 20,
      })
    } else if (id.startsWith('gitlab_')) {
      const idx = gitlabAccounts.findIndex((a) => `gitlab_${a.id}` === id)
      if (idx === -1) return
      current = getExtendedPosition(dashboard.positions, id, {
        ...dashboard.positions.gitlab,
        x: dashboard.positions.gitlab.x + idx * 20,
        y: dashboard.positions.gitlab.y + idx * 20,
      })
    }

    if (!current) return

    const updated: WidgetPosition = {
      ...current,
      x: Math.max(0, current.x + delta.x),
      y: Math.max(0, current.y + delta.y),
    }

    if (id === 'todo' || id === 'note') {
      setWidgetPosition(id, updated)
    } else if (id.startsWith('jira_') || id.startsWith('gitlab_')) {
      setExtendedPosition(id, updated)
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <main className="relative overflow-hidden" style={{ height: 'calc(100vh - 44px)' }}>
        {/* Jira widgets — one per account */}
        {dashboard.widgets.jira &&
          jiraAccounts.map((account, idx) => (
            <JiraAccountWidget
              key={account.id}
              account={account}
              idx={idx}
              dashboard={dashboard}
            />
          ))}

        {/* GitLab widgets — one per account */}
        {dashboard.widgets.gitlab &&
          gitlabAccounts.map((account, idx) => (
            <GitLabAccountWidget
              key={account.id}
              account={account}
              idx={idx}
              dashboard={dashboard}
            />
          ))}

        {/* Todo widget */}
        {dashboard.widgets.todo && <TodoWidgetItem dashboard={dashboard} />}

        {/* Note widget */}
        {dashboard.widgets.note && <NoteWidgetItem dashboard={dashboard} />}

      </main>
    </DndContext>
  )
}
