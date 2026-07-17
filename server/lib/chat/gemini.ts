import { getChatModel } from '../models'
import { ChatMessage, ChatRequest } from '../types'
import { sseResponse, createSSEParser, pumpStream } from '../sse'

function toGeminiContents(messages: ChatMessage[]) {
  return messages
    .filter(m => m.role !== 'system')
    .map(m => {
      const parts: any[] = []
      if (m.content) parts.push({ text: m.content })
      if (m.image) {
        parts.push({
          inline_data: {
            mime_type: m.image.mimeType,
            data: m.image.data
          }
        })
      }
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts
      }
    })
}

export function gemini({ messages, model }: ChatRequest): Response {
  return sseResponse(async writer => {
    const chatModel = getChatModel(model)

    if (!chatModel || chatModel.provider !== 'google') {
      writer.sendError(`unsupported model: ${model}`)
      return
    }

    const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n')

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${chatModel.modelId}:streamGenerateContent?alt=sse`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY || ''
        },
        body: JSON.stringify({
          contents: toGeminiContents(messages),
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {})
        })
      }
    )

    if (!response.ok) {
      const detail = await response.text()
      console.error('gemini error:', response.status, detail)
      writer.sendError(`provider error (${response.status})`)
      return
    }

    const parse = createSSEParser(data => {
      try {
        const parsed = JSON.parse(data)
        const text = parsed.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text || '')
          .join('')
        if (text) writer.sendToken(text)
      } catch {}
    })

    await pumpStream(response.body, parse)
  })
}
