import { Request, Response } from "express"

const endpoint = 'https://api.openai.com/v1/files'

export async function uploadFile(req: Request, res: Response) {
  try {
    const { prompt, codeInterpreter }  = req.body
  } catch (err) {
    console.log('error in assistant chat: ', err)
  }
}