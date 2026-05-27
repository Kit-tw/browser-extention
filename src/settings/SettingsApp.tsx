// Settings page — redirects to the main newtab dashboard
// The in-page settings panel (SettingsPanel) is embedded in the newtab page.
import React, { useEffect } from 'react'

export function SettingsApp() {
  useEffect(() => {
    try {
      window.location.href = chrome.runtime.getURL('src/newtab/index.html')
    } catch {
      // Fallback for non-extension context
      window.location.href = '/src/newtab/index.html'
    }
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: '#888', fontSize: 14 }}>Redirecting to Dev Dashboard…</p>
    </div>
  )
}
