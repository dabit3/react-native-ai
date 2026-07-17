import { Provider, getChatModel } from '../models'
import { ChatMessage, ChatRequest } from '../types'
import { sseResponse, createSSEParser, pumpStream } from '../sse'

interface StreamArgs {
  body: ChatRequest
  provider: Provider
  apiUrl: string
  apiKey: string
}

function toOpenAIMessages(messages: ChatMessage[], supportsVision: boolean) {
  return messages.map(m => {
    if (m.image && supportsVision) {
      return {
        role: m.role,
        content: [
          ...(m.content ? [{ type: 'text', text: m.content }] : []),
          {
            type: 'image_url',
            image_url: { url: `data:${m.image.mimeType};base64,${m.image.data}` }
          }
        ]
      }
    }
    return { role: m.role, content: m.content }
  })
}

export function streamOpenAICompatible({ body, provider, apiUrl, apiKey }: StreamArgs): Response {
  return sseResponse(async writer => {
    const { model, messages } = body
    const chatModel = getChatModel(model)

    if (!chatModel || chatModel.provider !== provider) {
      writer.sendError(`unsupported model: ${model}`)
      return
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: chatModel.modelId,
        messages: toOpenAIMessages(messages, chatModel.supportsVision),
        stream: true
      })
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error(`${provider} error:`, response.status, detail)
      writer.sendError(`provider error (${response.status})`)
      return
    }

    const parse = createSSEParser(data => {
      if (data === '[DONE]') return
      try {
        const parsed = JSON.parse(data)
        const content = parsed.choices?.[0]?.delta?.content
        if (content) writer.sendToken(content)
      } catch {}
    })

    await pumpStream(response.body, parse)
  })
}
