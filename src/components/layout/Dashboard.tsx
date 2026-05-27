import React, { useState, useEffect, useRef, useCallback } from 'react'
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
import { useGitHub } from '../../hooks/useGitHub'
import { JiraWidget } from '../widgets/JiraWidget'
import { GitLabWidget } from '../widgets/GitLabWidget'
import { GitHubWidget } from '../widgets/GitHubWidget'
import { TodoWidget } from '../widgets/TodoWidget'
import { NoteWidget } from '../widgets/NoteWidget'
import { WidgetCard } from './WidgetCard'
import { Badge } from '../shared/Badge'
import type { JiraAccount, GitLabAccount, GitHubAccount, DashboardSettings, WidgetPosition } from '../../types/settings.types'
import type { WidgetAccent } from './WidgetCard'

// ── Background clock ───────────────────────────────────────────────────────

function CenterClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
      <p className="clock-text font-mono font-thin tabular-nums leading-none
        text-[#111520]/40 dark:text-white/30"
        style={{ fontSize: 'clamp(64px, 10vw, 120px)' }}
      >
        {time}
      </p>
      <p className="clock-text font-mono uppercase tracking-[0.3em] mt-3
        text-[#111520]/40 dark:text-white/30"
        style={{ fontSize: 'clamp(10px, 1.1vw, 14px)' }}
      >
        {date}
      </p>
    </div>
  )
}

// ── Resize handle ──────────────────────────────────────────────────────────

function ResizeHandle({ onDelta, onRelease }: { onDelta: (d: number) => void; onRelease: () => void }) {
  const startX = useRef<number | null>(null)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.preventDefault()
    startX.current = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return
    const delta = e.clientX - startX.current
    startX.current = e.clientX
    onDelta(delta)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    startX.current = null
    onRelease()
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute top-0 bottom-0 z-20 w-3 cursor-ew-resize group/resize"
      style={{ right: -6, touchAction: 'none' }}
    >
      <div className="absolute inset-y-4 left-[5px] w-0.5 rounded-full
        bg-blue-400/40 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
    </div>
  )
}

// ── Resize hook ────────────────────────────────────────────────────────────

function useWidgetResize(posW: number, onSave: (w: number) => void, minWidth = 240) {
  const liveW = useRef(posW)
  const [renderW, setRenderW] = useState(posW)

  useEffect(() => {
    liveW.current = posW
    setRenderW(posW)
  }, [posW])

  const handleDelta = useCallback((delta: number) => {
    const newW = Math.max(minWidth, liveW.current + delta)
    liveW.current = newW
    setRenderW(newW)
  }, [minWidth])

  const handleRelease = useCallback(() => {
    onSave(liveW.current)
  }, [onSave])

  return { renderW, handleDelta, handleRelease }
}

// ── Icons ──────────────────────────────────────────────────────────────────

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

function GitHubIcon() {
  return (
    <svg className="w-4 h-4 text-[#24292F] dark:text-[#E6EDF3]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
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

// ── Position helpers ───────────────────────────────────────────────────────

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

// ── Widget wrappers ────────────────────────────────────────────────────────

const GITHUB_BASE: WidgetPosition = { x: 900, y: 80, w: 420, h: 0 }

function JiraAccountWidget({ account, idx, dashboard }: {
  account: JiraAccount; idx: number; dashboard: DashboardSettings; accent?: WidgetAccent
}) {
  const { setCollapsed } = useSettings()
  const jira = useJira()

  const posKey = `jira_${account.id}`
  const basePos = dashboard.positions.jira
  const pos = getExtendedPosition(dashboard.positions, posKey, {
    ...basePos, x: basePos.x + idx * 20, y: basePos.y + idx * 20,
  })

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: posKey })
  const { renderW, handleDelta, handleRelease } = useWidgetResize(
    pos.w,
    useCallback((w) => setExtendedPosition(posKey, { ...pos, w }), [posKey, pos]),
  )

  const collapsed = dashboard.collapsed.jira
  const style: React.CSSProperties = {
    position: 'absolute', left: pos.x, top: pos.y,
    width: collapsed ? 'max-content' : (renderW || undefined),
    transform: CSS.Translate.toString(transform), zIndex: isDragging ? 100 : 1, opacity: isDragging ? 0.85 : 1,
  }

  const data = jira.accountData[account.id] ?? { issues: [], loading: false, error: null, lastSync: null }
  const summary = data.issues.length > 0
    ? <Badge color="bg-[#F0F3F7] text-[#6B7280] dark:bg-[#1A1E28] dark:text-[#8B95A8]">{data.issues.length}</Badge>
    : null

  return (
    <div ref={setNodeRef} style={{ ...style, animationDelay: `${idx * 80}ms` }} className="widget-enter" data-widget="jira">
      {!collapsed && <ResizeHandle onDelta={handleDelta} onRelease={handleRelease} />}
      <WidgetCard
        title={`Jira — ${account.label}`} icon={<JiraIcon />}
        collapsed={dashboard.collapsed.jira} onToggleCollapse={() => setCollapsed('jira', !dashboard.collapsed.jira)}
        summary={summary} lastSync={data.lastSync} error={data.error} loading={data.loading}
        onRetry={jira.triggerSync} dragHandleProps={{ ...attributes, ...listeners }} accent="cyan"
      >
        <JiraWidget accountId={account.id} accountLabel="" issues={data.issues} loading={data.loading} baseUrl={account.baseUrl} />
      </WidgetCard>
    </div>
  )
}

