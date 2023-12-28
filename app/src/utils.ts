import { DOMAIN } from '../constants'
import EventSource from 'react-native-sse'
import { Model } from '../types'

export function getEventSource({
  headers,
  body,
  type
} : {
  headers?: any,
  body: any,
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

export function getFirstNCharsOrLess(text:string, numChars:number = 1000) {
  if (text.length <= numChars) {
    return text;
  }
  return text.substring(0, numChars);
}

export function getFirstN({ messages, size = 10 } : { size?: number, messages: any[] }) {
  if (messages.length > size) {
    const firstN = new Array()
    for(let i = 0; i < size; i++) {
      firstN.push(messages[i])
    }
    return firstN
  } else {
    return messages
  }
}

export function getChatType(type: Model) {
  if (type.label.includes('gpt')) {
    return 'gpt'
  }
  if (type.label.includes('cohere')) {
    return 'cohere'
  }
  if (type.label.includes('mistral')) {
    return 'mistral'
  }
  if (type.label.includes('gemini')) {
    return 'gemini'
  }
  else return 'claude'
}