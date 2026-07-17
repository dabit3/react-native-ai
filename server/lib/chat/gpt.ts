import { ChatRequest } from '../types'
import { streamOpenAICompatible } from './openaiCompatible'

export function gpt(body: ChatRequest): Response {
  return streamOpenAICompatible({
    body,
    provider: 'openai',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: process.env.OPENAI_API_KEY || ''
  })
}
