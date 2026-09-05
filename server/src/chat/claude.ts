import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { ChatMessage, ChatRequest, messageImages } from '../types'
import { streamProvider } from '../provider'

export function toAnthropicMessages(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.role !== 'system')
    .map((message) => {
      const images = messageImages(message)
      return {
        role: message.role,
        content: images.length
          ? [
              ...images.map((image) => ({
                type: 'image',
                source: { type: 'base64', media_type: image.mimeType, data: image.data }
              })),
              ...(message.content ? [{ type: 'text', text: message.content }] : [])
            ]
          : message.content
      }
    })
}

export const claude = asyncHandler(async (req: Request, res: Response) => {
  const request: ChatRequest = req.body
  const system = request.messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n')
  await streamProvider(
    res,
    request,
    'anthropic',
    (model, signal) =>
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': process.env.ANTHROPIC_API_KEY || ''
        },
        body: JSON.stringify({
          model: model.modelId,
          messages: toAnthropicMessages(request.messages),
          ...(system ? { system } : {}),
          max_tokens: 16384,
          stream: true
        })
      }),
    (data) => {
      const parsed = JSON.parse(data)
      if (parsed.type === 'error') return { error: 'The provider reported a stream error. Try again.' }
      return {
        content: parsed.type === 'content_block_delta' ? parsed.delta?.text || '' : '',
        done: parsed.type === 'message_stop'
      }
    }
  )
})
