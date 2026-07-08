import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { streamOpenAICompatible } from './openaiCompatible'

export const glm = asyncHandler(async (req: Request, res: Response) => {
  await streamOpenAICompatible({
    req,
    res,
    provider: 'zai',
    apiUrl: 'https://api.z.ai/api/paas/v4/chat/completions',
    apiKey: process.env.ZAI_API_KEY || ''
  })
})
