import React, { useState, useEffect } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { testJiraConnection } from '../../services/jira.service'
import { testGitLabConnection } from '../../services/gitlab.service'
import { testGitHubConnection } from '../../services/github.service'
import { BackgroundSettings } from './BackgroundSettings'
import type { JiraAccount, GitLabAccount, GitHubAccount, WidgetId, Reminder, NotificationSchedule } from '../../types/settings.types'
import type { BillingCycle, DueDateModel } from '../../types/reminder.types'

// ── Shared form primitives ──────────────────────────────────────────────────

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {children}
    </label>
  )
}

function TextInput({
  id, value, onChange, placeholder, type = 'text',
}: {
  id?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  )
}

function PasswordInput({ id, value, onChange, placeholder }: {
  id?: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="new-password"
        className="w-full pr-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        aria-label={show ? 'Hide' : 'Show'}
      >
        {show ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  )
}

type TestStatus = { ok: boolean; message: string } | null

function TestResult({ status }: { status: TestStatus }) {
  if (!status) return null
  return (
    <p className={`text-sm mt-1 ${status.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
      {status.ok ? '✓ ' : '✕ '}{status.message}
    </p>
  )
}

// ── Jira account form ──────────────────────────────────────────────────────

interface JiraFormState {
  label: string; baseUrl: string; email: string; apiToken: string
}

function JiraAccountForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: JiraFormState
  onSave: (f: JiraFormState) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<JiraFormState>(
    initial ?? { label: '', baseUrl: '', email: '', apiToken: '' },
  )
  const [testStatus, setTestStatus] = useState<TestStatus>(null)
  const [testing, setTesting] = useState(false)

  const handleTest = async () => {
    setTesting(true)
    setTestStatus(null)
    const result = await testJiraConnection(form.baseUrl, form.email, form.apiToken)
    setTestStatus({ ok: result.ok, message: result.ok ? `Connected as ${result.name}` : (result.error ?? 'Failed') })
    setTesting(false)
  }

  const valid = form.label.trim() && form.baseUrl.trim() && form.email.trim() && form.apiToken.trim()

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3 mt-2">
      <div>
        <Label htmlFor="jira-label">Label</Label>
        <TextInput id="jira-label" value={form.label} onChange={(v) => setForm((f) => ({ ...f, label: v }))} placeholder="Work Jira" />
      </div>
      <div>
        <Label htmlFor="jira-url">Base URL</Label>
        <TextInput id="jira-url" value={form.baseUrl} onChange={(v) => setForm((f) => ({ ...f, baseUrl: v }))} placeholder="https://yourcompany.atlassian.net" />
      </div>
      <div>
        <Label htmlFor="jira-email">Email</Label>
        <TextInput id="jira-email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="you@example.com" />
      </div>
      <div>
        <Label htmlFor="jira-token">API Token</Label>
        <PasswordInput id="jira-token" value={form.apiToken} onChange={(v) => setForm((f) => ({ ...f, apiToken: v }))} placeholder="Your Jira API token" />
      </div>
      <TestResult status={testStatus} />
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleTest}
          disabled={testing || !form.baseUrl || !form.email || !form.apiToken}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {testing ? 'Testing…' : 'Test'}
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!valid}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── GitLab account form ────────────────────────────────────────────────────

interface GitLabFormState { label: string; baseUrl: string; token: string }

function GitLabAccountForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: GitLabFormState
  onSave: (f: GitLabFormState) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<GitLabFormState>(
    initial ?? { label: '', baseUrl: 'https://gitlab.com', token: '' },
  )
  const [testStatus, setTestStatus] = useState<TestStatus>(null)
  const [testing, setTesting] = useState(false)

  const handleTest = async () => {
    setTesting(true)
    setTestStatus(null)
    const result = await testGitLabConnection(form.baseUrl, form.token)
    setTestStatus({ ok: result.ok, message: result.ok ? `Connected as @${result.username}` : (result.error ?? 'Failed') })
    setTesting(false)
  }

  const valid = form.label.trim() && form.baseUrl.trim() && form.token.trim()

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3 mt-2">
      <div>
        <Label htmlFor="gl-label">Label</Label>
        <TextInput id="gl-label" value={form.label} onChange={(v) => setForm((f) => ({ ...f, label: v }))} placeholder="Work GitLab" />
      </div>
      <div>
        <Label htmlFor="gl-url">Base URL</Label>
        <TextInput id="gl-url" value={form.baseUrl} onChange={(v) => setForm((f) => ({ ...f, baseUrl: v }))} placeholder="https://gitlab.com" />
      </div>
      <div>
        <Label htmlFor="gl-token">Personal Access Token</Label>
        <PasswordInput id="gl-token" value={form.token} onChange={(v) => setForm((f) => ({ ...f, token: v }))} placeholder="glpat-xxxxxxxxxxxxxxxxxxxx" />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Requires <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">read_api</code> scope.
        </p>
      </div>
      <TestResult status={testStatus} />
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleTest}
          disabled={testing || !form.baseUrl || !form.token}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {testing ? 'Testing…' : 'Test'}
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!valid}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── GitHub account form ───────────────────────────────────────────────────

interface GitHubFormState { label: string; token: string }

function GitHubAccountForm({
  initial, onSave, onCancel,
}: {
  initial?: GitHubFormState
  onSave: (f: GitHubFormState) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<GitHubFormState>(initial ?? { label: '', token: '' })
  const [testStatus, setTestStatus] = useState<TestStatus>(null)
  const [testing, setTesting] = useState(false)

  const handleTest = async () => {
    setTesting(true)
    setTestStatus(null)
    const result = await testGitHubConnection(form.token)
    setTestStatus({ ok: result.ok, message: result.ok ? `Connected as @${result.login}` : (result.error ?? 'Failed') })
    setTesting(false)
  }

  const valid = form.label.trim() && form.token.trim()

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3 mt-2">
      <div>
        <Label htmlFor="gh-label">Label</Label>
        <TextInput id="gh-label" value={form.label} onChange={(v) => setForm((f) => ({ ...f, label: v }))} placeholder="Work GitHub" />
      </div>
      <div>
        <Label htmlFor="gh-token">Personal Access Token</Label>
        <PasswordInput id="gh-token" value={form.token} onChange={(v) => setForm((f) => ({ ...f, token: v }))} placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Requires <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">repo</code> scope (or fine-grained read access to pull requests).
        </p>
      </div>
      <TestResult status={testStatus} />
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleTest}
          disabled={testing || !form.token}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {testing ? 'Testing…' : 'Test'}
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!valid}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:underline">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Tab components ─────────────────────────────────────────────────────────

function JiraTab() {
  const { jiraAccounts, addJiraAccount, updateJiraAccount, removeJiraAccount } = useSettings()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  function generateId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
  }

  const handleAdd = (form: JiraFormState) => {
    addJiraAccount({ id: generateId(), ...form })
    setAdding(false)
    try { chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' }) } catch { /* ignore */ }
  }

  const handleEdit = (id: string, form: JiraFormState) => {
    updateJiraAccount(id, form)
    setEditingId(null)
    try { chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' }) } catch { /* ignore */ }
  }

  return (
    <div className="space-y-3">
      {jiraAccounts.map((account) => (
        <div key={account.id}>
          {editingId === account.id ? (
            <JiraAccountForm
              initial={{ label: account.label, baseUrl: account.baseUrl, email: account.email, apiToken: account.apiToken }}
              onSave={(f) => handleEdit(account.id, f)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{account.label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{account.baseUrl}</p>
              </div>
              <button
                onClick={() => setEditingId(account.id)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0"
              >
                Edit
              </button>
              <button
                onClick={() => removeJiraAccount(account.id)}
                className="text-xs text-red-500 dark:text-red-400 hover:underline shrink-0"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}

      {jiraAccounts.length === 0 && !adding && (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No Jira accounts configured.</p>
      )}

      {adding ? (
        <JiraAccountForm onSave={handleAdd} onCancel={() => setAdding(false)} />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          + Add Account
        </button>
      )}
    </div>
  )
}

function GitLabTab() {
  const { gitlabAccounts, addGitLabAccount, updateGitLabAccount, removeGitLabAccount } = useSettings()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  function generateId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
  }

  const handleAdd = (form: GitLabFormState) => {
    addGitLabAccount({ id: generateId(), ...form })
    setAdding(false)
    try { chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' }) } catch { /* ignore */ }
  }

  const handleEdit = (id: string, form: GitLabFormState) => {
    updateGitLabAccount(id, form)
    setEditingId(null)
    try { chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' }) } catch { /* ignore */ }
  }

  return (
    <div className="space-y-3">
      {gitlabAccounts.map((account) => (
        <div key={account.id}>
          {editingId === account.id ? (
            <GitLabAccountForm
              initial={{ label: account.label, baseUrl: account.baseUrl, token: account.token }}
              onSave={(f) => handleEdit(account.id, f)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{account.label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{account.baseUrl}</p>
              </div>
              <button
                onClick={() => setEditingId(account.id)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0"
              >
                Edit
              </button>
              <button
                onClick={() => removeGitLabAccount(account.id)}
                className="text-xs text-red-500 dark:text-red-400 hover:underline shrink-0"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}

      {gitlabAccounts.length === 0 && !adding && (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No GitLab accounts configured.</p>
      )}

      {adding ? (
        <GitLabAccountForm onSave={handleAdd} onCancel={() => setAdding(false)} />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          + Add Account
        </button>
      )}
    </div>
  )
}

function GitHubTab() {
  const { githubAccounts, addGitHubAccount, updateGitHubAccount, removeGitHubAccount } = useSettings()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  function generateId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
  }

  const handleAdd = (form: GitHubFormState) => {
    addGitHubAccount({ id: generateId(), ...form } as GitHubAccount)
    setAdding(false)
    try { chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' }) } catch { /* ignore */ }
  }

  const handleEdit = (id: string, form: GitHubFormState) => {
    updateGitHubAccount(id, form)
    setEditingId(null)
    try { chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' }) } catch { /* ignore */ }
  }

  return (
    <div className="space-y-3">
      {githubAccounts.map((account) => (
        <div key={account.id}>
          {editingId === account.id ? (
            <GitHubAccountForm
              initial={{ label: account.label, token: account.token }}
              onSave={(f) => handleEdit(account.id, f)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{account.label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">github.com</p>
              </div>
              <button onClick={() => setEditingId(account.id)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0">Edit</button>
              <button onClick={() => removeGitHubAccount(account.id)} className="text-xs text-red-500 dark:text-red-400 hover:underline shrink-0">Delete</button>
            </div>
          )}
        </div>
      ))}

      {githubAccounts.length === 0 && !adding && (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No GitHub accounts configured.</p>
      )}

      {adding ? (
        <GitHubAccountForm onSave={handleAdd} onCancel={() => setAdding(false)} />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          + Add Account
        </button>
      )}
    </div>
  )
}

function DashboardTab() {
  const { dashboard, updateDashboard, setDefaultWidget } = useSettings()

  const handleIntervalChange = (minutes: number) => {
    updateDashboard({ refreshIntervalMinutes: minutes })
    try {
      chrome.runtime.sendMessage({ type: 'UPDATE_INTERVAL', minutes })
    } catch { /* ignore */ }
  }

  const defaultWidgetOptions: { value: string; label: string }[] = [
    { value: 'jira', label: 'Jira' },
    { value: 'gitlab', label: 'GitLab' },
    { value: 'github', label: 'GitHub' },
    { value: 'todo', label: 'Todos' },
    { value: 'reminders', label: 'Reminders' },
  ]

  const widgetLabels: Record<WidgetId, string> = {
    jira: 'Jira',
    gitlab: 'GitLab',
    todo: 'Todos',
    note: 'Notes',
    reminders: 'Reminders',
  }

  return (
    <div className="space-y-5">
      <div>
        <Label>Default Widget</Label>
        <div className="flex gap-2 flex-wrap">
          {defaultWidgetOptions.map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="defaultWidget"
                value={opt.value}
                checked={(dashboard.defaultWidget ?? 'jira') === opt.value}
                onChange={() => setDefaultWidget(opt.value as import('../../types/settings.types').ActiveWidget)}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>Refresh Interval</Label>
        <div className="flex gap-3 flex-wrap">
          {[1, 5, 10, 30].map((mins) => (
            <label key={mins} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="interval"
                value={mins}
                checked={dashboard.refreshIntervalMinutes === mins}
                onChange={() => handleIntervalChange(mins)}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{mins} min</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>Theme</Label>
        <div className="flex gap-4">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <label key={t} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value={t}
                checked={dashboard.theme === t}
                onChange={() => updateDashboard({ theme: t })}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{t}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>Widget Visibility</Label>
        <div className="flex flex-col gap-2">
          {(Object.keys(widgetLabels) as WidgetId[]).map((w) => (
            <label key={w} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dashboard.widgets[w]}
                onChange={(e) =>
                  updateDashboard({
                    widgets: { ...dashboard.widgets, [w]: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{widgetLabels[w]}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Reminder helpers ───────────────────────────────────────────────────────

function toInputDate(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split('-')
  return `${y}-${m}-${d}`
}

function fromInputDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split('-')
  return `${d}-${m}-${y}`
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

interface ReminderFormState {
  name: string
  type: 'subscription' | 'payment'
  amount: string
  billingCycleUnit: 'monthly' | 'yearly' | 'weekly' | 'every-n-days'
  billingCycleN: number
  dueDateModelKind: 'fixed-day' | 'billing-offset'
  billingStartDay: number
  offsetDays: number
  nextDueDateInput: string
}

const EMPTY_REMINDER_FORM: ReminderFormState = {
  name: '',
  type: 'subscription',
  amount: '',
  billingCycleUnit: 'monthly',
  billingCycleN: 30,
  dueDateModelKind: 'fixed-day',
  billingStartDay: 1,
  offsetDays: 45,
  nextDueDateInput: '',
}

function reminderToForm(r: Reminder): ReminderFormState {
  return {
    name: r.name,
    type: r.type,
    amount: r.amount ?? '',
    billingCycleUnit: r.billingCycle.unit,
    billingCycleN: r.billingCycle.unit === 'every-n-days' ? r.billingCycle.n : 30,
    dueDateModelKind: r.dueDateModel.kind,
    billingStartDay: r.dueDateModel.kind === 'billing-offset' ? r.dueDateModel.billingStartDay : 1,
    offsetDays: r.dueDateModel.kind === 'billing-offset' ? r.dueDateModel.offsetDays : 45,
    nextDueDateInput: toInputDate(r.nextDueDate),
  }
}

function formToReminder(form: ReminderFormState, id: string): Reminder {
  const billingCycle: BillingCycle = form.billingCycleUnit === 'every-n-days'
    ? { unit: 'every-n-days', n: form.billingCycleN }
    : { unit: form.billingCycleUnit }

  const nextDueDate = fromInputDate(form.nextDueDateInput)
  const dayOfCycle = parseInt(nextDueDate.split('-')[0])

  const dueDateModel: DueDateModel = form.dueDateModelKind === 'fixed-day'
    ? { kind: 'fixed-day', dayOfCycle }
    : { kind: 'billing-offset', billingStartDay: form.billingStartDay, offsetDays: form.offsetDays }

  return {
    id,
    name: form.name.trim(),
    type: form.type,
    amount: form.amount.trim() || undefined,
    billingCycle,
    dueDateModel,
    nextDueDate,
  }
}

// ── Reminder form ──────────────────────────────────────────────────────────

function ReminderForm({
  initial, onSave, onCancel,
}: {
  initial?: ReminderFormState
  onSave: (f: ReminderFormState) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<ReminderFormState>(initial ?? EMPTY_REMINDER_FORM)
  const f = (patch: Partial<ReminderFormState>) => setForm((s) => ({ ...s, ...patch }))
  const valid = form.name.trim() && form.nextDueDateInput

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3 mt-2">
      <div>
        <Label htmlFor="rem-name">Name</Label>
        <TextInput id="rem-name" value={form.name} onChange={(v) => f({ name: v })} placeholder="Netflix, Credit Card…" />
      </div>

      <div>
        <Label>Type</Label>
        <div className="flex gap-4">
          {(['subscription', 'payment'] as const).map((t) => (
            <label key={t} className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="rem-type" value={t} checked={form.type === t}
                onChange={() => f({ type: t })} className="accent-blue-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{t}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="rem-amount">Amount (optional)</Label>
        <TextInput id="rem-amount" value={form.amount} onChange={(v) => f({ amount: v })} placeholder="e.g. ฿15,000 or $20/mo" />
      </div>

      <div>
        <Label htmlFor="rem-cycle">Billing Cycle</Label>
        <select
          id="rem-cycle"
          value={form.billingCycleUnit}
          onChange={(e) => f({ billingCycleUnit: e.target.value as ReminderFormState['billingCycleUnit'] })}
          className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="weekly">Weekly</option>
          <option value="every-n-days">Every N days</option>
        </select>
        {form.billingCycleUnit === 'every-n-days' && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Every</span>
            <input
              type="number" min={1} max={365}
              value={form.billingCycleN}
              onChange={(e) => f({ billingCycleN: parseInt(e.target.value) || 30 })}
              className="w-20 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">days</span>
          </div>
        )}
      </div>

      <div>
        <Label>Due Date Model</Label>
        <div className="flex gap-4 mb-2">
          {(['fixed-day', 'billing-offset'] as const).map((k) => (
            <label key={k} className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="rem-model" value={k} checked={form.dueDateModelKind === k}
                onChange={() => f({ dueDateModelKind: k })} className="accent-blue-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {k === 'fixed-day' ? 'Fixed day' : 'Billing offset'}
              </span>
            </label>
          ))}
        </div>
        {form.dueDateModelKind === 'billing-offset' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 dark:text-gray-400">Billing starts on day</span>
            <input type="number" min={1} max={31} value={form.billingStartDay}
              onChange={(e) => f({ billingStartDay: parseInt(e.target.value) || 1 })}
              className="w-16 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">due after</span>
            <input type="number" min={1} max={365} value={form.offsetDays}
              onChange={(e) => f({ offsetDays: parseInt(e.target.value) || 45 })}
              className="w-20 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">days</span>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="rem-due">Next Due Date</Label>
        <input
          id="rem-due"
          type="date"
          value={form.nextDueDateInput}
          onChange={(e) => f({ nextDueDateInput: e.target.value })}
          className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(form)} disabled={!valid}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Save
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:underline">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Reminders tab ──────────────────────────────────────────────────────────

function RemindersTab() {
  const { reminders, addReminder, updateReminder, removeReminder, dashboard, updateNotificationSchedule } = useSettings()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const schedule = dashboard.notificationSchedule
  const [newTime, setNewTime] = useState('09:00')

  const handleAdd = (form: ReminderFormState) => {
    addReminder(formToReminder(form, generateId()))
    setAdding(false)
    try { chrome.runtime.sendMessage({ type: 'UPDATE_REMINDER_SCHEDULE', schedule }) } catch { /* ignore */ }
  }

  const handleEdit = (id: string, form: ReminderFormState) => {
    updateReminder(id, formToReminder(form, id))
    setEditingId(null)
  }

  const addTime = () => {
    if (!newTime || schedule.times.includes(newTime)) return
    const times = [...schedule.times, newTime].sort()
    updateNotificationSchedule({ ...schedule, times })
    try { chrome.runtime.sendMessage({ type: 'UPDATE_REMINDER_SCHEDULE', schedule: { ...schedule, times } }) } catch { /* ignore */ }
  }

  const removeTime = (t: string) => {
    const times = schedule.times.filter((x) => x !== t)
    updateNotificationSchedule({ ...schedule, times })
    try { chrome.runtime.sendMessage({ type: 'UPDATE_REMINDER_SCHEDULE', schedule: { ...schedule, times } }) } catch { /* ignore */ }
  }

  return (
    <div className="space-y-5">
      {/* Reminder list */}
      <div className="space-y-2">
        {reminders.map((r) => (
          <div key={r.id}>
            {editingId === r.id ? (
              <ReminderForm
                initial={reminderToForm(r)}
                onSave={(f) => handleEdit(r.id, f)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{r.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {r.type} · {r.billingCycle.unit === 'every-n-days' ? `every ${r.billingCycle.n}d` : r.billingCycle.unit}
                    {r.amount ? ` · ${r.amount}` : ''}
                  </p>
                </div>
                <button onClick={() => setEditingId(r.id)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0">Edit</button>
                <button onClick={() => removeReminder(r.id)}
                  className="text-xs text-red-500 dark:text-red-400 hover:underline shrink-0">Delete</button>
              </div>
            )}
          </div>
        ))}

        {reminders.length === 0 && !adding && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No reminders yet.</p>
        )}

        {adding ? (
          <ReminderForm onSave={handleAdd} onCancel={() => setAdding(false)} />
        ) : (
          <button onClick={() => setAdding(true)}
            className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            + Add Reminder
          </button>
        )}
      </div>

      {/* Notification schedule */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Notification Schedule</h3>

        <div>
          <Label>Warn within</Label>
          <div className="flex items-center gap-2">
            <input type="number" min={1} max={90}
              value={schedule.warnWithinDays}
              onChange={(e) => updateNotificationSchedule({ ...schedule, warnWithinDays: parseInt(e.target.value) || 7 })}
              className="w-20 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">days</span>
          </div>
        </div>

        <div>
          <Label>Daily notification times</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {schedule.times.map((t) => (
              <span key={t} className="flex items-center gap-1 text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                {t}
                <button onClick={() => removeTime(t)}
                  className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  aria-label={`Remove ${t}`}>
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={addTime}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Add Time
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main SettingsPanel ─────────────────────────────────────────────────────

type Tab = 'jira' | 'gitlab' | 'github' | 'dashboard' | 'reminders' | 'background'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('jira')

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const tabs: { id: Tab; label: string }[] = [
    { id: 'jira', label: 'Jira' },
    { id: 'gitlab', label: 'GitLab' },
    { id: 'github', label: 'GitHub' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'reminders', label: 'Reminders' },
    { id: 'background', label: 'Background' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative ml-auto w-[480px] max-w-full h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'jira' && <JiraTab />}
          {activeTab === 'gitlab' && <GitLabTab />}
          {activeTab === 'github' && <GitHubTab />}
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'reminders' && <RemindersTab />}
          {activeTab === 'background' && <BackgroundSettings />}
        </div>
      </div>
    </div>
  )
}
