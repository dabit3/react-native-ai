import { ChatRequest } from '../types'
import { streamOpenAICompatible } from './openaiCompatible'

export function kimi(body: ChatRequest): Response {
  return streamOpenAICompatible({
    body,
    provider: 'moonshot',
    apiUrl: 'https://api.moonshot.ai/v1/chat/completions',
    apiKey: process.env.MOONSHOT_API_KEY || ''
  })
}
