import { DOMAIN } from '../constants'

export async function getEventSource({
  headers,
  body,
  type
} : {
  headers: any,
  body: any,
  type: string
}) {
  const response = await fetch(`${DOMAIN}/api/chat/${type}`, {
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    method: 'POST',
    body: JSON.stringify(body),
  });
  const es = new EventSource(response.url);
  return es;
}