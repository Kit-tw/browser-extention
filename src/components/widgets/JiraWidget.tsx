import React from 'react'
import { Skeleton } from '../shared/Skeleton'
import { EmptyState } from '../shared/EmptyState'
import { Badge } from '../shared/Badge'
import type { JiraIssue } from '../../types/jira.types'

function priorityDot(priorityName: string | undefined): string {
  switch (priorityName?.toLowerCase()) {
    case 'urgent':
    case 'blocker':
      return 'bg-red-500'
    case 'high':
      return 'bg-orange-500'
    case 'medium':
      return 'bg-yellow-400'
    case 'low':
      return 'bg-blue-400'
    default:
      return 'bg-gray-300'
  }
}

function statusColor(categoryKey: string): string {
  switch (categoryKey) {
    case 'new':
    case 'undefined':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
    case 'indeterminate':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    case 'done':
      return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  }
}

function IssueCard({ issue, baseUrl }: { issue: JiraIssue; baseUrl: string }) {
  const { fields } = issue
  const isOverdue = fields.duedate ? new Date(fields.duedate) < new Date() : false

  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span
        className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${priorityDot(fields.priority?.name)}`}
        title={fields.priority?.name || 'Unknown priority'}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`${baseUrl}/browse/${issue.key}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            {issue.key}
          </a>

          <Badge className={statusColor(fields.status.statusCategory.key)}>
            {fields.status.name}
          </Badge>

          {fields.duedate && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                isOverdue
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {fields.duedate}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-200 mt-0.5 leading-snug line-clamp-2">
          {fields.summary}
        </p>
      </div>
    </div>
  )
}

interface JiraWidgetProps {
  accountId: string
  accountLabel: string
  issues: JiraIssue[]
  loading: boolean
  baseUrl: string
}

export function JiraWidget({ accountId: _accountId, accountLabel, issues, loading, baseUrl }: JiraWidgetProps) {
  if (loading) {
    return <Skeleton lines={4} className="py-2" />
  }

  const todoCount = issues.filter(
    (i) => i.fields.status.statusCategory.key === 'new' || i.fields.status.statusCategory.key === 'undefined',
  ).length
  const inProgressCount = issues.filter(
    (i) => i.fields.status.statusCategory.key === 'indeterminate',
  ).length
  const doneCount = issues.filter(
    (i) => i.fields.status.statusCategory.key === 'done',
  ).length

  return (
    <div>
      {accountLabel && (
        <p className="text-xs text-gray-400 dark:text-gray-400 mb-2">{accountLabel}</p>
      )}

      {issues.length > 0 && (
        <div className="flex gap-3 py-2 mb-1">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{todoCount}</span>
            <span className="text-xs text-gray-400 dark:text-gray-400">To Do</span>
          </div>
          <div className="w-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{inProgressCount}</span>
            <span className="text-xs text-gray-400 dark:text-gray-400">In Progress</span>
          </div>
          <div className="w-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {issues.filter((i) => i.fields.status.name.toLowerCase().includes('review')).length}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-400">In Review</span>
          </div>
          <div className="w-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-green-600 dark:text-green-400">{doneCount}</span>
            <span className="text-xs text-gray-400 dark:text-gray-400">Done</span>
          </div>
        </div>
      )}

      {issues.length === 0 ? (
        <EmptyState message="No open Jira issues assigned to you" />
      ) : (
        <div className="max-h-72 overflow-y-auto pr-1 -mr-1">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} baseUrl={baseUrl} />
          ))}
        </div>
      )}
    </div>
  )
}
