import { create } from 'zustand'
import type { JiraIssue } from '../types/jira.types'

interface AccountData {
  issues: JiraIssue[]
  loading: boolean
  error: string | null
  lastSync: string | null
}

interface JiraState {
  accountData: Record<string, AccountData>
  initialized: boolean
  init: () => Promise<void>
  initAccount: (id: string) => void
  setAccountData: (id: string, data: Partial<AccountData>) => void
  setAccountLoading: (id: string, loading: boolean) => void
  setAccountError: (id: string, msg: string | null) => void
}

function emptyAccount(): AccountData {
  return { issues: [], loading: false, error: null, lastSync: null }
}

export const useJiraStore = create<JiraState>((set, get) => ({
  accountData: {},
  initialized: false,

  init: async () => {
    set({ initialized: true })

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return
      const updates: Record<string, AccountData> = {}
      let hasUpdates = false

      for (const key of Object.keys(changes)) {
        const match = key.match(/^cache_jira_(.+)$/)
        if (match) {
          const id = match[1]
          const newVal = changes[key].newValue as { issues?: JiraIssue[]; lastSync?: string; error?: string | null } | undefined
          if (newVal) {
            const current = get().accountData[id] ?? emptyAccount()
            updates[id] = {
              ...current,
              issues: Array.isArray(newVal.issues) ? newVal.issues : current.issues,
              lastSync: newVal.lastSync ?? current.lastSync,
              error: newVal.error !== undefined ? (newVal.error ?? null) : current.error,
              loading: false,
            }
            hasUpdates = true
          }
        }
      }

      if (hasUpdates) {
        set((state) => ({ accountData: { ...state.accountData, ...updates } }))
      }
    })

    // Load any existing cached data
    try {
      const all = await chrome.storage.local.get(null)
      const patches: Record<string, AccountData> = {}
      for (const key of Object.keys(all)) {
        const match = key.match(/^cache_jira_(.+)$/)
        if (match) {
          const id = match[1]
          const val = all[key] as { issues?: JiraIssue[]; lastSync?: string; error?: string | null }
          patches[id] = {
            issues: Array.isArray(val.issues) ? val.issues : [],
            lastSync: val.lastSync ?? null,
            error: val.error ?? null,
            loading: false,
          }
        }
      }
      if (Object.keys(patches).length > 0) {
        set((state) => ({ accountData: { ...state.accountData, ...patches } }))
      }
    } catch {
      // Ignore
    }
  },

  initAccount: (id) => {
    set((state) => {
      if (state.accountData[id]) return state
      return { accountData: { ...state.accountData, [id]: emptyAccount() } }
    })
  },

  setAccountData: (id, data) => {
    set((state) => ({
      accountData: {
        ...state.accountData,
        [id]: { ...(state.accountData[id] ?? emptyAccount()), ...data },
      },
    }))
  },

  setAccountLoading: (id, loading) => {
    set((state) => ({
      accountData: {
        ...state.accountData,
        [id]: { ...(state.accountData[id] ?? emptyAccount()), loading },
      },
    }))
  },

  setAccountError: (id, msg) => {
    set((state) => ({
      accountData: {
        ...state.accountData,
        [id]: { ...(state.accountData[id] ?? emptyAccount()), error: msg, loading: false },
      },
    }))
  },
}))
