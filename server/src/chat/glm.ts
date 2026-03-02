import { Request, Response } from "express"
import asyncHandler from 'express-async-handler'

type ModelLabel = 'glm4Plus'
type ModelName = 'glm-4-plus'

const models: Record<ModelLabel, ModelName> = {
  glm4Plus: 'glm-4-plus',
}

interface RequestBody {
  prompt: string;
  model: ModelLabel;
}

export const glm = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    })

    const { prompt, model }: RequestBody = req.body
    const selectedModel = models[model]

    if (!selectedModel) {
      res.write('data: [DONE]\n\n')
      res.end()
      return
    }

    const decoder = new TextDecoder()
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GLM_API_KEY || ''}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: prompt }],
        stream: true
      })
    })

    const reader = response.body?.getReader()
    if (reader) {
      let brokenLine = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        let chunk = decoder.decode(value)

        if (brokenLine) {
          chunk = brokenLine + chunk
          brokenLine = ''
        }

        const lines = chunk.split('\n')

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const data = trimmed.replace('data: ', '')
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.choices?.[0]?.delta?.content) {
              res.write(`data: ${JSON.stringify(parsed.choices[0].delta)}\n\n`)
            }
          } catch {
            brokenLine = line
          }
        }
      }

      res.write('data: [DONE]\n\n')
      res.end()
    }
  } catch (err) {
    console.log('error in GLM chat: ', err)
    res.write('data: [DONE]\n\n')
    res.end()
  }
})
