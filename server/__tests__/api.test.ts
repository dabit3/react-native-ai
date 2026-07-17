import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET as healthGET } from '@/app/health/route'
import { GET as modelsGET } from '@/app/models/route'
import { POST as chatPOST } from '@/app/chat/[provider]/route'

function chatRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/chat/x', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  })
}

function params(provider: string) {
  return { params: Promise.resolve({ provider }) }
}

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
    const res = healthGET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })

  it('GET /models returns chat and image models', async () => {
    const res = modelsGET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.chatModels.length).toBeGreaterThan(0)
    expect(body.imageModels.length).toBeGreaterThan(0)
    const claude = body.chatModels.find((m: any) => m.label === 'claudeOpus')
    expect(claude.provider).toBe('anthropic')
    expect(body.chatModels.every((m: any) => !m.modelId)).toBe(true)
  })

  it('rejects invalid chat request bodies', async () => {
    const res = await chatPOST(chatRequest({ model: 'claudeOpus' }), params('claude'))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('invalid request body')
  })

  it('returns 404 for unknown chat providers', async () => {
    const res = await chatPOST(
      chatRequest({ model: 'claudeOpus', messages: [{ role: 'user', content: 'hi' }] }),
      params('nope')
    )
    expect(res.status).toBe(404)
  })

  it('requires bearer token when API_AUTH_TOKEN is set', async () => {
    process.env.API_AUTH_TOKEN = 'secret'
    const res = await chatPOST(
      chatRequest({ model: 'claudeOpus', messages: [{ role: 'user', content: 'hi' }] }),
      params('claude')
    )
    expect(res.status).toBe(401)
  })

  it('streams claude tokens as normalized SSE events', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      sseResponse([
        'data: {"type":"content_block_delta","delta":{"text":"Hel"}}\n\n',
        'data: {"type":"content_block_delta","del',
        'ta":{"text":"lo"}}\n\n'
      ]) as any
    )
    const res = await chatPOST(
      chatRequest({ model: 'claudeOpus', messages: [{ role: 'user', content: 'hi' }] }),
      params('claude')
    )
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('data: {"content":"Hel"}')
    expect(text).toContain('data: {"content":"lo"}')
    expect(text).toContain('data: [DONE]')
  })

  it('streams openai-compatible tokens as normalized SSE events', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      sseResponse([
        'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n',
        'data: [DONE]\n\n'
      ]) as any
    )
    const res = await chatPOST(
      chatRequest({ model: 'gpt52', messages: [{ role: 'user', content: 'hi' }] }),
      params('gpt')
    )
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('data: {"content":"Hi"}')
    expect(text).toContain('data: [DONE]')
  })

  it('emits an error event for unsupported models', async () => {
    const res = await chatPOST(
      chatRequest({ model: 'not-a-model', messages: [{ role: 'user', content: 'hi' }] }),
      params('gpt')
    )
    const text = await res.text()
    expect(text).toContain('unsupported model')
    expect(text).toContain('data: [DONE]')
  })

  it('emits an error event when the provider fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('rate limited', { status: 429 }) as any
    )
    const res = await chatPOST(
      chatRequest({ model: 'claudeOpus', messages: [{ role: 'user', content: 'hi' }] }),
      params('claude')
    )
    const text = await res.text()
    expect(text).toContain('provider error (429)')
    expect(text).toContain('data: [DONE]')
  })
})
