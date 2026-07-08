import { DOMAIN } from '../constants'
import EventSource from 'react-native-sse'
import { Model, Provider } from '../types'

const PROVIDER_ROUTES: Record<Provider, string> = {
  anthropic: 'claude',
  openai: 'gpt',
  google: 'gemini',
  zai: 'glm',
  moonshot: 'kimi'
}

export function getChatRoute(model: Model): string {
  return PROVIDER_ROUTES[model.provider] || 'claude'
}

export function getEventSource({
  headers,
  body,
  type
} : {
  headers?: Record<string, string>,
  body: object,
  type: string
}) {
  const es = new EventSource(`${DOMAIN}/chat/${type}`, {
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    method: 'POST',
    body: JSON.stringify(body),
  })

  return es;
}
