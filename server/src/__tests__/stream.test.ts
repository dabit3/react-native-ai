import { request as httpRequest } from 'node:http'
import { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../index'
import { createSSEParser, pumpStream } from '../sse'

beforeEach(() => {
  vi.stubEnv('API_AUTH_TOKEN', '')
  vi.stubEnv('OPENAI_API_KEY', 'test-openai')
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-anthropic')
  vi.stubEnv('GEMINI_API_KEY', 'test-google')
  vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Unexpected network request'))
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('stream lifecycle', () => {
  it('aborts the upstream request when the client disconnects', async () => {
    let upstreamSignal: AbortSignal | null = null
    vi.mocked(fetch).mockImplementation(async (_url, options) => {
      upstreamSignal = options!.signal as AbortSignal
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode('data: {"choices":[{"delta":{"content":"First token"}}]}\n\n')
            )
            upstreamSignal!.addEventListener('abort', () => controller.error(new Error('Cancelled')), {
              once: true
            })
          }
        })
      )
    })
    const server = createApp().listen(0)
    try {
      const port = (server.address() as AddressInfo).port
      await new Promise<void>((resolve, reject) => {
        const client = httpRequest(
          {
            hostname: '127.0.0.1',
            port,
            path: '/chat/gpt',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          },
          (response) => {
            response.once('data', () => {
              response.destroy()
              resolve()
            })
          }
        )
        client.on('error', reject)
        client.end(JSON.stringify({ model: 'gpt55', messages: [{ role: 'user', content: 'Hi' }] }))
      })
      await vi.waitFor(() => expect(upstreamSignal?.aborted).toBe(true))
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })

  it('finishes on the provider terminal event without waiting for the socket to close', async () => {
    let cancelled = false
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(
                'data: {"choices":[{"delta":{"content":"Done"},"finish_reason":"stop"}]}\n\n'
              )
            )
          },
          cancel() {
            cancelled = true
          }
        })
      )
    )
    const res = await request(createApp())
      .post('/chat/gpt')
      .send({ model: 'gpt55', messages: [{ role: 'user', content: 'Hi' }] })
    expect(res.text).toContain('Done')
    expect(res.text).toContain('[DONE]')
    expect(cancelled).toBe(true)
  })

  it('forwards only public Gemini text, not thought tokens', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        'data: {"candidates":[{"content":{"parts":[{"text":"private reasoning","thought":true},{"text":"Final answer"}]},"finishReason":"STOP"}]}\n\n'
      )
    )
    const res = await request(createApp())
      .post('/chat/gemini')
      .send({ model: 'geminiFlash', messages: [{ role: 'user', content: 'Hi' }] })
    expect(res.text).toContain('Final answer')
    expect(res.text).not.toContain('private reasoning')
    expect(res.text).not.toContain('error')
  })

  it('processes Anthropic stop and in-band error events', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        'data: {"type":"content_block_delta","delta":{"text":"Answer"}}\n\ndata: {"type":"message_stop"}\n\n'
      )
    )
    const res = await request(createApp())
      .post('/chat/claude')
      .send({ model: 'claudeSonnet5', messages: [{ role: 'user', content: 'Hi' }] })
    expect(res.text).toContain('Answer')
    expect(res.text).not.toContain('error')
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('data: {"type":"error","error":{"message":"private"}}\n\n')
    )
    const failed = await request(createApp())
      .post('/chat/claude')
      .send({ model: 'claudeSonnet5', messages: [{ role: 'user', content: 'Hi' }] })
    expect(failed.text).toContain('stream error')
    expect(failed.text).not.toContain('private')
  })

  it('preserves UTF-8 characters split across byte chunks and releases readers', async () => {
    const values: string[] = []
    const parser = createSSEParser((value) => values.push(value))
    const bytes = new TextEncoder().encode('data: café 世界\n\n')
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const byte of bytes) controller.enqueue(Uint8Array.of(byte))
        controller.close()
      }
    })
    await pumpStream(body, parser)
    parser.end()
    expect(values).toEqual(['café 世界'])
    expect(body.locked).toBe(false)
  })
})
