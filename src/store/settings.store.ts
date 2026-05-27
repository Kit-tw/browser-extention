import { create } from 'zustand'
import type {
  JiraAccount,
  GitLabAccount,
  DashboardSettings,
  StoredSettings,
  WidgetId,
  WidgetPosition,
  BackgroundSettings,
  BgEntry,
} from '../types/settings.types'

export type { JiraAccount, GitLabAccount, DashboardSettings, StoredSettings, WidgetId, WidgetPosition, BackgroundSettings, BgEntry }

const DEFAULT_POSITIONS: Record<WidgetId, WidgetPosition> = {
  jira:   { x: 20,  y: 80,  w: 420, h: 0 },
  gitlab: { x: 460, y: 80,  w: 420, h: 0 },
  todo:   { x: 900, y: 80,  w: 380, h: 0 },
  note:   { x: 20,  y: 520, w: 420, h: 0 },
}

const DEFAULT_BACKGROUND: BackgroundSettings = {
  enabled: false,
  entries: [],
  opacity: 0.4,
  blur: 0,
  fit: 'cover',
  todayKey: '',
  todayId: '',
}

const DEFAULT_DASHBOARD: DashboardSettings = {
  refreshIntervalMinutes: 5,
  theme: 'system',
  widgets:   { jira: true, gitlab: true, todo: true, note: true },
  collapsed: { jira: false, gitlab: false, todo: false, note: false },
  positions: { ...DEFAULT_POSITIONS },
  background: { ...DEFAULT_BACKGROUND },
}

const DEFAULT_SETTINGS: StoredSettings = {
  jiraAccounts: [],
  gitlabAccounts: [],
  dashboard: DEFAULT_DASHBOARD,
}

const STORAGE_KEY = 'settings'

interface SettingsState extends StoredSettings {
  initialized: boolean
  init: () => Promise<void>
  addJiraAccount: (account: JiraAccount) => Promise<void>
  updateJiraAccount: (id: string, partial: Partial<JiraAccount>) => Promise<void>
  removeJiraAccount: (id: string) => Promise<void>
  addGitLabAccount: (account: GitLabAccount) => Promise<void>
  updateGitLabAccount: (id: string, partial: Partial<GitLabAccount>) => Promise<void>
  removeGitLabAccount: (id: string) => Promise<void>
  updateDashboard: (partial: Partial<DashboardSettings>) => Promise<void>
  setCollapsed: (widget: WidgetId, value: boolean) => Promise<void>
  setWidgetPosition: (widget: WidgetId, pos: WidgetPosition) => Promise<void>
  updateBackground: (partial: Partial<BackgroundSettings>) => Promise<void>
  addBgEntry: (entry: BgEntry) => Promise<void>
  removeBgEntry: (id: string) => Promise<void>
}

async function readFromStorage(): Promise<StoredSettings> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY)
    if (result[STORAGE_KEY]) {
      const stored = result[STORAGE_KEY] as Partial<StoredSettings>
      const mergedPositions: Record<WidgetId, WidgetPosition> = {
        ...DEFAULT_POSITIONS,
        ...(stored.dashboard?.positions ?? {}),
      }
      return {
        jiraAccounts: Array.isArray(stored.jiraAccounts) ? stored.jiraAccounts : [],
        gitlabAccounts: Array.isArray(stored.gitlabAccounts) ? stored.gitlabAccounts : [],
        dashboard: {
          ...DEFAULT_DASHBOARD,
          ...stored.dashboard,
          widgets: { ...DEFAULT_DASHBOARD.widgets, ...stored.dashboard?.widgets },
          collapsed: { ...DEFAULT_DASHBOARD.collapsed, ...stored.dashboard?.collapsed },
          positions: mergedPositions,
          background: { ...DEFAULT_BACKGROUND, ...stored.dashboard?.background },
        },
      }
    }
  } catch {
    // Fallback to defaults
  }
  return { ...DEFAULT_SETTINGS, dashboard: { ...DEFAULT_DASHBOARD, positions: { ...DEFAULT_POSITIONS } } }

}

