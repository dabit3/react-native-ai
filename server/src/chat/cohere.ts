/*
*  stream help from  https://www.builder.io/blog/stream-ai-javascript
*/
import { Request, Response } from "express"

type ModelName = 'cohere' | 'cohereWeb';

interface RequestBody {
  prompt: any;
  model: ModelName;
  conversation_id: string;
}

export async function cohere(req: Request, res: Response) {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    })
    let { prompt, conversation_id, model }: RequestBody = req.body
    
    if (!prompt) {
      return res.json({
        error: 'no prompt'
      })
    }

    const body = {
      message: prompt,
      stream: true,
      conversation_id,
    } as { message: string, stream: boolean, conversation_id: string, connectors?: any[]}
    if (model.includes('web')) {
      body.connectors = [{"id": "web-search"}]
    }
  
    const decoder = new TextDecoder()
    const response = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'authorization': `Bearer ${process.env.COHERE_API_KEY}`
      },
      body: JSON.stringify(body)
    })

    if (response) {
      const reader = response.body?.getReader()
      if (!reader) return res.end

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }
        let chunk = decoder.decode(value)
        res.write(`data: ${chunk}\n\n`)
      }
      
      res.write('data: [DONE]\n\n')
      res.end()
    } else {
      res.end()
    }

  } catch (err) {
    console.log('error in cohere chat: ', err)
    res.write('data: [DONE]\n\n')
    res.end()
  }
}