export type CIStatus = 'success' | 'failure' | 'pending' | 'neutral' | null

export interface GitHubPR {
  id: number
  number: number
  title: string
  html_url: string
  draft: boolean
  created_at: string
  updated_at: string
  repository_url: string
  user: { login: string }
  labels: { name: string; color: string }[]
  ci_status: CIStatus
}
