import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { getChatModel } from '../models'
import { ChatMessage, ChatRequest } from '../types'
import { initSSE, sendToken, sendError, sendDone, createSSEParser, pumpStream } from '../sse'

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

export const gemini = asyncHandler(async (req: Request, res: Response) => {
  initSSE(res)
  try {
    const { messages, model }: ChatRequest = req.body
    const chatModel = getChatModel(model)

    if (!chatModel || chatModel.provider !== 'google') {
      sendError(res, `unsupported model: ${model}`)
      sendDone(res)
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
      sendError(res, `provider error (${response.status})`)
      sendDone(res)
      return
    }

    const parse = createSSEParser(data => {
      try {
        const parsed = JSON.parse(data)
        const text = parsed.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text || '')
          .join('')
        if (text) sendToken(res, text)
      } catch {}
    })

    await pumpStream(response.body, parse)
    sendDone(res)
  } catch (err) {
    console.error('error in gemini chat:', err)
    sendError(res, 'unexpected server error')
    sendDone(res)
  }
})
