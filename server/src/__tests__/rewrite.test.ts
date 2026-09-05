import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../index'
import { createSSEParser } from '../sse'

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6lZkAAAAASUVORK5CYII='
const image = { mimeType: 'image/png', data: png }
const completion = (events: object[]) =>
  new Response(events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('') + 'data: [DONE]\n\n', {
    headers: { 'Content-Type': 'text/event-stream' }
  })

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Unexpected provider request in test'))
  vi.stubEnv('API_AUTH_TOKEN', '')
  vi.stubEnv('GEMINI_API_KEY', 'test-google')
  vi.stubEnv('OPENAI_API_KEY', 'test-openai')
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-anthropic')
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('model registry', () => {
  it('reports configured providers, capabilities, and image formats without leaking keys', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')
    const res = await request(createApp()).get('/models')
    const openai = res.body.chatModels.find((model: any) => model.label === 'gpt55')
    expect(openai).toMatchObject({ available: false, supportsVision: true, tier: 'Deep' })
    expect(res.body.chatModels.find((model: any) => model.label === 'claudeSonnet5').available).toBe(true)
    expect(res.body.imageModels.find((model: any) => model.label === 'gptImage2').aspectRatios).toContain(
      '16:9'
    )
    expect(res.text).not.toContain('test-anthropic')
    expect(res.text).not.toContain('modelId')
  })
})

