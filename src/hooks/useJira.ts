import { useEffect } from 'react'
import { useJiraStore } from '../store/jira.store'
import { useSettingsStore } from '../store/settings.store'

export function useJira() {
  const store = useJiraStore()
  const jiraAccounts = useSettingsStore((s) => s.jiraAccounts)

  useEffect(() => {
    if (!store.initialized) {
      store.init().then(() => {
        // If any account has no data yet, trigger a sync
        const current = useJiraStore.getState()
        const hasNoData = jiraAccounts.some((acc) => {
          const data = current.accountData[acc.id]
          return !data || (!data.lastSync && !data.loading)
        })
        if (hasNoData && jiraAccounts.length > 0) {
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
    for (const acc of jiraAccounts) {
      store.initAccount(acc.id)
    }
  }, [jiraAccounts])

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
