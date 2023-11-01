import { Request, Response, NextFunction } from "express"
import asyncHandler from 'express-async-handler'

export const openai = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.send("NOT IMPLEMENTED: OpenAI");
})