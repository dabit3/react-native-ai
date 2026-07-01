import { Request, Response } from "express"
import asyncHandler from 'express-async-handler'
import { streamOpenAICompatible } from './openaiCompatible'

export const kimi = asyncHandler(async (req: Request, res: Response) => {
  const models: any = {
    kimiK27: 'kimi-k2.7'
  }
  await streamOpenAICompatible({
    req,
    res,
    models,
    apiUrl: 'https://api.moonshot.ai/v1/chat/completions',
    apiKey: process.env.MOONSHOT_API_KEY || ''
  })
})
