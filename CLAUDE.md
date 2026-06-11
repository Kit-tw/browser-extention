# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build    # production build → dist/
npm run dev      # dev server (HMR, but extension APIs won't work outside Chrome)
```

After every build, reload the unpacked extension in Chrome or Edge: `chrome://extensions` / `edge://extensions` → **Dev Dashboard** → refresh icon. The `dist/` folder is what the browser loads.

There is no test runner configured.

## User Approval Required Before Any Code Change

For every proposed change — no matter how small:

1. **Explain** what you plan to change and why.
2. **Wait** for the user to say "yes", "go ahead", "do it", or equivalent.
3. **Only then** write or edit any file.

---

## Architecture

This is a **Manifest V3 Chrome extension** built with React 18 + Vite + Tailwind CSS + Zustand. It replaces the new tab page with a productivity dashboard.

### Two separate JS bundles

`vite-plugin-web-extension` produces two independent bundles:

| Bundle | Entry | Runs in |
|---|---|---|
| UI (React) | `src/newtab/index.html` + `src/settings/index.html` | Chrome tab page |
| Service worker | `src/background/service-worker.ts` | Background context — no React, no DOM |

These bundles share types (`src/types/`) but **cannot share runtime state**. Communication between them happens exclusively through `chrome.storage.local` and `chrome.runtime.sendMessage`.

### Data flow

```
Service Worker (background)
  ├── Reads credentials from chrome.storage.local key: "settings"
  ├── Calls external APIs (Jira, GitLab, Google Calendar)
  └── Writes results to chrome.storage.local keys:
        cache_jira_<accountId>
        cache_gitlab_<accountId>
        cache_google

React UI (new tab)
  ├── Zustand stores listen to chrome.storage.onChanged
  ├── Stores hydrate themselves reactively when the SW writes cache keys
  └── Components read from stores — they never call external APIs directly
```

The SW is triggered by:
- `chrome.alarms` — `sync-data` (every N min), `meeting-check` (every 1 min), `reminder-check-<i>` (daily, one per configured notification time)
- `chrome.runtime.onMessage` — `TRIGGER_SYNC`, `UPDATE_INTERVAL`, `GOOGLE_AUTH_SUCCESS`

### Settings storage

All user settings live under a single `chrome.storage.local` key: `"settings"`. The shape is defined in `src/types/settings.types.ts` (`StoredSettings`). The settings Zustand store (`src/store/settings.store.ts`) is the single source of truth in the UI — always update settings through it, never write to `chrome.storage.local` directly from components.

### Multiple accounts

Both Jira and GitLab support multiple accounts. Each account has a UUID `id`. The Dashboard renders one widget card per account. Widget positions for per-account cards use the key `jira_<accountId>` / `gitlab_<accountId>` inside `dashboard.positions`, which is typed loosely as `Record<string, WidgetPosition>` beyond the four base widget IDs.

### Widget layout

Widgets are **absolutely positioned** on a `position: relative` container. Each widget's `{ x, y, w }` is persisted in `dashboard.positions`. Dragging is powered by `@dnd-kit/core` `useDraggable` — the drag handle (grip icon) is the only draggable area; the chevron button handles collapse independently.

### Settings panel

The settings UI is a slide-over panel (`src/components/settings/SettingsPanel.tsx`) rendered inside `NewTabApp` — not a separate page. The extension toolbar action click opens/focuses the new tab page (handled in the service worker via `chrome.action.onClicked`).

### Reminders & notifications

Reminders are stored in `settings.reminders[]`. The service worker fires `chrome.notifications` when `checkAndFireReminders()` runs — triggered by `reminder-check-<i>` alarms. Which reminders fire is controlled by `settings.dashboard.notificationSchedule.warnWithinDays`.

**Gotcha:** all asset URLs in the service worker must use `chrome.runtime.getURL('path')` — relative paths (e.g. `'icons/icon.png'`) are invalid in the SW context and cause `chrome.notifications.create` to throw silently (swallowed by the catch block).

### Secrets

Credentials (Jira API token, GitLab PAT, Google OAuth tokens) are stored only in `chrome.storage.local` under the `"settings"` key. They are never logged, never sent to any server other than their respective target service, and never appear in source code.
