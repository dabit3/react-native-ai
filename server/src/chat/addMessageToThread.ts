import { Request, Response } from "express"

interface Body {
  role: string
  content: string
  file_ids?: [string]
}

export async function addMessageToThread(req: Request, res: Response) {
  try {
    const { thread_id, input, file_ids, assistant_id }  = req.body

    console.log('thread_id; ', thread_id)

    const body:Body = {
      role: 'user',
      content: input
    }
    if (file_ids) {
      body.file_ids = file_ids
    }

    const headers = {
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v1',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }

    const response = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers
    }).then(res => res.json())

    const run = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        assistant_id
      })
    }).then(res => res.json())
    
    console.log('run: ', run)

    return res.json({
      runId: run.id
    })

  } catch (err) {
    console.log('error in assistant chat: ', err)
    return res.json({
      error: err
    })
  }
}