describe('validated multimodal requests', () => {
  it('rejects invalid image bytes before calling a provider', async () => {
    const fetch = vi.spyOn(global, 'fetch')
    const res = await request(createApp())
      .post('/chat/gpt')
      .send({
        model: 'gpt55',
        messages: [
          { role: 'user', content: 'look', images: [{ mimeType: 'image/png', data: 'not-an-image' }] }
        ]
      })
    expect(res.status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects non-user images and empty conversation turns', async () => {
    for (const message of [
      { role: 'assistant', content: 'look', images: [image] },
      { role: 'user', content: '   ' }
    ]) {
      const res = await request(createApp())
        .post('/chat/gpt')
        .send({ model: 'gpt55', messages: [message] })
      expect(res.status).toBe(400)
    }
  })

  it('forwards all image attachments to OpenAI with a cancellable request', async () => {
    const fetch = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        completion([{ choices: [{ delta: { content: 'Two images' }, finish_reason: null }] }])
      )
    const res = await request(createApp())
      .post('/chat/gpt')
      .send({ model: 'gpt55', messages: [{ role: 'user', content: 'Compare', images: [image, image] }] })
    expect(res.text).toContain('Two images')
    const options = fetch.mock.calls[0][1]!
    expect(options.signal).toBeInstanceOf(AbortSignal)
    expect(
      JSON.parse(options.body as string).messages[0].content.filter((part: any) => part.type === 'image_url')
    ).toHaveLength(2)
  })

  it('does not silently discard images on text-only models', async () => {
    const fetch = vi.spyOn(global, 'fetch')
    const res = await request(createApp())
      .post('/chat/glm')
      .send({ model: 'glm52', messages: [{ role: 'user', content: 'Look', images: [image] }] })
    expect(res.text).toContain('vision')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('reports missing keys without calling the provider', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')
    const fetch = vi.spyOn(global, 'fetch')
    const res = await request(createApp())
      .post('/chat/gpt')
      .send({ model: 'gpt55', messages: [{ role: 'user', content: 'Hi' }] })
    expect(res.text).toContain('API key')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('reports provider stream errors and truncated connections', async () => {
    const fetch = vi.spyOn(global, 'fetch')
    fetch.mockResolvedValueOnce(completion([{ error: { message: 'sensitive provider detail' } }]))
    const error = await request(createApp())
      .post('/chat/gpt')
      .send({ model: 'gpt55', messages: [{ role: 'user', content: 'Hi' }] })
    expect(error.text).toContain('error')
    expect(error.text).not.toContain('sensitive provider detail')
    fetch.mockResolvedValueOnce(new Response('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n'))
    const truncated = await request(createApp())
      .post('/chat/gpt')
      .send({ model: 'gpt55', messages: [{ role: 'user', content: 'Hi' }] })
    expect(truncated.text).toContain('partial')
    expect(truncated.text).toContain('before the response was complete')
  })
})

describe('image studio', () => {
  it('validates prompts and ratios', async () => {
    const app = createApp()
    for (const body of [
      { model: 'nanoBanana2', prompt: '' },
      { model: 'nanoBanana2', prompt: 'A vase', aspectRatio: '99:1' }
    ]) {
      const res = await request(app).post('/images/generate').send(body)
      expect(res.status).toBe(400)
    }
  })

  it('creates Gemini images at the selected aspect ratio', async () => {
    const fetch = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: image }] } }] }))
      )
    const res = await request(createApp())
      .post('/images/generate')
      .send({ model: 'nanoBanana2', prompt: 'A vase', aspectRatio: '16:9' })
    expect(res.status).toBe(200)
    expect(res.body.image).toBe(`data:image/png;base64,${png}`)
    expect(
      JSON.parse(fetch.mock.calls[0][1]!.body as string).generationConfig.responseFormat.image.aspectRatio
    ).toBe('16:9')
  })

  it('supports multipart reference images without requiring a manual boundary', async () => {
    const fetch = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: image }] } }] }))
      )
    const res = await request(createApp())
      .post('/images/generate')
      .field('model', 'nanoBanana2')
      .field('prompt', 'Make it blue')
      .attach('files', Buffer.from(png, 'base64'), { filename: 'reference.png', contentType: 'image/png' })
    expect(res.status).toBe(200)
    expect(JSON.parse(fetch.mock.calls[0][1]!.body as string).contents[0].parts[1].inlineData.data).toBe(png)
  })

  it('supports OpenAI generation and image editing', async () => {
    const fetch = vi
      .spyOn(global, 'fetch')
      .mockImplementation(async () => new Response(JSON.stringify({ data: [{ b64_json: png }] })))
    const app = createApp()
    const generated = await request(app)
      .post('/images/generate')
      .send({ model: 'gptImage2', prompt: 'A vase', aspectRatio: '3:2' })
    expect(generated.status).toBe(200)
    expect(JSON.parse(fetch.mock.calls[0][1]!.body as string).size).toBe('1536x1024')
    const edited = await request(app)
      .post('/images/generate')
      .field('model', 'gptImage2')
      .field('prompt', 'Make it blue')
      .attach('files', Buffer.from(png, 'base64'), { filename: 'reference.png', contentType: 'image/png' })
    expect(edited.status).toBe(200)
    expect(fetch.mock.calls[1][0]).toBe('https://api.openai.com/v1/images/edits')
    expect(fetch.mock.calls[1][1]!.body).toBeInstanceOf(FormData)
  })

  it('rejects disguised uploads and returns JSON errors', async () => {
    const res = await request(createApp())
      .post('/images/generate')
      .field('model', 'nanoBanana2')
      .field('prompt', 'Hi')
      .attach('files', Buffer.from('<svg>bad</svg>'), { filename: 'bad.png', contentType: 'image/png' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeTruthy()
  })

  it('does not expose raw provider output when no image is returned', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: 'private model response' }] } }] })
      )
    )
    const res = await request(createApp())
      .post('/images/generate')
      .send({ model: 'nanoBanana2', prompt: 'Hi' })
    expect(res.status).toBe(502)
    expect(res.body.error).toBeTruthy()
    expect(res.text).not.toContain('private model response')
  })
})

describe('SSE framing', () => {
  it('waits for complete events and joins multiline data', () => {
    const values: string[] = []
    const parse = createSSEParser((value) => values.push(value))
    parse(': heartbeat\r\ndata: first\r\n')
    expect(values).toEqual([])
    parse('data: second\r\n\r\n')
    expect(values).toEqual(['first\nsecond'])
  })
})