function GitLabAccountWidget({ account, idx, dashboard }: {
  account: GitLabAccount; idx: number; dashboard: DashboardSettings
}) {
  const { setCollapsed } = useSettings()
  const gitlab = useGitLab()

  const posKey = `gitlab_${account.id}`
  const basePos = dashboard.positions.gitlab
  const pos = getExtendedPosition(dashboard.positions, posKey, {
    ...basePos, x: basePos.x + idx * 20, y: basePos.y + idx * 20,
  })

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: posKey })
  const { renderW, handleDelta, handleRelease } = useWidgetResize(
    pos.w,
    useCallback((w) => setExtendedPosition(posKey, { ...pos, w }), [posKey, pos]),
  )

  const collapsed = dashboard.collapsed.gitlab
  const style: React.CSSProperties = {
    position: 'absolute', left: pos.x, top: pos.y,
    width: collapsed ? 'max-content' : (renderW || undefined),
    transform: CSS.Translate.toString(transform), zIndex: isDragging ? 100 : 1, opacity: isDragging ? 0.85 : 1,
  }

  const data = gitlab.accountData[account.id] ?? { assigned: [], authored: [], reviewer: [], loading: false, error: null, lastSync: null }
  const total = data.assigned.length + data.authored.length + data.reviewer.length
  const summary = total > 0
    ? <Badge color="bg-[#F0F3F7] text-[#6B7280] dark:bg-[#1A1E28] dark:text-[#8B95A8]">{total}</Badge>
    : null

  return (
    <div ref={setNodeRef} style={{ ...style, animationDelay: `${80 + idx * 80}ms` }} className="widget-enter" data-widget="gitlab">
      {!collapsed && <ResizeHandle onDelta={handleDelta} onRelease={handleRelease} />}
      <WidgetCard
        title={`GitLab — ${account.label}`} icon={<GitLabIcon />}
        collapsed={dashboard.collapsed.gitlab} onToggleCollapse={() => setCollapsed('gitlab', !dashboard.collapsed.gitlab)}
        summary={summary} lastSync={data.lastSync} error={data.error} loading={data.loading}
        onRetry={gitlab.triggerSync} dragHandleProps={{ ...attributes, ...listeners }} accent="amber"
      >
        <GitLabWidget accountId={account.id} accountLabel="" assigned={data.assigned} authored={data.authored} reviewer={data.reviewer} loading={data.loading} />
      </WidgetCard>
    </div>
  )
}

function GitHubAccountWidget({ account, idx, dashboard }: {
  account: GitHubAccount; idx: number; dashboard: DashboardSettings
}) {
  const { setCollapsed } = useSettings()
  const github = useGitHub()

  const posKey = `github_${account.id}`
  const pos = getExtendedPosition(dashboard.positions, posKey, {
    ...GITHUB_BASE, x: GITHUB_BASE.x + idx * 20, y: GITHUB_BASE.y + idx * 20,
  })

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: posKey })
  const { renderW, handleDelta, handleRelease } = useWidgetResize(
    pos.w,
    useCallback((w) => setExtendedPosition(posKey, { ...pos, w }), [posKey, pos]),
  )

  const collapsed = dashboard.collapsed.github ?? false
  const style: React.CSSProperties = {
    position: 'absolute', left: pos.x, top: pos.y,
    width: collapsed ? 'max-content' : (renderW || undefined),
    transform: CSS.Translate.toString(transform), zIndex: isDragging ? 100 : 1, opacity: isDragging ? 0.85 : 1,
  }

  const data = github.accountData[account.id] ?? { assigned: [], authored: [], reviewRequested: [], loading: false, error: null, lastSync: null }
  const total = data.assigned.length + data.authored.length + data.reviewRequested.length
  const summary = total > 0
    ? <Badge color="bg-[#F0F3F7] text-[#6B7280] dark:bg-[#1A1E28] dark:text-[#8B95A8]">{total}</Badge>
    : null

  return (
    <div ref={setNodeRef} style={{ ...style, animationDelay: `${160 + idx * 80}ms` }} className="widget-enter" data-widget="github">
      {!collapsed && <ResizeHandle onDelta={handleDelta} onRelease={handleRelease} />}
      <WidgetCard
        title={`GitHub — ${account.label}`} icon={<GitHubIcon />}
        collapsed={dashboard.collapsed.github ?? false}
        onToggleCollapse={() => setCollapsed('github' as never, !(dashboard.collapsed.github ?? false))}
        summary={summary} lastSync={data.lastSync} error={data.error} loading={data.loading}
        onRetry={github.triggerSync} dragHandleProps={{ ...attributes, ...listeners }} accent="cyan"
      >
        <GitHubWidget assigned={data.assigned} authored={data.authored} reviewRequested={data.reviewRequested} loading={data.loading} />
      </WidgetCard>
    </div>
  )
}

