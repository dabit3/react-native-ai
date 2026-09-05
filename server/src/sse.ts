import { Response } from 'express'

export function initSSE(res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache, no-transform',
    'X-Accel-Buffering': 'no'
  })
  res.flushHeaders()
}

export function sendToken(res: Response, content: string) {
  if (!res.destroyed && !res.writableEnded) res.write(`data: ${JSON.stringify({ content })}\n\n`)
}

export function sendError(res: Response, message: string) {
  if (!res.destroyed && !res.writableEnded) res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
}

export function sendDone(res: Response) {
  if (res.destroyed || res.writableEnded) return
  res.write('data: [DONE]\n\n')
  res.end()
}

/**
 * Incrementally parses an SSE byte stream, buffering partial lines across
 * chunk boundaries. Calls onData for each complete `data:` payload.
 */
export function createSSEParser(onData: (data: string) => void) {
  let buffer = ''
  let data: string[] = []
  let eventSize = 0
  const dispatch = () => {
    if (data.length) onData(data.join('\n'))
    data = []
    eventSize = 0
  }
  const parse = (chunk: string) => {
    buffer += chunk
    if (buffer.length > 2_000_000) throw new Error('Oversized provider event')
    let newline: number
    while ((newline = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newline).replace(/\r$/, '')
      buffer = buffer.slice(newline + 1)
      if (!line) dispatch()
      else if (line.startsWith('data:')) {
        eventSize += line.length
        if (eventSize > 2_000_000) throw new Error('Oversized provider event')
        data.push(line.slice(5).replace(/^ /, ''))
      }
    }
  }
  parse.end = () => {
    if (buffer.startsWith('data:')) data.push(buffer.slice(5).replace(/^ /, '').replace(/\r$/, ''))
    buffer = ''
    dispatch()
  }
  return parse
}

export async function pumpStream(
  body: ReadableStream<Uint8Array> | null,
  onChunk: (chunk: string) => void,
  res?: Response,
  shouldStop?: () => boolean
) {
  if (!body) throw new Error('Missing provider stream')
  const reader = body.getReader()
  const decoder = new TextDecoder()
  try {
    while (!res?.destroyed && !shouldStop?.()) {
      const { done, value } = await reader.read()
      if (done) {
        onChunk(decoder.decode())
        break
      }
      onChunk(decoder.decode(value, { stream: true }))
      if (res?.writableNeedDrain)
        await new Promise<void>((resolve) => {
          const finish = () => {
            res.off('drain', finish)
            res.off('close', finish)
            resolve()
          }
          res.once('drain', finish)
          res.once('close', finish)
        })
    }
  } finally {
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}
