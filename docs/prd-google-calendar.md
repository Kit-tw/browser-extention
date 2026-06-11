# Google Calendar Widget — PRD

## Goal

Read-only today's agenda widget fetching events from the user's Google Calendar.

## OAuth Setup (not done yet)

1. Go to console.cloud.google.com — sign in with **personal Gmail**
2. Create a new project (e.g. `dev-dashboard`)
3. Enable **Google Calendar API**
4. Create OAuth 2.0 credentials → type: **Desktop app**
5. Note the **Client ID** and **Client Secret**

> The app is created under personal Gmail, but the user logs in with their work account (`@depthfirst.co.th`) — that's fine.

## Implementation Plan

- **Auth:** `chrome.identity.launchWebAuthFlow` + store tokens in `chrome.storage.local`
- **Scope:** `https://www.googleapis.com/auth/calendar.readonly`
- **Data fetch:** service worker calls Google Calendar API on `sync-data` alarm
- **Redirect URI:** `https://<extension-id>.chromiumapp.org/`

## Cost

- Google Calendar API: **free** (1M requests/day quota)
- Chrome Web Store publish: one-time **$5**
- OAuth verification: required at 100+ users (free, takes a few weeks)
