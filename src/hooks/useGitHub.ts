import { useEffect } from 'react'
import { useGitHubStore } from '../store/github.store'
import { useSettingsStore } from '../store/settings.store'

export function useGitHub() {
  const store = useGitHubStore()
  const githubAccounts = useSettingsStore((s) => s.githubAccounts)

  useEffect(() => {
    if (!store.initialized) {
      store.init().then(() => {
        const current = useGitHubStore.getState()
        const hasNoData = githubAccounts.some((acc) => {
          const data = current.accountData[acc.id]
          return !data || (!data.lastSync && !data.loading)
        })
        if (hasNoData && githubAccounts.length > 0) {
          try { chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' }) } catch { /* ignore */ }
        }
      })
    }
  }, [store.initialized])

  useEffect(() => {
    for (const acc of githubAccounts) store.initAccount(acc.id)
  }, [githubAccounts])

  return {
    accountData: store.accountData,
    initialized: store.initialized,
    triggerSync: () => {
      try { chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' }) } catch { /* ignore */ }
    },
  }
}
