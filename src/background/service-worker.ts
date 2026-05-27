// Service Worker — plain TypeScript only, no React
import { fetchJiraIssues } from '../services/jira.service'
import { fetchAssignedMRs, fetchAuthoredMRs, fetchReviewerMRs } from '../services/gitlab.service'
import { fetchAssignedPRs, fetchAuthoredPRs, fetchReviewRequestedPRs } from '../services/github.service'
import type { StoredSettings, JiraAccount, GitLabAccount, GitHubAccount } from '../types/settings.types'

const SYNC_ALARM = 'sync-data'
const DEFAULT_INTERVAL_MINUTES = 5

async function getSettings(): Promise<StoredSettings | null> {
  try {
    const result = await chrome.storage.local.get('settings')
    return (result['settings'] as StoredSettings) || null
  } catch {
    return null
  }
}

async function initDefaultSettings(): Promise<void> {
  try {
    const result = await chrome.storage.local.get('settings')
    if (!result['settings']) {
      await chrome.storage.local.set({
        settings: {
          jiraAccounts: [],
          gitlabAccounts: [],
          dashboard: {
            refreshIntervalMinutes: DEFAULT_INTERVAL_MINUTES,
            theme: 'system',
            widgets: { jira: true, gitlab: true, todo: true },
            collapsed: { jira: false, gitlab: false, todo: false },
            positions: {
              jira:   { x: 20,  y: 80, w: 420, h: 0 },
              gitlab: { x: 460, y: 80, w: 420, h: 0 },
              todo:   { x: 900, y: 80, w: 380, h: 0 },
            },
          },
        },
      })
    }
  } catch {
    // Silently fail
  }
}

async function createAlarms(intervalMinutes: number): Promise<void> {
  try {
    await chrome.alarms.clear(SYNC_ALARM)
    await chrome.alarms.create(SYNC_ALARM, {
      periodInMinutes: intervalMinutes,
      delayInMinutes: intervalMinutes,
    })
} catch {
    // Silently fail
  }
}

async function syncJiraAccount(account: JiraAccount): Promise<void> {
  const { id, baseUrl, email, apiToken } = account
  if (!baseUrl || !email || !apiToken) return

  try {
    const issues = await fetchJiraIssues(baseUrl, email, apiToken)
    await chrome.storage.local.set({
      [`cache_jira_${id}`]: {
        issues,
        lastSync: new Date().toISOString(),
        error: null,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error syncing Jira'
    await chrome.storage.local.set({
      [`cache_jira_${id}`]: {
        issues: [],
        lastSync: null,
        error: message,
      },
    })
  }
}

async function syncGitLabAccount(account: GitLabAccount): Promise<void> {
  const { id, baseUrl, token } = account
  if (!baseUrl || !token) return

  try {
    const [assigned, authored, reviewer] = await Promise.all([
      fetchAssignedMRs(baseUrl, token),
      fetchAuthoredMRs(baseUrl, token),
      fetchReviewerMRs(baseUrl, token),
    ])
    await chrome.storage.local.set({
      [`cache_gitlab_${id}`]: {
        assigned,
        authored,
        reviewer,
        lastSync: new Date().toISOString(),
        error: null,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error syncing GitLab'
    await chrome.storage.local.set({
      [`cache_gitlab_${id}`]: {
        assigned: [],
        authored: [],
        reviewer: [],
        lastSync: null,
        error: message,
      },
    })
  }
}

async function syncGitHubAccount(account: GitHubAccount): Promise<void> {
  const { id, token } = account
  if (!token) return

  try {
    const [assigned, authored, reviewRequested] = await Promise.all([
      fetchAssignedPRs(token),
      fetchAuthoredPRs(token),
      fetchReviewRequestedPRs(token),
    ])
    await chrome.storage.local.set({
      [`cache_github_${id}`]: {
        assigned,
        authored,
        reviewRequested,
        lastSync: new Date().toISOString(),
        error: null,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error syncing GitHub'
    await chrome.storage.local.set({
      [`cache_github_${id}`]: {
        assigned: [],
        authored: [],
        reviewRequested: [],
        lastSync: null,
        error: message,
      },
    })
  }
}

async function runSync(): Promise<void> {
  const settings = await getSettings()
  if (!settings) return

  const tasks: Promise<void>[] = []
  for (const account of settings.jiraAccounts) tasks.push(syncJiraAccount(account))
  for (const account of settings.gitlabAccounts) tasks.push(syncGitLabAccount(account))
  for (const account of (settings.githubAccounts ?? [])) tasks.push(syncGitHubAccount(account))
  await Promise.allSettled(tasks)
}

// Install handler
chrome.runtime.onInstalled.addListener(async () => {
  await initDefaultSettings()
  const settings = await getSettings()
  const interval = settings?.dashboard?.refreshIntervalMinutes ?? DEFAULT_INTERVAL_MINUTES
  await createAlarms(interval)
})

// Alarm handler
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === SYNC_ALARM) {
    await runSync()
  }
})

// Action click — open/focus the newtab page
chrome.action.onClicked.addListener(async () => {
  const newtabUrl = chrome.runtime.getURL('src/newtab/index.html')
  try {
    const tabs = await chrome.tabs.query({ url: newtabUrl })
    if (tabs.length > 0 && tabs[0].id != null) {
      await chrome.tabs.update(tabs[0].id, { active: true })
      if (tabs[0].windowId != null) {
        await chrome.windows.update(tabs[0].windowId, { focused: true })
      }
    } else {
      await chrome.tabs.create({ url: newtabUrl })
    }
  } catch {
    // Silently fail
  }
})

// Message handler
chrome.runtime.onMessage.addListener(
  (
    message: { type: string; minutes?: number },
    _sender,
    sendResponse: (response: { ok: boolean }) => void,
  ) => {
    if (message.type === 'TRIGGER_SYNC') {
      runSync().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }))
      return true
    }

    if (message.type === 'UPDATE_INTERVAL' && typeof message.minutes === 'number') {
      createAlarms(message.minutes)
        .then(() => sendResponse({ ok: true }))
        .catch(() => sendResponse({ ok: false }))
      return true
    }


    return false
  },
)
