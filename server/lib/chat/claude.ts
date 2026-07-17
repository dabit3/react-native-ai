import { getChatModel } from '../models'
import { ChatMessage, ChatRequest } from '../types'
import { sseResponse, createSSEParser, pumpStream } from '../sse'

function toAnthropicMessages(messages: ChatMessage[]) {
  return messages
    .filter(m => m.role !== 'system')
    .map(m => {
      if (m.image) {
        return {
          role: m.role,
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: m.image.mimeType,
                data: m.image.data
              }
            },
            ...(m.content ? [{ type: 'text', text: m.content }] : [])
          ]
        }
      }
      return { role: m.role, content: m.content }
    })
}

export function claude({ messages, model }: ChatRequest): Response {
  return sseResponse(async writer => {
    const chatModel = getChatModel(model)

    if (!chatModel || chatModel.provider !== 'anthropic') {
      writer.sendError(`unsupported model: ${model}`)
      return
    }

    const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY || ''
      },
      body: JSON.stringify({
        model: chatModel.modelId,
        messages: toAnthropicMessages(messages),
        ...(system ? { system } : {}),
        max_tokens: 4096,
        stream: true
      })
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error('anthropic error:', response.status, detail)
      writer.sendError(`provider error (${response.status})`)
      return
    }

    const parse = createSSEParser(data => {
      try {
        const parsed = JSON.parse(data)
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          writer.sendToken(parsed.delta.text)
        }
      } catch {}
    })

    await pumpStream(response.body, parse)
  })
}
