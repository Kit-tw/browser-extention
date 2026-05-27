export interface JiraIssue {
  id: string
  key: string
  fields: {
    summary: string
    status: { name: string; statusCategory: { key: string } }
    priority: { name: string; iconUrl: string } | null
    duedate: string | null
  }
}

export interface JiraSearchResult {
  issues: JiraIssue[]
  total: number
}
