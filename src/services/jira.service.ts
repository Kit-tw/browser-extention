import type { JiraIssue, JiraSearchResult } from '../types/jira.types'

export class JiraApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message)
    this.name = 'JiraApiError'
  }
}

function buildAuthHeader(email: string, apiToken: string): string {
  return 'Basic ' + btoa(`${email}:${apiToken}`)
}

async function fetchWithAuth<T>(
  url: string,
  email: string,
  apiToken: string,
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: buildAuthHeader(email, apiToken),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new JiraApiError(
      `Jira API error: ${response.status} ${response.statusText}`,
      response.status,
    )
  }

  return response.json() as Promise<T>
}

export async function fetchJiraIssues(
  baseUrl: string,
  email: string,
  apiToken: string,
): Promise<JiraIssue[]> {
  const url = `${baseUrl.replace(/\/$/, '')}/rest/api/3/search/jql`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: buildAuthHeader(email, apiToken),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      jql: 'assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC',
      fields: ['summary', 'status', 'priority', 'duedate'],
      maxResults: 50,
    }),
  })

  if (!response.ok) {
    throw new JiraApiError(`Jira API error: ${response.status} ${response.statusText}`, response.status)
  }

  const result = (await response.json()) as JiraSearchResult
  return result.issues
}

export async function testJiraConnection(
  baseUrl: string,
  email: string,
  apiToken: string,
): Promise<{ ok: boolean; name?: string; error?: string }> {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/rest/api/3/myself`
    const data = await fetchWithAuth<{ displayName?: string }>(url, email, apiToken)
    return { ok: true, name: data.displayName }
  } catch (err) {
    if (err instanceof JiraApiError) {
      if (err.status === 401) {
        return { ok: false, error: 'Invalid credentials. Check your email and API token.' }
      }
      return { ok: false, error: err.message }
    }
    return { ok: false, error: 'Connection failed. Check the base URL and your network.' }
  }
}
