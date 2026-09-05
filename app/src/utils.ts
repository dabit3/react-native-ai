import { Model, Provider } from '../types'

const PROVIDER_ROUTES: Record<Provider, string> = {
  anthropic: 'claude',
  openai: 'gpt',
  google: 'gemini',
  zai: 'glm',
  moonshot: 'kimi'
}

export function getChatRoute(model: Model): string {
  return PROVIDER_ROUTES[model.provider]
}

export function apiHeaders(token: string): Record<string, string> {
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

export async function responseError(response: { status: number; json: () => Promise<any> }): Promise<string> {
  if (response.status === 401) return 'The server rejected your session token. Update it in Settings.'
  if (response.status === 413)
    return 'This request is too large. Use fewer images or start a new conversation.'
  if (response.status === 429) return 'The request limit was reached. Wait a moment, then try again.'
  try {
    const data = await response.json()
    if (typeof data.error === 'string') return data.error
  } catch {}
  return `The server returned an error (${response.status}). Try again.`
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Try again.'
}
