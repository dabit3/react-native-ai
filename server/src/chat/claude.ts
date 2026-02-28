import { Request, Response, NextFunction } from "express"
import asyncHandler from 'express-async-handler'

type ModelLabel = 'claudeOpus' | 'claudeSonnet' | 'claudeHaiku' | 'claudeOpus46' | 'claudeSonnet46'
type ModelName =
  | 'claude-opus-4-5-20251101'
  | 'claude-sonnet-4-5-20250929'
  | 'claude-haiku-4-5-20251001'
  | 'claude-opus-4-6'
  | 'claude-sonnet-4-6';

const models: Record<ModelLabel, ModelName> = {
  claudeOpus: 'claude-opus-4-5-20251101',
  claudeSonnet: 'claude-sonnet-4-5-20250929',
  claudeHaiku: 'claude-haiku-4-5-20251001',
  claudeOpus46: 'claude-opus-4-6',
  claudeSonnet46: 'claude-sonnet-4-6'
}

interface RequestBody {
  prompt: any;
  model: ModelLabel;
}

export const claude = asyncHandler(async (req: Request, res: Response) => {
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
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'messages-2023-12-15',
        'x-api-key': process.env.ANTHROPIC_API_KEY || ''
      },
      body: JSON.stringify({
        model: selectedModel,
        "messages": [{"role": "user", "content": prompt }],
        "max_tokens": 4096,
        stream: true
      })
    })

    const reader = response.body?.getReader()
    if (reader) {
      let index = 0

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }
  
        let chunk = decoder.decode(value)

        const lines = chunk.split("\n")
  
        const parsedLines = lines
          .filter(line => line.startsWith('data: '))
          .map(line => {
            try {
              return JSON.parse(line.replace('data: ', ''))
            } catch {
              return null
            }
          })
          .filter(Boolean)

        for (const parsedLine of parsedLines) {
          if (parsedLine) {
            if (parsedLine.delta && parsedLine.delta.text) {
              res.write(`data: ${JSON.stringify(parsedLine.delta)}\n\n`)
            }
          }
        }
      }
  
      res.write('data: [DONE]\n\n')
      res.end()
    }
  } catch (err) {
    console.log('error in claude chat: ', err)
    res.write('data: [DONE]\n\n')
    res.end()
  }
})
