import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { ChatMessage, ChatRequest, messageImages } from '../types'
import { streamProvider } from '../provider'

export function toGeminiContents(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [
        ...(message.content ? [{ text: message.content }] : []),
        ...messageImages(message).map((image) => ({
          inlineData: { mimeType: image.mimeType, data: image.data }
        }))
      ]
    }))
}

export const gemini = asyncHandler(async (req: Request, res: Response) => {
  const request: ChatRequest = req.body
  const system = request.messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n')
  await streamProvider(
    res,
    request,
    'google',
    (model, signal) =>
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model.modelId}:streamGenerateContent?alt=sse`,
        {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY || '' },
          body: JSON.stringify({
            contents: toGeminiContents(request.messages),
            generationConfig: { maxOutputTokens: 16384 },
            ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {})
          })
        }
      ),
    (data) => {
      const parsed = JSON.parse(data)
      if (parsed.error) return { error: 'The provider reported a stream error. Try again.' }
      const candidate = parsed.candidates?.[0]
      if (
        parsed.promptFeedback?.blockReason ||
        (candidate?.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason))
      )
        return { error: 'The provider could not answer this prompt. Try a different prompt.' }
      return {
        content:
          candidate?.content?.parts
            ?.filter((part: { thought?: boolean }) => !part.thought)
            .map((part: { text?: string }) => part.text || '')
            .join('') || '',
        done: !!candidate?.finishReason
      }
    }
  )
})
