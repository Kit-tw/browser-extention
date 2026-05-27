import { create } from 'zustand'
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

export type {
  JiraAccount,
  GitLabAccount,
  GitHubAccount,
  DashboardSettings,
  StoredSettings,
  WidgetId,
  WidgetPosition,
  BackgroundSettings,
  BgEntry,
}

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
  githubAccounts: [],
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
  addGitHubAccount: (account: GitHubAccount) => Promise<void>
  updateGitHubAccount: (id: string, partial: Partial<GitHubAccount>) => Promise<void>
  removeGitHubAccount: (id: string) => Promise<void>
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
        githubAccounts: Array.isArray(stored.githubAccounts) ? stored.githubAccounts : [],
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
    // fallback to defaults
  }
  return {
    ...DEFAULT_SETTINGS,
    dashboard: { ...DEFAULT_DASHBOARD, positions: { ...DEFAULT_POSITIONS } },
  }
}

async function writeToStorage(settings: StoredSettings): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: settings })
  } catch {
    // silently fail
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  // persist() always writes the current Zustand state — call after set()
  const persist = () => {
    const s = get()
    return writeToStorage({
      jiraAccounts: s.jiraAccounts,
      gitlabAccounts: s.gitlabAccounts,
      githubAccounts: s.githubAccounts,
      dashboard: s.dashboard,
    })
  }

  return {
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

    // ── Jira ──────────────────────────────────────────────────────────────────
    addJiraAccount: async (account) => {
      set((s) => ({ jiraAccounts: [...s.jiraAccounts, account] }))
      await persist()
    },
    updateJiraAccount: async (id, partial) => {
      set((s) => ({ jiraAccounts: s.jiraAccounts.map((a) => (a.id === id ? { ...a, ...partial } : a)) }))
      await persist()
    },
    removeJiraAccount: async (id) => {
      set((s) => ({ jiraAccounts: s.jiraAccounts.filter((a) => a.id !== id) }))
      await persist()
    },

    // ── GitLab ────────────────────────────────────────────────────────────────
    addGitLabAccount: async (account) => {
      set((s) => ({ gitlabAccounts: [...s.gitlabAccounts, account] }))
      await persist()
    },
    updateGitLabAccount: async (id, partial) => {
      set((s) => ({ gitlabAccounts: s.gitlabAccounts.map((a) => (a.id === id ? { ...a, ...partial } : a)) }))
      await persist()
    },
    removeGitLabAccount: async (id) => {
      set((s) => ({ gitlabAccounts: s.gitlabAccounts.filter((a) => a.id !== id) }))
      await persist()
    },

    // ── GitHub ────────────────────────────────────────────────────────────────
    addGitHubAccount: async (account) => {
      set((s) => ({ githubAccounts: [...s.githubAccounts, account] }))
      await persist()
    },
    updateGitHubAccount: async (id, partial) => {
      set((s) => ({ githubAccounts: s.githubAccounts.map((a) => (a.id === id ? { ...a, ...partial } : a)) }))
      await persist()
    },
    removeGitHubAccount: async (id) => {
      set((s) => ({ githubAccounts: s.githubAccounts.filter((a) => a.id !== id) }))
      await persist()
    },

    // ── Dashboard ─────────────────────────────────────────────────────────────
    updateDashboard: async (partial) => {
      set((s) => ({ dashboard: { ...s.dashboard, ...partial } }))
      await persist()
    },
    setCollapsed: async (widget, value) => {
      set((s) => ({ dashboard: { ...s.dashboard, collapsed: { ...s.dashboard.collapsed, [widget]: value } } }))
      await persist()
    },
    setWidgetPosition: async (widget, pos) => {
      set((s) => ({ dashboard: { ...s.dashboard, positions: { ...s.dashboard.positions, [widget]: pos } } }))
      await persist()
    },

    // ── Background ────────────────────────────────────────────────────────────
    updateBackground: async (partial) => {
      set((s) => ({ dashboard: { ...s.dashboard, background: { ...s.dashboard.background, ...partial } } }))
      await persist()
    },
    addBgEntry: async (entry) => {
      set((s) => {
        const bg = s.dashboard.background
        const entries = [...bg.entries, entry]
        const today = new Date().toISOString().slice(0, 10)
        const todayId = entries.length === 1 ? entry.id : bg.todayId
        const todayKey = entries.length === 1 ? today : bg.todayKey
        return { dashboard: { ...s.dashboard, background: { ...bg, entries, todayId, todayKey } } }
      })
      await persist()
    },
    removeBgEntry: async (id) => {
      set((s) => {
        const bg = s.dashboard.background
        const entries = bg.entries.filter((e) => e.id !== id)
        const todayId = bg.todayId === id ? (entries[0]?.id ?? '') : bg.todayId
        return { dashboard: { ...s.dashboard, background: { ...bg, entries, todayId } } }
      })
      await persist()
    },
  }
})
