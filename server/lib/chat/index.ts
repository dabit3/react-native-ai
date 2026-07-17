import { ChatRequest } from '../types'
import { claude } from './claude'
import { gpt } from './gpt'
import { gemini } from './gemini'
import { glm } from './glm'
import { kimi } from './kimi'

export type ChatHandler = (body: ChatRequest) => Response

export const CHAT_HANDLERS: Record<string, ChatHandler> = {
  claude,
  gpt,
  gemini,
  glm,
  kimi
}
