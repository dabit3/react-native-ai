import { Request, Response } from "express"

export async function runStatus(req: Request, res: Response) {
  try {
    const { thread_id, run_id } = req.body

    console.log('thread_id: ', thread_id)
    console.log('run_id: ', run_id)

    const headers = {
      'OpenAI-Beta': 'assistants=v1',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
    const response = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs/${run_id}`, {
      headers
    })
    const json = await response.json()
    
    if (json.status === 'completed') {
      return res.json(json)
    } else {
      return res.json({
        status: 'running'
      })
    }
  } catch (err) {
    console.log('error in assistant chat: ', err)
  }
}