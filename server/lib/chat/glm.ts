import { ChatRequest } from '../types'
import { streamOpenAICompatible } from './openaiCompatible'

export function glm(body: ChatRequest): Response {
  return streamOpenAICompatible({
    body,
    provider: 'zai',
    apiUrl: 'https://api.z.ai/api/paas/v4/chat/completions',
    apiKey: process.env.ZAI_API_KEY || ''
  })
}
