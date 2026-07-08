import { Response } from 'express'

export function initSSE(res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  })
}

export function sendToken(res: Response, content: string) {
  res.write(`data: ${JSON.stringify({ content })}\n\n`)
}

export function sendError(res: Response, message: string) {
  res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
}

export function sendDone(res: Response) {
  res.write('data: [DONE]\n\n')
  res.end()
}

/**
 * Incrementally parses an SSE byte stream, buffering partial lines across
 * chunk boundaries. Calls onData for each complete `data:` payload.
 */
export function createSSEParser(onData: (data: string) => void) {
  let buffer = ''
  return (chunk: string) => {
    buffer += chunk
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data) onData(data)
    }
  }
}

export async function pumpStream(
  body: ReadableStream<Uint8Array> | null,
  onChunk: (chunk: string) => void
) {
  if (!body) return
  const reader = body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    onChunk(decoder.decode(value, { stream: true }))
  }
}
