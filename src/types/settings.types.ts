export interface JiraAccount {
  id: string
  label: string
  baseUrl: string
  email: string
  apiToken: string
}

export interface GitLabAccount {
  id: string
  label: string
  baseUrl: string
  token: string
}

export type WidgetId = 'jira' | 'gitlab' | 'todo' | 'note'

export interface WidgetPosition {
  x: number
  y: number
  w: number
  h: number
}

export type BgFit = 'cover' | 'contain' | 'center'

export interface BgEntry {
  id: string
  type: 'local' | 'url'
  name: string
  url?: string
}

export interface BackgroundSettings {
  enabled: boolean
  entries: BgEntry[]
  opacity: number
  blur: number
  fit: BgFit
  todayKey: string
  todayId: string
}

export interface DashboardSettings {
  refreshIntervalMinutes: number
  theme: 'light' | 'dark' | 'system'
  widgets: Record<WidgetId, boolean>
  collapsed: Record<WidgetId, boolean>
  positions: Record<WidgetId, WidgetPosition>
  background: BackgroundSettings
}

export interface StoredSettings {
  jiraAccounts: JiraAccount[]
  gitlabAccounts: GitLabAccount[]
  dashboard: DashboardSettings
}
