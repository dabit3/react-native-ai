export interface SSEWriter {
  sendToken: (content: string) => void
  sendError: (message: string) => void
}

/**
 * Builds a streaming SSE Response. The provided `run` callback receives a
 * writer for emitting token/error events; a terminating `[DONE]` event is
 * always sent once it settles.
 */
export function sseResponse(run: (writer: SSEWriter) => Promise<void>): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (chunk: string) => controller.enqueue(encoder.encode(chunk))
      const writer: SSEWriter = {
        sendToken: content => write(`data: ${JSON.stringify({ content })}\n\n`),
        sendError: message => write(`data: ${JSON.stringify({ error: message })}\n\n`)
      }
      try {
        await run(writer)
      } catch (err) {
        console.error('error in sse stream:', err)
        writer.sendError('unexpected server error')
      } finally {
        write('data: [DONE]\n\n')
        controller.close()
      }
    }
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
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
