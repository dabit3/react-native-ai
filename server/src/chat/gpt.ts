import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { streamOpenAICompatible } from './openaiCompatible'

export const gpt = asyncHandler(async (req: Request, res: Response) => {
  await streamOpenAICompatible({
    req,
    res,
    provider: 'openai',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: process.env.OPENAI_API_KEY || ''
  })
})