async function writeToStorage(settings: StoredSettings): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: settings })
  } catch {
    // Silently fail
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  dashboard: { ...DEFAULT_DASHBOARD, positions: { ...DEFAULT_POSITIONS } },
  initialized: false,

  init: async () => {
    const settings = await readFromStorage()

    // Daily background pick — stable per calendar day
    const bg = settings.dashboard.background
    if (bg.entries.length > 0) {
      const today = new Date().toISOString().slice(0, 10)
      if (bg.todayKey !== today || !bg.entries.some((e) => e.id === bg.todayId)) {
        bg.todayId = bg.entries[Math.floor(Math.random() * bg.entries.length)].id
        bg.todayKey = today
        await writeToStorage(settings)
      }
    }

    set({ ...settings, initialized: true })
  },

  addJiraAccount: async (account) => {
    const current = get()
    const updated = { ...current, jiraAccounts: [...current.jiraAccounts, account] }
    set({ jiraAccounts: updated.jiraAccounts })
    await writeToStorage({ jiraAccounts: updated.jiraAccounts, gitlabAccounts: current.gitlabAccounts, dashboard: current.dashboard })
  },

  updateJiraAccount: async (id, partial) => {
    const current = get()
    const updated = current.jiraAccounts.map((a) => (a.id === id ? { ...a, ...partial } : a))
    set({ jiraAccounts: updated })
    await writeToStorage({ jiraAccounts: updated, gitlabAccounts: current.gitlabAccounts, dashboard: current.dashboard })
  },

  removeJiraAccount: async (id) => {
    const current = get()
    const updated = current.jiraAccounts.filter((a) => a.id !== id)
    set({ jiraAccounts: updated })
    await writeToStorage({ jiraAccounts: updated, gitlabAccounts: current.gitlabAccounts, dashboard: current.dashboard })
  },

  addGitLabAccount: async (account) => {
    const current = get()
    const updated = { ...current, gitlabAccounts: [...current.gitlabAccounts, account] }
    set({ gitlabAccounts: updated.gitlabAccounts })
    await writeToStorage({ jiraAccounts: current.jiraAccounts, gitlabAccounts: updated.gitlabAccounts, dashboard: current.dashboard })
  },

  updateGitLabAccount: async (id, partial) => {
    const current = get()
    const updated = current.gitlabAccounts.map((a) => (a.id === id ? { ...a, ...partial } : a))
    set({ gitlabAccounts: updated })
    await writeToStorage({ jiraAccounts: current.jiraAccounts, gitlabAccounts: updated, dashboard: current.dashboard })
  },

  removeGitLabAccount: async (id) => {
    const current = get()
    const updated = current.gitlabAccounts.filter((a) => a.id !== id)
    set({ gitlabAccounts: updated })
    await writeToStorage({ jiraAccounts: current.jiraAccounts, gitlabAccounts: updated, dashboard: current.dashboard })
  },

  updateDashboard: async (partial) => {
    const current = get()
    const updated = { ...current.dashboard, ...partial }
    set({ dashboard: updated })
    await writeToStorage({ jiraAccounts: current.jiraAccounts, gitlabAccounts: current.gitlabAccounts, dashboard: updated })
  },

  setCollapsed: async (widget, value) => {
    const current = get()
    const updated = { ...current.dashboard, collapsed: { ...current.dashboard.collapsed, [widget]: value } }
    set({ dashboard: updated })
    await writeToStorage({ jiraAccounts: current.jiraAccounts, gitlabAccounts: current.gitlabAccounts, dashboard: updated })
  },

  setWidgetPosition: async (widget, pos) => {
    const current = get()
    const updated = { ...current.dashboard, positions: { ...current.dashboard.positions, [widget]: pos } }
    set({ dashboard: updated })
    await writeToStorage({ jiraAccounts: current.jiraAccounts, gitlabAccounts: current.gitlabAccounts, dashboard: updated })
  },

  updateBackground: async (partial) => {
    const current = get()
    const updated = { ...current.dashboard, background: { ...current.dashboard.background, ...partial } }
    set({ dashboard: updated })
    await writeToStorage({ jiraAccounts: current.jiraAccounts, gitlabAccounts: current.gitlabAccounts, dashboard: updated })
  },

  addBgEntry: async (entry) => {
    const current = get()
    const bg = current.dashboard.background
    const entries = [...bg.entries, entry]
    const today = new Date().toISOString().slice(0, 10)
    // If this is the first entry, make it today's pick immediately
    const todayId = entries.length === 1 ? entry.id : bg.todayId
    const todayKey = entries.length === 1 ? today : bg.todayKey
    const updatedBg = { ...bg, entries, todayId, todayKey }
    const updated = { ...current.dashboard, background: updatedBg }
    set({ dashboard: updated })
    await writeToStorage({ jiraAccounts: current.jiraAccounts, gitlabAccounts: current.gitlabAccounts, dashboard: updated })
  },

  removeBgEntry: async (id) => {
    const current = get()
    const bg = current.dashboard.background
    const entries = bg.entries.filter((e) => e.id !== id)
    // If we removed today's pick, point to the first remaining entry (or clear)
    const todayId = bg.todayId === id ? (entries[0]?.id ?? '') : bg.todayId
    const updatedBg = { ...bg, entries, todayId }
    const updated = { ...current.dashboard, background: updatedBg }
    set({ dashboard: updated })
    await writeToStorage({ jiraAccounts: current.jiraAccounts, gitlabAccounts: current.gitlabAccounts, dashboard: updated })
  },
}))
