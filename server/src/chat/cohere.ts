import { Request, Response, NextFunction } from "express"
import asyncHandler from 'express-async-handler'

export const cohere = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.send("NOT IMPLEMENTED: Cohere");
})