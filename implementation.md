# Browser Extension — New Tab Dashboard: Implementation Plan

## Overview

A Chrome/Firefox browser extension that replaces the new tab page with a personal productivity dashboard showing Jira issues, GitLab merge request status, and a local todo list.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Extension standard | Manifest V3 | Current Chrome standard, Firefox-compatible |
| UI framework | React 18 + Vite | Fast HMR dev, component reuse, no SSR needed |
| Styling | Tailwind CSS | Utility-first, no CSS conflicts with host page |
| State | Zustand | Lightweight, works well with Chrome storage sync |
| Storage | `chrome.storage.local` | Persists across browsers on same profile |
| Background sync | Service Worker | MV3 requirement, handles API polling |
| API auth | OAuth 2.0 / PAT | Jira uses OAuth 2.0; GitLab uses Personal Access Token |

---

## Directory Structure

```
browser-extension/
├── public/
│   ├── manifest.json          # Extension manifest
│   └── icons/                 # 16, 48, 128px icons
├── src/
│   ├── newtab/                # New tab page entry
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── NewTabApp.tsx
│   ├── settings/              # Settings page entry
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── SettingsApp.tsx
│   ├── background/
│   │   └── service-worker.ts  # Background sync + alarm scheduling
│   ├── components/
│   │   ├── widgets/
│   │   │   ├── JiraWidget.tsx
│   │   │   ├── GitLabWidget.tsx
│   │   │   └── TodoWidget.tsx
│   │   ├── layout/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── WidgetCard.tsx
│   │   │   └── Header.tsx
│   │   └── shared/
│   │       ├── Badge.tsx
│   │       ├── Skeleton.tsx
│   │       ├── EmptyState.tsx
│   │       └── ErrorBanner.tsx
│   ├── hooks/
│   │   ├── useJira.ts
│   │   ├── useGitLab.ts
│   │   ├── useTodos.ts
│   │   └── useSettings.ts
│   ├── services/
│   │   ├── jira.service.ts    # Jira REST API v3 client
│   │   └── gitlab.service.ts  # GitLab REST API v4 client
│   ├── store/
│   │   ├── jira.store.ts
│   │   ├── gitlab.store.ts
│   │   ├── todo.store.ts
│   │   └── settings.store.ts
│   └── types/
│       ├── jira.types.ts
│       ├── gitlab.types.ts
│       └── todo.types.ts
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## manifest.json (MV3)

```json
{
  "manifest_version": 3,
  "name": "Dev Dashboard",
  "version": "1.0.0",
  "chrome_url_overrides": {
    "newtab": "src/newtab/index.html"
  },
  "permissions": [
    "storage",
    "alarms",
    "identity"
  ],
  "host_permissions": [
    "https://*.atlassian.net/*",
    "https://gitlab.com/*",
    "https://*.gitlab.com/*"
  ],
  "background": {
    "service_worker": "src/background/service-worker.ts",
    "type": "module"
  },
  "options_page": "src/settings/index.html",
  "action": {
    "default_popup": "src/settings/index.html",
    "default_icon": "public/icons/48.png"
  }
}
```

---

## Feature 1: Jira Issues Widget

### What it shows
- Count of open issues **assigned to me** by status bucket: `To Do`, `In Progress`, `In Review`
- Scrollable list of individual issues with: Issue key, Summary, Priority icon, Status badge, Due date (if set)
- Direct link to each issue in Jira
- Last synced timestamp

### Data Source
- **API**: Jira REST API v3
- **Auth**: Basic Auth via email + API Token (stored encrypted in `chrome.storage.local`)
- **Endpoint**: `GET /rest/api/3/search?jql=assignee=currentUser() AND statusCategory != Done&fields=summary,status,priority,duedate`
- **Refresh**: Every 5 minutes via service worker alarm

### Settings required from user
```
JIRA_BASE_URL   = https://yourcompany.atlassian.net
JIRA_EMAIL      = you@yourcompany.com
JIRA_API_TOKEN  = <generated from id.atlassian.com/manage-profile/security>
```

### UI States
- Loading skeleton
- Empty state: "No open issues — nice work!"
- Error state with retry button
- Stale data indicator if sync failed

---

## Feature 2: GitLab Widget

### What it shows
- **MRs assigned to me** (open, not draft): count + list
- **MRs I authored** awaiting merge: count
- **MRs awaiting my review**: count (reviewer_id = me)
- Each MR row: title, target branch, pipeline status icon (passed/failed/running), approvals count, age

### Data Source
- **API**: GitLab REST API v4
- **Auth**: Personal Access Token (stored encrypted in `chrome.storage.local`)
- **Endpoints**:
  - `GET /api/v4/merge_requests?scope=assigned_to_me&state=opened`
  - `GET /api/v4/merge_requests?scope=created_by_me&state=opened`
  - `GET /api/v4/merge_requests?reviewer_id=<me>&state=opened`
- **Refresh**: Every 5 minutes via service worker alarm

### Settings required from user
```
GITLAB_BASE_URL = https://gitlab.com  (or self-hosted URL)
GITLAB_TOKEN    = <personal access token with api scope>
```

### UI States
- Loading skeleton
- Three collapsible sections per role (assigned / authored / reviewer)
- Pipeline status: colored dot (green/red/yellow/grey)
- Empty state per section

---

## Feature 3: Todo List Widget

### What it shows
- Quick-add input at the top
- List of todos: checkbox, text, optional due date, delete button
- Filter tabs: All / Active / Done
- Completed todos move to bottom with strikethrough
- Item count summary: "3 of 7 done"

### Data Source
- Fully local — `chrome.storage.local`
- No external API required
- Syncs across Chrome sessions automatically

### Data Model
```typescript
interface Todo {
  id: string            // uuid
  text: string
  done: boolean
  createdAt: string     // ISO 8601
  dueDate?: string      // ISO 8601 date
  priority?: 'low' | 'medium' | 'high'
}
```

### Interactions
- Press `Enter` in the input to add
- Click checkbox to toggle done
- Click text to inline-edit
- Drag to reorder (react-dnd or @dnd-kit)
- Keyboard shortcut `N` focuses the add input from anywhere on the page

---

## Settings Page

Accessible via the extension toolbar icon popup or a gear icon on the dashboard.

### Sections

**Jira**
- Base URL input
- Email input
- API Token input (masked, with show/hide toggle)
- "Test Connection" button → calls `/rest/api/3/myself`
- Connection status indicator

**GitLab**
- Base URL input (default: https://gitlab.com)
- Personal Access Token input (masked)
- "Test Connection" button → calls `/api/v4/user`
- Connection status indicator

**Dashboard**
- Widget visibility toggles (show/hide each widget)
- Refresh interval selector (1 / 5 / 10 / 30 min)
- Theme toggle (light / dark / system)

### Storage schema (chrome.storage.local)
```typescript
interface StoredSettings {
  jira: {
    baseUrl: string
    email: string
    apiToken: string   // never logged, never sent to any server except Jira
  }
  gitlab: {
    baseUrl: string
    token: string      // never logged
  }
  dashboard: {
    refreshIntervalMinutes: number
    theme: 'light' | 'dark' | 'system'
    widgets: {
      jira: boolean
      gitlab: boolean
      todo: boolean
    }
  }
}
```

---

## Background Service Worker

Responsibilities:
1. Register `chrome.alarms` for periodic refresh
2. On alarm fire: call Jira + GitLab APIs and cache results in `chrome.storage.local`
3. Broadcast `chrome.runtime.sendMessage` to open new tab pages so they re-render without full reload
4. On extension install/update: initialize default settings

```typescript
// Alarm names
const ALARMS = {
  SYNC: 'dev-dashboard-sync'
}

