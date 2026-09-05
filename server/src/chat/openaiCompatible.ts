import { Request, Response } from 'express'
import { Provider } from '../models'
import { ChatMessage, ChatRequest, messageImages } from '../types'
import { streamProvider } from '../provider'

interface StreamArgs {
  req: Request
  res: Response
  provider: Provider
  apiUrl: string
  apiKey: string
}

export function toOpenAIMessages(messages: ChatMessage[]) {
  return messages.map((message) => {
    const images = messageImages(message)
    return {
      role: message.role,
      content: images.length
        ? [
            ...(message.content ? [{ type: 'text', text: message.content }] : []),
            ...images.map((image) => ({
              type: 'image_url',
              image_url: { url: `data:${image.mimeType};base64,${image.data}` }
            }))
          ]
        : message.content
    }
  })
}

export async function streamOpenAICompatible({ req, res, provider, apiUrl, apiKey }: StreamArgs) {
  const request: ChatRequest = req.body
  await streamProvider(
    res,
    request,
    provider,
    (model, signal) =>
      fetch(apiUrl, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: model.modelId,
          messages: toOpenAIMessages(request.messages),
          stream: true,
          ...(provider === 'openai' ? { max_completion_tokens: 16384 } : { max_tokens: 16384 }),
          ...(model.label === 'kimi26' ? { thinking: { type: 'disabled' } } : {})
        })
      }),
    (data) => {
      if (data === '[DONE]') return { done: true }
      const parsed = JSON.parse(data)
      if (parsed.error) return { error: 'The provider reported a stream error. Try again.' }
      const choice = parsed.choices?.[0]
      if (choice?.finish_reason === 'content_filter')
        return { error: 'The provider could not answer this prompt. Try a different prompt.' }
      return { content: choice?.delta?.content || '', done: !!choice?.finish_reason }
    }
  )
}
