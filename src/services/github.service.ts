import type { GitHubPR } from '../types/github.types'

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message)
    this.name = 'GitHubApiError'
  }
}

const BASE = 'https://api.github.com'

async function fetchWithToken<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!res.ok) {
    throw new GitHubApiError(`GitHub API error: ${res.status} ${res.statusText}`, res.status)
  }
  return res.json() as Promise<T>
}

async function searchPRs(token: string, query: string): Promise<GitHubPR[]> {
  const url = `${BASE}/search/issues?q=${encodeURIComponent(`is:pr is:open ${query}`)}&per_page=100&sort=updated`
  const data = await fetchWithToken<{ items: GitHubPR[] }>(url, token)
  return data.items
}

export async function fetchAssignedPRs(token: string): Promise<GitHubPR[]> {
  return searchPRs(token, 'assignee:@me')
}

export async function fetchAuthoredPRs(token: string): Promise<GitHubPR[]> {
  return searchPRs(token, 'author:@me')
}

export async function fetchReviewRequestedPRs(token: string): Promise<GitHubPR[]> {
  return searchPRs(token, 'review-requested:@me')
}

export async function testGitHubConnection(
  token: string,
): Promise<{ ok: boolean; login?: string; error?: string }> {
  try {
    const data = await fetchWithToken<{ login?: string }>(`${BASE}/user`, token)
    return { ok: true, login: data.login }
  } catch (err) {
    if (err instanceof GitHubApiError) {
      if (err.status === 401) return { ok: false, error: 'Invalid token.' }
      return { ok: false, error: err.message }
    }
    return { ok: false, error: 'Connection failed. Check your network.' }
  }
}
