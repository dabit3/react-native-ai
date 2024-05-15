import { Request, Response } from "express"
import asyncHandler from 'express-async-handler'

export const gpt = asyncHandler(async (req: Request, res: Response) => {
  const models:any = {
    gptTurbo: 'gpt-4-turbo',
    gpt: 'gpt-4o'
  }
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    })
    const { model, messages } = req.body

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: models[model],
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