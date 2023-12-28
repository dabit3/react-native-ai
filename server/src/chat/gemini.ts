import { GoogleGenerativeAI } from "@google/generative-ai"

import { Request, Response } from "express"

export async function gemini(req: Request, res: Response) {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    })
    const { prompt } = req.body
    if (!prompt) {
      return res.json({
        error: 'no prompt'
      })
    }

    const genAIInit = new GoogleGenerativeAI(`${process.env.GEMINI_API_KEY}`)

    // For text-only input, use the gemini-pro model
    const model = genAIInit.getGenerativeModel({
      model: "gemini-pro",
    })
    
    const geminiResult = await model.generateContentStream(prompt)

    if (geminiResult && geminiResult.stream) {
        await streamToStdout(geminiResult.stream, res)
      } else {
        res.end()
      }
  
    } catch (err) {
      console.log('error in Gemini chat: ', err)
      res.write('data: [DONE]\n\n')
      res.end()
    }
}

export async function streamToStdout(stream :any, res: Response) {
  for await (const chunk of stream) {
    const chunkText = chunk.text()
    res.write(`data: ${JSON.stringify(chunkText)}\n\n`)
  }
  res.write('data: [DONE]\n\n')
  res.end()
}