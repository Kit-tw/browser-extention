import { useEffect } from 'react'
import { useGitLabStore } from '../store/gitlab.store'
import { useSettingsStore } from '../store/settings.store'

export function useGitLab() {
  const store = useGitLabStore()
  const gitlabAccounts = useSettingsStore((s) => s.gitlabAccounts)

  useEffect(() => {
    if (!store.initialized) {
      store.init().then(() => {
        const current = useGitLabStore.getState()
        const hasNoData = gitlabAccounts.some((acc) => {
          const data = current.accountData[acc.id]
          return !data || (!data.lastSync && !data.loading)
        })
        if (hasNoData && gitlabAccounts.length > 0) {
          try {
            chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' })
          } catch {
            // Extension context might not be available
          }
        }
      })
    }
  }, [store.initialized])

  // Ensure each account has a slot
  useEffect(() => {
    for (const acc of gitlabAccounts) {
      store.initAccount(acc.id)
    }
  }, [gitlabAccounts])

  return {
    accountData: store.accountData,
    initialized: store.initialized,
    triggerSync: () => {
      try {
        chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' })
      } catch {
        // Extension context might not be available
      }
    },
  }
}