function NoteWidgetItem({ dashboard }: { dashboard: DashboardSettings }) {
  const { setCollapsed, setWidgetPosition } = useSettings()
  const pos = dashboard.positions.note

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: 'note' })
  const { renderW, handleDelta, handleRelease } = useWidgetResize(
    pos.w,
    useCallback((w) => setWidgetPosition('note', { ...pos, w }), [pos, setWidgetPosition]),
  )

  const style: React.CSSProperties = {
    position: 'absolute', left: pos.x, bottom: pos.y, width: renderW || undefined,
    transform: CSS.Translate.toString(transform), zIndex: isDragging ? 100 : 1, opacity: isDragging ? 0.85 : 1,
  }

  return (
    <div ref={setNodeRef} style={{ ...style, animationDelay: '240ms' }} className="widget-enter" data-widget="note">
      <ResizeHandle onDelta={handleDelta} onRelease={handleRelease} />
      <WidgetCard
        title="Notes" icon={<NoteIcon />}
        collapsed={dashboard.collapsed.note} onToggleCollapse={() => setCollapsed('note', !dashboard.collapsed.note)}
        lastSync={null} dragHandleProps={{ ...attributes, ...listeners }} accent="violet"
      >
        <NoteWidget />
      </WidgetCard>
    </div>
  )
}

function TodoWidgetItem({ dashboard }: { dashboard: DashboardSettings }) {
  const { setCollapsed, setWidgetPosition } = useSettings()
  const pos = dashboard.positions.todo

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: 'todo' })
  const { renderW, handleDelta, handleRelease } = useWidgetResize(
    pos.w,
    useCallback((w) => setWidgetPosition('todo', { ...pos, w }), [pos, setWidgetPosition]),
  )

  const collapsed = dashboard.collapsed.todo
  const style: React.CSSProperties = {
    position: 'absolute', left: pos.x, top: pos.y,
    width: collapsed ? 'max-content' : (renderW || undefined),
    transform: CSS.Translate.toString(transform), zIndex: isDragging ? 100 : 1, opacity: isDragging ? 0.85 : 1,
  }

  return (
    <div ref={setNodeRef} style={{ ...style, animationDelay: '160ms' }} className="widget-enter" data-widget="todo">
      {!collapsed && <ResizeHandle onDelta={handleDelta} onRelease={handleRelease} />}
      <WidgetCard
        title="Todos" icon={<TodoIcon />}
        collapsed={dashboard.collapsed.todo} onToggleCollapse={() => setCollapsed('todo', !dashboard.collapsed.todo)}
        lastSync={null} dragHandleProps={{ ...attributes, ...listeners }} accent="green"
      >
        <TodoWidget />
      </WidgetCard>
    </div>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export function Dashboard() {
  const { dashboard, jiraAccounts, gitlabAccounts, githubAccounts, setWidgetPosition } = useSettings()

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
    } else if (id.startsWith('github_')) {
      const idx = githubAccounts.findIndex((a) => `github_${a.id}` === id)
      if (idx === -1) return
      current = getExtendedPosition(dashboard.positions, id, {
        ...GITHUB_BASE, x: GITHUB_BASE.x + idx * 20, y: GITHUB_BASE.y + idx * 20,
      })
    }

    if (!current) return

    // Note is bottom-anchored, so dragging down should decrease y (distance from bottom)
    const yDelta = id === 'note' ? -delta.y : delta.y
    const updated: WidgetPosition = {
      ...current,
      x: Math.max(0, current.x + delta.x),
      y: Math.max(0, current.y + yDelta),
    }

    if (id === 'todo' || id === 'note') {
      setWidgetPosition(id, updated)
    } else {
      setExtendedPosition(id, updated)
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <main className="relative overflow-hidden" style={{ height: 'calc(100vh - 44px)' }}>
        <CenterClock />

        {dashboard.widgets.jira &&
          jiraAccounts.map((account, idx) => (
            <JiraAccountWidget key={account.id} account={account} idx={idx} dashboard={dashboard} />
          ))}

        {dashboard.widgets.gitlab &&
          gitlabAccounts.map((account, idx) => (
            <GitLabAccountWidget key={account.id} account={account} idx={idx} dashboard={dashboard} />
          ))}

        {githubAccounts.map((account, idx) => (
          <GitHubAccountWidget key={account.id} account={account} idx={idx} dashboard={dashboard} />
        ))}

        {dashboard.widgets.todo && <TodoWidgetItem dashboard={dashboard} />}
      </main>
    </DndContext>
  )
}
