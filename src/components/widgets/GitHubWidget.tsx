import React, { useState } from 'react'
import { Skeleton } from '../shared/Skeleton'
import { EmptyState } from '../shared/EmptyState'
import { Badge } from '../shared/Badge'
import { formatRelativeTime } from '../../utils/time'
import type { CIStatus, GitHubPR } from '../../types/github.types'

function repoName(repositoryUrl: string): string {
  return repositoryUrl.replace('https://api.github.com/repos/', '')
}

function ciStatusDot(status: CIStatus): { color: string; label: string } {
  switch (status) {
    case 'success':  return { color: 'bg-green-500',                      label: 'CI passed' }
    case 'failure':  return { color: 'bg-red-500',                        label: 'CI failed' }
    case 'pending':  return { color: 'bg-yellow-400 animate-pulse',       label: 'CI running' }
    case 'neutral':  return { color: 'bg-gray-400',                       label: 'CI neutral' }
    default:         return { color: 'bg-gray-300 dark:bg-gray-600',      label: 'No CI' }
  }
}

function PRRow({ pr }: { pr: GitHubPR }) {
  const dot = ciStatusDot(pr.ci_status)
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span
        className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${dot.color}`}
        title={dot.label}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <a
            href={pr.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            #{pr.number}
          </a>

          {pr.draft && (
            <Badge color="bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">Draft</Badge>
          )}

          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded font-mono truncate max-w-[120px]">
            {repoName(pr.repository_url)}
          </span>

          <span className="text-xs text-gray-400 dark:text-gray-400 ml-auto shrink-0">
            {formatRelativeTime(pr.updated_at)}
          </span>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-200 mt-0.5 leading-snug truncate">
          {pr.title}
        </p>
      </div>
    </div>
  )
}

function PRSection({ title, prs }: { title: string; prs: GitHubPR[] }) {
  const [expanded, setExpanded] = useState(true)
  return (
    <div className="mb-2">
      <button
        className="flex items-center gap-1.5 w-full py-1 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className={`text-gray-400 transition-transform duration-150 ${expanded ? '' : '-rotate-90'}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{title}</span>
        <Badge color="bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">{prs.length}</Badge>
      </button>

      {expanded && (
        <div className="ml-2">
          {prs.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-400 py-1 pl-1">None</p>
          ) : (
            prs.map((pr) => <PRRow key={pr.id} pr={pr} />)
          )}
        </div>
      )}
    </div>
  )
}

interface GitHubWidgetProps {
  assigned: GitHubPR[]
  authored: GitHubPR[]
  reviewRequested: GitHubPR[]
  loading: boolean
}

export function GitHubWidget({ assigned, authored, reviewRequested, loading }: GitHubWidgetProps) {
  if (loading) return <Skeleton lines={4} className="py-2" />

  const total = assigned.length + authored.length + reviewRequested.length

  return (
    <div>
      {total === 0 ? (
        <EmptyState message="No open pull requests" />
      ) : (
        <div className="max-h-80 overflow-y-auto pr-1 -mr-1">
          <PRSection title="Review requested" prs={reviewRequested} />
          <PRSection title="My PRs" prs={authored} />
          <PRSection title="Assigned to me" prs={assigned} />
        </div>
      )}
    </div>
  )
}
