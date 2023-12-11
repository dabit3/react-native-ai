import { Request, Response, NextFunction } from "express"
import asyncHandler from 'express-async-handler'

type ModelName = 'claude-2.0' | 'claude-instant-1.2';

const models: Record<string, ModelName> = {
  claude: 'claude-2.0',
  claudeInstant: 'claude-instant-1.2'
}

interface RequestBody {
  prompt: any;
  model: ModelName;
}

export const claude = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    })

    const { prompt, model }: RequestBody = req.body

    const decoder = new TextDecoder()
    const response = await fetch('https://api.anthropic.com/v1/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY || ''
      },
      body: JSON.stringify({
        model: models[model],
        prompt: prompt,
        "max_tokens_to_sample": 5000,
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
        const lines = chunk.split("event: completion")
  
        const parsedLines = lines
          .filter(line => line.includes('log_id'))
          .map(line => line.replace('data: ', ''))
          .filter(line => {
            try {
              JSON.parse(line)
              return true
            } catch (err) {
              return false
            } 
          })
          .map(l => JSON.parse(l))
          for (const parsedLine of parsedLines) {
            if (parsedLine) {
              if (parsedLine.completion) {
                if (index == 0) {
                  parsedLine.completion = parsedLine.completion.trim()
                  index = index + 1
                }
                res.write(`data: ${JSON.stringify(parsedLine)}\n\n`)
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