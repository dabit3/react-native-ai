import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { streamOpenAICompatible } from './openaiCompatible'

export const kimi = asyncHandler(async (req: Request, res: Response) => {
  await streamOpenAICompatible({
    req,
    res,
    provider: 'moonshot',
    apiUrl: 'https://api.moonshot.ai/v1/chat/completions',
    apiKey: process.env.MOONSHOT_API_KEY || ''
  })
})
