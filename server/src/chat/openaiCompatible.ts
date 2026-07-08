import { Request, Response } from 'express'
import { Provider, getChatModel } from '../models'
import { ChatMessage, ChatRequest } from '../types'
import { initSSE, sendToken, sendError, sendDone, createSSEParser, pumpStream } from '../sse'

interface StreamArgs {
  req: Request
  res: Response
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

export async function streamOpenAICompatible({ req, res, provider, apiUrl, apiKey }: StreamArgs) {
  initSSE(res)
  try {
    const { model, messages }: ChatRequest = req.body
    const chatModel = getChatModel(model)

    if (!chatModel || chatModel.provider !== provider) {
      sendError(res, `unsupported model: ${model}`)
      sendDone(res)
      return
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
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
      sendError(res, `provider error (${response.status})`)
      sendDone(res)
      return
    }

    const parse = createSSEParser(data => {
      if (data === '[DONE]') return
      try {
        const parsed = JSON.parse(data)
        const content = parsed.choices?.[0]?.delta?.content
        if (content) sendToken(res, content)
      } catch {}
    })

    await pumpStream(response.body, parse)
    sendDone(res)
  } catch (err) {
    console.error(`error in ${provider} chat:`, err)
    sendError(res, 'unexpected server error')
    sendDone(res)
  }
}
