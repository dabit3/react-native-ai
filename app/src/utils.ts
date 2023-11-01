import { DOMAIN } from './constants'

export async function getEventSource({
  headers,
  body,
  type
} : {
  headers: any,
  body: any,
  type: string
}) {
  const es = new EventSource(`${EXPRESS_DOMAIN}/api/chat/${type}`, {
    headers,
    method: 'POST',
    body,
  })
  return es
}