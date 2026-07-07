import { Request, Response } from "express"
import asyncHandler from 'express-async-handler'

export const gpt = asyncHandler(async (req: Request, res: Response) => {
  const models:any = {
    gpt52: 'gpt-5.2-2025-12-11',
    gpt5Mini: 'gpt-5-mini-2025-08-07'
  }
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  const apiKey = process.env.OPENAI_API_KEY

  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    })
    const { model, messages } = req.body
    const selectedModel = models[model] || model

    if (!selectedModel) {
      res.write('data: [DONE]\n\n')
      res.end()
      return
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
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
          try {
            const { choices } = JSON.parse(brokenLine)
            const { delta } = choices[0]
            const { content } = delta
            if (content) {
              res.write(`data: ${JSON.stringify(content)}\n\n`)
            }
            brokenLine = ''
          } catch (err) {} 
        }
        
        const lines = chunk.split("data: ")
        const parsedLines = lines
          .filter(line => line !== "" && line !== "[DONE]")
          .filter(l => {
            try {
              JSON.parse(l)
              return true
            } catch (err) {
              console.log('line thats not json:', l)
              if (!l.includes('[DONE]'))  {
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
              res.write(`data: ${JSON.stringify(delta)}\n\n`)
            }
          }
      }
    }
  
    res.write('data: [DONE]\n\n')
  } catch (err) {
    console.log('error: ', err)
  }
})