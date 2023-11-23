import { Request, Response } from "express"
import { saveToBytescale } from "../helpers/saveToBytescale"
import { saveFileToOpenai } from '../helpers/saveFileToOpenai'

interface Body {
  model: string
  name: string
  instructions?: string
  file_ids?: [string]
  tools?: any[]
}

export async function createAssistant(req: Request, res: Response) {
  try {
    const { instructions, input }  = req.body
    const file = req.file
    let assistantId
    let threadId
    let runId

    const body: Body = {
      model: 'gpt-4-1106-preview',
      name: 'RN AI Assistant'
    }

    const headers = {
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v1',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }

    if (instructions) {
      body.instructions = instructions
    }

    if (file) {
      const response = await saveFileToOpenai(file)
      body.file_ids = [response.id]
      body.tools = [{ type: "code_interpreter" }, { type: "retrieval" }]
    }

    const assistant = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      body: JSON.stringify(body),
      headers
    }).then(res => res.json())
    assistantId = assistant.id

    const thread = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers
    }).then(res => res.json())
    threadId = thread.id

    console.log('threadId: ', threadId)
  
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        role: 'user',
        content: input
      }),
      headers
    }).then(res => res.json())

    const run = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        assistant_id: assistantId
      })
    }).then(res => res.json())
    runId = run.id
  
    return res.json({
      assistantId,
      threadId,
      runId
    })

  } catch (err) {
    console.log('error in assistant chat: ', err)
    return res.json({ error: err })
  }
}