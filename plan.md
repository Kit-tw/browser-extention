# Note Widget + Cross-Device Sync Plan

## Overview

Add a freeform **Notes widget** to the dashboard with cross-device sync that requires **no Google OAuth**.

---

## Sync Options (no OAuth required)

### Option A — `chrome.storage.sync` ✅ Recommended
Chrome's built-in sync. Data automatically mirrors across every Chrome instance where the user is signed in with the same Google account and has sync enabled.

| | |
|---|---|
| Setup required | None — zero config |
| Works on | All Chrome browsers signed into the same account |
| Quota | 100 KB total, 8 KB per item (enough for notes) |
| Latency | Near-instant via Chrome's own sync |
| Privacy | Data goes through Google infrastructure (same as bookmarks/history) |

**This is the right default.** It just works for 99% of Chrome users.

### Option B — GitHub Gist (PAT-based)
User adds a GitHub Personal Access Token in settings. Notes are saved as a private Gist and synced via the GitHub API.

| | |
|---|---|
| Setup required | GitHub PAT with `gist` scope |
| Works on | Any browser (Chromium, Firefox, etc.) |
| Quota | Unlimited |
| Latency | ~1-2s per sync (GitHub API round-trip) |
| Benefit | Version history, works cross-browser |

Good secondary option for developers who prefer not to rely on Chrome sync or want notes accessible outside the extension.

---

## Feature Scope

### Note Widget
- Multiple named notes (tabs or list, user-created)
- Each note: title + freeform text body (plain text or light Markdown)
- Auto-save on every keystroke (debounced 500ms)
- Collapse/expand like other widgets
- Draggable like other widgets

### UI behaviour
- Default: one note called "Scratch"
- Add / rename / delete notes
- Notes render inline (no modal) — click note title to switch active note
- Character count shown in footer (no hard limit, just informational)

---

## Implementation Plan

### 1. Types — `src/types/note.types.ts`
```ts
export interface Note {
  id: string          // uuid
  title: string
  body: string
  updatedAt: string   // ISO timestamp
}
```

### 2. Storage strategy

#### Option A path (chrome.storage.sync)
- Notes stored under key `"notes"` in `chrome.storage.sync` instead of `chrome.storage.local`
- Zustand store listens to `chrome.storage.onChanged` for the `"notes"` key (same pattern as settings store, but targeting `sync` area)
- No service worker involvement needed — UI writes directly to `chrome.storage.sync`

```ts
// write
await chrome.storage.sync.set({ notes: serializedNotes })

// read / reactive
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.notes) { ... }
})
```

#### Option B path (GitHub Gist)
- Notes stored locally in `chrome.storage.local` key `"notes"`
- User adds GitHub PAT + Gist ID (auto-created on first sync) in the Settings panel under a new "Notes" tab
- Service worker handles sync: `sync-notes` alarm every 2 minutes
- Conflict resolution: last-write-wins by `updatedAt` timestamp per note
- Gist file: single JSON file `dev-dashboard-notes.json`

### 3. Zustand store — `src/store/notes.store.ts`
```ts
interface NotesStore {
  notes: Note[]
  activeNoteId: string | null
  initialized: boolean
  // actions
  addNote: (title: string) => void
  updateNote: (id: string, partial: Partial<Note>) => void
  deleteNote: (id: string) => void
  setActive: (id: string) => void
}
```

### 4. Hook — `src/hooks/useNotes.ts`
Thin wrapper around the store (same pattern as `useJira`, `useGitLab`).

### 5. Component — `src/components/widgets/NoteWidget.tsx`
```
NoteWidget
├── NoteTabBar        — horizontal scrollable tabs (title + delete button)
├── NoteEditor        — <textarea> auto-resizing, monospace, debounced save
└── NoteFooter        — character count, last-saved timestamp
```

### 6. Dashboard integration — `src/components/layout/Dashboard.tsx`
- Add `NoteWidgetItem` (same pattern as `TodoWidgetItem`)
- Default position: `{ x: 20, y: 520, w: 420, h: 0 }`

### 7. Settings types — `src/types/settings.types.ts`
- Add `'note'` to `WidgetId`
- Add `note` to `DashboardSettings.widgets`, `.collapsed`, `.positions`

### 8. Settings panel — `src/components/settings/SettingsPanel.tsx`
- Add Note toggle in Dashboard tab (show/hide widget)
- If Option B: add a "Notes Sync" tab with GitHub PAT + Gist ID fields + "Sync Now" button

### 9. Service worker — `src/background/service-worker.ts`
- Option A: no changes needed
- Option B: add `sync-notes` alarm + `syncNotes()` function calling GitHub Gist API

---

## File Checklist

| File | Action |
|---|---|
| `src/types/note.types.ts` | Create |
| `src/store/notes.store.ts` | Create |
| `src/hooks/useNotes.ts` | Create |
| `src/components/widgets/NoteWidget.tsx` | Create |
| `src/types/settings.types.ts` | Edit — add `'note'` to WidgetId + defaults |
| `src/store/settings.store.ts` | Edit — add note defaults |
| `src/components/layout/Dashboard.tsx` | Edit — add NoteWidgetItem |
| `src/components/settings/SettingsPanel.tsx` | Edit — toggle + (Option B) sync tab |
| `src/background/service-worker.ts` | Edit only for Option B |
| `manifest.json` | No changes needed for Option A |

---

## Recommendation

Start with **Option A** (`chrome.storage.sync`). It requires touching zero infrastructure, adds no credentials to manage, and the 100 KB quota fits hundreds of notes. Option B can be layered on later as an "advanced sync" setting for users who want cross-browser access.
