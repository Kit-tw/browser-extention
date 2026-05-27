export type PipelineStatus =
  | 'running'
  | 'pending'
  | 'success'
  | 'failed'
  | 'canceled'
  | 'skipped'
  | null

export interface GitLabMR {
  id: number
  iid: number
  title: string
  web_url: string
  target_branch: string
  source_branch: string
  created_at: string
  updated_at: string
  draft: boolean
  approvals_required: number
  approvals_left: number
  head_pipeline: { status: PipelineStatus } | null
  project_id: number
  references: { full: string }
}
