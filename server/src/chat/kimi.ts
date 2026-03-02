import { Request, Response } from "express"
import asyncHandler from 'express-async-handler'

type ModelLabel = 'kimiK25'
type ModelName = 'kimi-k2.5'

const models: Record<ModelLabel, ModelName> = {
  kimiK25: 'kimi-k2.5'
}

export const kimi = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    })
    const { model, messages } = req.body
    const selectedModel = models[model as ModelLabel]

    if (!selectedModel) {
      res.write('data: [DONE]\n\n')
      res.end()
      return
    }

    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MOONSHOT_API_KEY}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        stream: true
      })
    })
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let brokenLine = ''
    if (reader) {
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

        const lines = chunk.split("data: ")
        const parsedLines = lines
          .filter(line => line !== "" && line !== "[DONE]")
          .filter(l => {
            try {
              JSON.parse(l)
              return true
            } catch (err) {
              if (!l.includes('[DONE]')) {
                brokenLine = brokenLine + l
              }
              return false
            }
          })
          .map(l => JSON.parse(l))

          for (const parsedLine of parsedLines) {
            const { choices } = parsedLine
            const { delta } = choices[0]
            const { content } = delta
            if (content) {
              res.write(`data: ${JSON.stringify(content)}\n\n`)
            }
          }
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.log('error in Kimi chat: ', err)
    res.write('data: [DONE]\n\n')
    res.end()
  }
})
