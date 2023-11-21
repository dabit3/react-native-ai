import { Request, Response } from "express"

// not in use yet, not complete

export async function runResponse(req: Request, res: Response) {
  try {
    const { thread_id } = req.body
    const headers = {
      'OpenAI-Beta': 'assistants=v1',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
    const response = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs`, {
      headers
    })
    const json = await response.json()
    console.log('json: ', json)
    return res.json({
      success: true
    })
  } catch (err) {
    console.log('error in assistant chat: ', err)
  }
}