chrome.alarms.create(ALARMS.SYNC, { periodInMinutes: 5 })
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARMS.SYNC) {
    await Promise.allSettled([syncJira(), syncGitLab()])
  }
})
```

---

## UI Layout (New Tab Page)

```
┌─────────────────────────────────────────────────────────┐
│  Dev Dashboard                     [⚙ Settings]  [🌙]  │
├──────────────────┬──────────────────┬───────────────────┤
│                  │                  │                   │
│  Jira Issues     │  GitLab          │  Todo List        │
│  ────────────    │  ────────────    │  ────────────     │
│  📋 To Do: 3     │  👤 Assigned: 4  │  ☐ Task 1         │
│  🔄 In Prog: 2   │  ✍ Authored: 2  │  ☐ Task 2         │
│  👁 Review: 1    │  👁 Reviewer: 1  │  ☑ Task 3         │
│                  │                  │                   │
│  [issue list]    │  [MR list]       │  [+ Add todo...]  │
│                  │                  │                   │
│  Synced 2m ago   │  Synced 2m ago   │  3 of 7 done      │
└──────────────────┴──────────────────┴───────────────────┘
```

Three equal-width columns, responsive to viewport. On narrow screens (< 1024px), stacks vertically.

---

## Implementation Phases

### Phase 1 — Scaffold & Shell (Day 1)
- [ ] Init Vite + React + TypeScript project
- [ ] Configure Tailwind CSS
- [ ] Create `manifest.json`
- [ ] Build static new tab page layout (no data)
- [ ] Build settings page shell
- [ ] Wire `chrome.storage` read/write for settings

### Phase 2 — Todo Widget (Day 1–2)
- [ ] `useTodos` hook with full CRUD
- [ ] Drag-to-reorder
- [ ] Filter tabs
- [ ] Persist in `chrome.storage.local`

### Phase 3 — Jira Integration (Day 2–3)
- [ ] `jira.service.ts` with Basic Auth header construction
- [ ] JQL query for assigned open issues
- [ ] `useJira` hook
- [ ] Jira widget UI with all states
- [ ] Test Connection flow in settings

### Phase 4 — GitLab Integration (Day 3–4)
- [ ] `gitlab.service.ts` with PAT header
- [ ] Three MR queries (assigned / authored / reviewer)
- [ ] `useGitLab` hook
- [ ] GitLab widget UI with pipeline status icons
- [ ] Test Connection flow in settings

### Phase 5 — Background Sync (Day 4)
- [ ] Service worker alarms
- [ ] Cache API responses in storage
- [ ] sendMessage broadcast to open tabs
- [ ] Stale data detection UI

### Phase 6 — Polish (Day 5)
- [ ] Dark / light / system theme
- [ ] Loading skeletons
- [ ] Error states + retry
- [ ] Keyboard shortcuts
- [ ] Package and test in Chrome unpacked mode

---

## Security Considerations

- API tokens stored only in `chrome.storage.local` — never sent anywhere except the target service (Jira/GitLab)
- No analytics, no telemetry, no third-party network calls
- `host_permissions` scoped to Atlassian and GitLab domains only
- Tokens are never logged to console or included in error reports
- All API calls made from the background service worker, not injected content scripts

---

## Build & Load Locally

```bash
npm install
npm run build          # outputs to dist/
# In Chrome: Extensions > Load unpacked > select dist/
```

---

## Key Dependencies

```json
{
  "react": "^18",
  "react-dom": "^18",
  "zustand": "^4",
  "tailwindcss": "^3",
  "@dnd-kit/core": "^6",
  "vite": "^5",
  "vite-plugin-web-extension": "^4"
}
```
