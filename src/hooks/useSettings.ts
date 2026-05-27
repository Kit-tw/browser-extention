import { useEffect } from 'react'
import { useSettingsStore } from '../store/settings.store'
import type {
  JiraAccount,
  GitLabAccount,
  GitHubAccount,
  DashboardSettings,
  StoredSettings,
  WidgetId,
  WidgetPosition,
  BackgroundSettings,
  BgEntry,
} from '../types/settings.types'

export type { JiraAccount, GitLabAccount, GitHubAccount, DashboardSettings, StoredSettings, WidgetId, WidgetPosition, BackgroundSettings, BgEntry }

export function useSettings() {
  const store = useSettingsStore()

  useEffect(() => {
    if (!store.initialized) {
      store.init()
    }
  }, [store.initialized])

  return {
    jiraAccounts: store.jiraAccounts,
    gitlabAccounts: store.gitlabAccounts,
    githubAccounts: store.githubAccounts,
    dashboard: store.dashboard,
    initialized: store.initialized,
    addJiraAccount: store.addJiraAccount,
    updateJiraAccount: store.updateJiraAccount,
    removeJiraAccount: store.removeJiraAccount,
    addGitLabAccount: store.addGitLabAccount,
    updateGitLabAccount: store.updateGitLabAccount,
    removeGitLabAccount: store.removeGitLabAccount,
    addGitHubAccount: store.addGitHubAccount,
    updateGitHubAccount: store.updateGitHubAccount,
    removeGitHubAccount: store.removeGitHubAccount,
    updateDashboard: store.updateDashboard,
    setCollapsed: store.setCollapsed,
    setWidgetPosition: store.setWidgetPosition,
    updateBackground: store.updateBackground,
    addBgEntry: store.addBgEntry,
    removeBgEntry: store.removeBgEntry,
  }
}

export function useWidgetPosition(widgetId: WidgetId) {
  const store = useSettingsStore()
  const position = store.dashboard.positions[widgetId]
  return {
    position,
    setPosition: (pos: WidgetPosition) => store.setWidgetPosition(widgetId, pos),
  }
}
