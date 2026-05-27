import { create } from 'zustand'
import type { GitHubPR } from '../types/github.types'

export interface GitHubAccountData {
  assigned: GitHubPR[]
  authored: GitHubPR[]
  reviewRequested: GitHubPR[]
  loading: boolean
  error: string | null
  lastSync: string | null
}

interface GitHubState {
  accountData: Record<string, GitHubAccountData>
  initialized: boolean
  init: () => Promise<void>
  initAccount: (id: string) => void
}

function emptyAccount(): GitHubAccountData {
  return { assigned: [], authored: [], reviewRequested: [], loading: false, error: null, lastSync: null }
}

export const useGitHubStore = create<GitHubState>((set, get) => ({
  accountData: {},
  initialized: false,

  init: async () => {
    set({ initialized: true })

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return
      const updates: Record<string, GitHubAccountData> = {}
      let hasUpdates = false

      for (const key of Object.keys(changes)) {
        const match = key.match(/^cache_github_(.+)$/)
        if (match) {
          const id = match[1]
          const newVal = changes[key].newValue as Partial<GitHubAccountData> | undefined
          if (newVal) {
            const current = get().accountData[id] ?? emptyAccount()
            updates[id] = {
              ...current,
              assigned: Array.isArray(newVal.assigned) ? newVal.assigned : current.assigned,
              authored: Array.isArray(newVal.authored) ? newVal.authored : current.authored,
              reviewRequested: Array.isArray(newVal.reviewRequested) ? newVal.reviewRequested : current.reviewRequested,
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

    try {
      const all = await chrome.storage.local.get(null)
      const patches: Record<string, GitHubAccountData> = {}
      for (const key of Object.keys(all)) {
        const match = key.match(/^cache_github_(.+)$/)
        if (match) {
          const id = match[1]
          const val = all[key] as Partial<GitHubAccountData>
          patches[id] = {
            assigned: Array.isArray(val.assigned) ? val.assigned : [],
            authored: Array.isArray(val.authored) ? val.authored : [],
            reviewRequested: Array.isArray(val.reviewRequested) ? val.reviewRequested : [],
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
      // ignore
    }
  },

  initAccount: (id) => {
    set((state) => {
      if (state.accountData[id]) return state
      return { accountData: { ...state.accountData, [id]: emptyAccount() } }
    })
  },
}))
