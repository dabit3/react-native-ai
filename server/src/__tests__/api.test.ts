import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../index'

function sseResponse(events: string[]) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(event))
      }
      controller.close()
    }
  })
  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' }
  })
}

describe('server', () => {
  beforeEach(() => {
    delete process.env.API_AUTH_TOKEN
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('GET /health returns ok', async () => {
    const res = await request(createApp()).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  it('GET /models returns chat and image models', async () => {
    const res = await request(createApp()).get('/models')
    expect(res.status).toBe(200)
    expect(res.body.chatModels.length).toBeGreaterThan(0)
    expect(res.body.imageModels.length).toBeGreaterThan(0)
    const claude = res.body.chatModels.find((m: any) => m.label === 'claudeOpus')
    expect(claude.provider).toBe('anthropic')
    expect(res.body.chatModels.every((m: any) => !m.modelId)).toBe(true)
  })

  it('rejects invalid chat request bodies', async () => {
    const res = await request(createApp())
      .post('/chat/claude')
      .send({ model: 'claudeOpus' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('invalid request body')
  })

  it('requires bearer token when API_AUTH_TOKEN is set', async () => {
    process.env.API_AUTH_TOKEN = 'secret'
    const app = createApp()
    const unauthorized = await request(app)
      .post('/chat/claude')
      .send({ model: 'claudeOpus', messages: [{ role: 'user', content: 'hi' }] })
    expect(unauthorized.status).toBe(401)
  })

  it('streams claude tokens as normalized SSE events', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      sseResponse([
        'data: {"type":"content_block_delta","delta":{"text":"Hel"}}\n\n',
        'data: {"type":"content_block_delta","del',
        'ta":{"text":"lo"}}\n\n'
      ]) as any
    )
    const res = await request(createApp())
      .post('/chat/claude')
      .send({ model: 'claudeOpus', messages: [{ role: 'user', content: 'hi' }] })
    expect(res.status).toBe(200)
    expect(res.text).toContain('data: {"content":"Hel"}')
    expect(res.text).toContain('data: {"content":"lo"}')
    expect(res.text).toContain('data: [DONE]')
  })

  it('streams openai-compatible tokens as normalized SSE events', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      sseResponse([
        'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n',
        'data: [DONE]\n\n'
      ]) as any
    )
    const res = await request(createApp())
      .post('/chat/gpt')
      .send({ model: 'gpt52', messages: [{ role: 'user', content: 'hi' }] })
    expect(res.status).toBe(200)
    expect(res.text).toContain('data: {"content":"Hi"}')
    expect(res.text).toContain('data: [DONE]')
  })

  it('emits an error event for unsupported models', async () => {
    const res = await request(createApp())
      .post('/chat/gpt')
      .send({ model: 'not-a-model', messages: [{ role: 'user', content: 'hi' }] })
    expect(res.text).toContain('unsupported model')
    expect(res.text).toContain('data: [DONE]')
  })

  it('emits an error event when the provider fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('rate limited', { status: 429 }) as any
    )
    const res = await request(createApp())
      .post('/chat/claude')
      .send({ model: 'claudeOpus', messages: [{ role: 'user', content: 'hi' }] })
    expect(res.text).toContain('provider error (429)')
    expect(res.text).toContain('data: [DONE]')
  })
})
