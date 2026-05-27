import type { GitLabMR } from '../types/gitlab.types'

export class GitLabApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message)
    this.name = 'GitLabApiError'
  }
}

async function fetchWithToken<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new GitLabApiError(
      `GitLab API error: ${response.status} ${response.statusText}`,
      response.status,
    )
  }

  return response.json() as Promise<T>
}

async function fetchAllPages<T>(
  baseUrl: string,
  path: string,
  token: string,
): Promise<T[]> {
  const results: T[] = []
  let page = 1
  const perPage = 50

  while (true) {
    const url = `${baseUrl.replace(/\/$/, '')}${path}&page=${page}&per_page=${perPage}`
    const data = await fetchWithToken<T[]>(url, token)
    results.push(...data)
    if (data.length < perPage) break
    page++
    if (page > 10) break // Safety limit: 500 MRs max
  }

  return results
}

const MR_FIELDS =
  'id,iid,title,web_url,target_branch,source_branch,created_at,updated_at,draft,approvals_required,approvals_left,head_pipeline,project_id,references'

export async function fetchAssignedMRs(baseUrl: string, token: string): Promise<GitLabMR[]> {
  return fetchAllPages<GitLabMR>(
    baseUrl,
    `/api/v4/merge_requests?scope=assigned_to_me&state=opened&with_labels_details=false`,
    token,
  )
}

export async function fetchAuthoredMRs(baseUrl: string, token: string): Promise<GitLabMR[]> {
  return fetchAllPages<GitLabMR>(
    baseUrl,
    `/api/v4/merge_requests?scope=created_by_me&state=opened`,
    token,
  )
}

export async function fetchReviewerMRs(baseUrl: string, token: string): Promise<GitLabMR[]> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/v4/user`
  const me = await fetchWithToken<{ id: number }>(url, token)
  return fetchAllPages<GitLabMR>(
    baseUrl,
    `/api/v4/merge_requests?reviewer_id=${me.id}&state=opened`,
    token,
  )
}

export async function testGitLabConnection(
  baseUrl: string,
  token: string,
): Promise<{ ok: boolean; username?: string; error?: string }> {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/api/v4/user`
    const data = await fetchWithToken<{ username?: string }>(url, token)
    return { ok: true, username: data.username }
  } catch (err) {
    if (err instanceof GitLabApiError) {
      if (err.status === 401) {
        return { ok: false, error: 'Invalid token. Check your GitLab personal access token.' }
      }
      return { ok: false, error: err.message }
    }
    return { ok: false, error: 'Connection failed. Check the base URL and your network.' }
  }
}

// Suppress unused variable warning for MR_FIELDS
void MR_FIELDS
