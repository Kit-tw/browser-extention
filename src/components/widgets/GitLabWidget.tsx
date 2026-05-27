import React, { useState } from 'react'
import { Skeleton } from '../shared/Skeleton'
import { EmptyState } from '../shared/EmptyState'
import { Badge } from '../shared/Badge'
import { formatRelativeTime } from '../../utils/time'
import type { GitLabMR, PipelineStatus } from '../../types/gitlab.types'

function pipelineStatusDot(status: PipelineStatus): { color: string; label: string } {
  switch (status) {
    case 'success':
      return { color: 'bg-green-500', label: 'Pipeline passed' }
    case 'failed':
      return { color: 'bg-red-500', label: 'Pipeline failed' }
    case 'running':
      return { color: 'bg-yellow-400 animate-pulse', label: 'Pipeline running' }
    case 'pending':
      return { color: 'bg-gray-400', label: 'Pipeline pending' }
    default:
      return { color: 'bg-gray-300 dark:bg-gray-600', label: 'No pipeline' }
  }
}

function MRRow({ mr }: { mr: GitLabMR }) {
  const pipeline = pipelineStatusDot(mr.head_pipeline?.status ?? null)
  const ref = mr.references?.full || `!${mr.iid}`

  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span
        className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${pipeline.color}`}
        title={pipeline.label}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <a
            href={mr.web_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            {ref}
          </a>

          {mr.draft && (
            <Badge color="bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              Draft
            </Badge>
          )}

          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded font-mono truncate max-w-[100px]">
            {mr.target_branch}
          </span>

          <span className="text-xs text-gray-400 dark:text-gray-400 ml-auto shrink-0">
            {formatRelativeTime(mr.updated_at)}
          </span>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-200 mt-0.5 leading-snug truncate">
          {mr.title}
        </p>
      </div>
    </div>
  )
}

interface MRSectionProps {
  title: string
  mrs: GitLabMR[]
}

function MRSection({ title, mrs }: MRSectionProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="mb-2">
      <button
        className="flex items-center gap-1.5 w-full py-1 text-left group"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className={`text-gray-400 transition-transform duration-150 ${expanded ? '' : '-rotate-90'}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{title}</span>
        <Badge color="bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          {mrs.length}
        </Badge>
      </button>

      {expanded && (
        <div className="ml-2">
          {mrs.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-400 py-1 pl-1">None</p>
          ) : (
            mrs.map((mr) => <MRRow key={mr.id} mr={mr} />)
          )}
        </div>
      )}
    </div>
  )
}

interface GitLabWidgetProps {
  accountId: string
  accountLabel: string
  assigned: GitLabMR[]
  authored: GitLabMR[]
  reviewer: GitLabMR[]
  loading: boolean
}

export function GitLabWidget({ accountId: _accountId, accountLabel, assigned, authored, reviewer, loading }: GitLabWidgetProps) {
  if (loading) {
    return <Skeleton lines={4} className="py-2" />
  }

  const total = assigned.length + authored.length + reviewer.length

  return (
    <div>
      {accountLabel && (
        <p className="text-xs text-gray-400 dark:text-gray-400 mb-2">{accountLabel}</p>
      )}
      {total === 0 ? (
        <EmptyState message="No open merge requests" />
      ) : (
        <div className="max-h-80 overflow-y-auto pr-1 -mr-1">
          <MRSection title="Assigned to me" mrs={assigned} />
          <MRSection title="Authored by me" mrs={authored} />
          <MRSection title="Reviewing" mrs={reviewer} />
        </div>
      )}
    </div>
  )
}
