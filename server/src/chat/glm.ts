import { Request, Response } from "express"
import asyncHandler from 'express-async-handler'
import { streamOpenAICompatible } from './openaiCompatible'

export const glm = asyncHandler(async (req: Request, res: Response) => {
  const models: any = {
    glm52: 'glm-5.2'
  }
  await streamOpenAICompatible({
    req,
    res,
    models,
    apiUrl: 'https://api.z.ai/api/paas/v4/chat/completions',
    apiKey: process.env.ZAI_API_KEY || ''
  })
})
