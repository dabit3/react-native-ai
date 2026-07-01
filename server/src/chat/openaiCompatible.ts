import { Request, Response } from "express"

interface StreamArgs {
  req: Request;
  res: Response;
  models: Record<string, string>;
  apiUrl: string;
  apiKey: string;
}

export async function streamOpenAICompatible({ req, res, models, apiUrl, apiKey }: StreamArgs) {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    })
    const { model, messages } = req.body
    const selectedModel = models[model]

    if (!selectedModel) {
      res.write('data: [DONE]\n\n')
      res.end()
      return
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        stream: true
      })
    })
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let brokenLine = ''
    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        let chunk = decoder.decode(value)
        if (brokenLine) {
          try {
            const { choices } = JSON.parse(brokenLine)
            const { delta } = choices[0]
            const { content } = delta
            if (content) {
              res.write(`data: ${JSON.stringify(content)}\n\n`)
            }
            brokenLine = ''
          } catch (err) {}
        }

        const lines = chunk.split("data: ")
        const parsedLines = lines
          .filter(line => line !== "" && line !== "[DONE]")
          .filter(l => {
            try {
              JSON.parse(l)
              return true
            } catch (err) {
              if (!l.includes('[DONE]')) {
                brokenLine = brokenLine + l
              }
              return false
            }
          })
          .map(l => JSON.parse(l))

        for (const parsedLine of parsedLines) {
          const { choices } = parsedLine
          const { delta } = choices[0]
          const { content } = delta
          if (content) {
            res.write(`data: ${JSON.stringify(delta)}\n\n`)
          }
        }
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.log('error in openai-compatible chat: ', err)
    res.write('data: [DONE]\n\n')
    res.end()
  }
}
