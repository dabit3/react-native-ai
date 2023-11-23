import { Request, Response } from "express"
import { saveFileToOpenai } from '../helpers/saveFileToOpenai'

interface Body {
  role: string
  content: string
  file_ids?: [string]
  tools?: [{ type: string }]
}

export async function addMessageToThread(req: Request, res: Response) {
  try {
    const { thread_id, input, assistant_id }  = req.body
    const file = req.file

    const body:Body = {
      role: 'user',
      content: input
    }
  
    if (file) {
      const response = await saveFileToOpenai(file)
      console.log('response: ', response)
      body.file_ids = [response.id]
    }
    console.log('body:', body)

    const headers = {
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v1',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }

    await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers
    }).then(res => res.json())

    const run = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        assistant_id,
        tools: [{ type: "code_interpreter" }, { type: "retrieval" }]
      })
    }).then(res => res.json())

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
