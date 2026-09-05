import { Buffer } from 'node:buffer'
import { expect, Page, test } from '@playwright/test'
import { CHAT_MODELS, IMAGE_MODELS } from '../../server/src/models'

const registry = {
  chatModels: Object.values(CHAT_MODELS).map(({ modelId: _id, ...model }) => ({ ...model, available: true })),
  imageModels: Object.values(IMAGE_MODELS).map(({ modelId: _id, ...model }) => ({
    ...model,
    available: true
  }))
}
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6lZkAAAAASUVORK5CYII='

async function start(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('rnai-settings-v2'))
      localStorage.setItem(
        'rnai-settings-v2',
        JSON.stringify({
          apiUrl: 'http://localhost:3050',
          theme: 'light',
          chatLabel: 'claudeSonnet5',
          imageModel: 'nanoBanana2',
          systemPrompt: ''
        })
      )
  })
  await page.route('http://localhost:3050/**', (route) => {
    if (route.request().url().endsWith('/models')) return route.fulfill({ json: registry })
    return route.fulfill({ status: 500, json: { error: 'Unexpected test request' } })
  })
  await page.goto('/')
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toBeVisible()
}

async function respond(page: Page, text = 'A clear answer, with a little room to think.') {
  await page.route('**/chat/*', (route) =>
    route.fulfill({
      contentType: 'text/event-stream',
      body: `data: ${JSON.stringify({ content: text })}\n\ndata: [DONE]\n\n`
    })
  )
}

test('desktop workspace, model discovery, and clean browser runtime', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await start(page)
  await expect(page.getByText('A little curiosity.', { exact: false })).toBeVisible()
  await page.screenshot({ path: info.outputPath('home-desktop.png') })
  await page.getByRole('button', { name: /Change model/ }).click()
  await page.getByRole('textbox', { name: 'Search models' }).fill('gpt')
  await expect(page.getByRole('button', { name: 'Select GPT-5.4 mini', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Select GPT-5.4 mini', exact: true }).click()
  await expect(page.getByRole('button', { name: /Change model.*GPT-5.4 mini/ })).toBeVisible()
  expect(errors).toEqual([])
})

test('chat persists across reloads and keeps context when changing models', async ({ page }) => {
  await start(page)
  let requests: any[] = []
  await page.route('**/chat/*', (route) => {
    requests.push(route.request().postDataJSON())
    return route.fulfill({
      contentType: 'text/event-stream',
      body: 'data: {"content":"Saved answer"}\n\ndata: [DONE]\n\n'
    })
  })
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Help me make a plan')
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  await expect(page.getByText('Saved answer', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Regenerate', exact: true })).toBeVisible()
  await page.getByRole('button', { name: /Change model/ }).click()
  await page.getByRole('button', { name: 'Select GPT-5.4 mini', exact: true }).click()
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Make it shorter')
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  await expect.poll(() => requests.length).toBe(2)
  expect(requests[1].model).toBe('gpt54Mini')
  expect(requests[1].messages.map((m: any) => m.content)).toEqual([
    'Help me make a plan',
    'Saved answer',
    'Make it shorter'
  ])
  await expect(page.getByRole('button', { name: 'Regenerate', exact: true })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Open Help me make a plan', exact: true }).click()
  await expect(page.getByText('Make it shorter', { exact: true })).toBeVisible()
  await expect(page.getByText('Saved answer', { exact: true })).toHaveCount(2)
})

test('errors retain the prompt and can be retried', async ({ page }) => {
  await start(page)
  await page.route('**/chat/*', (route) => route.fulfill({ status: 429, json: { error: 'Rate limit' } }))
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Keep my question')
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  await expect(page.getByText('Keep my question', { exact: true }).last()).toBeVisible()
  await expect(page.getByText('The request limit was reached.', { exact: false })).toBeVisible()
  await respond(page, 'Recovered answer')
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.getByText('Recovered answer', { exact: true })).toBeVisible()
})

test('stop cancels an in-flight request and permits another message', async ({ page }) => {
  await start(page)
  await page.route('**/chat/*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    await route
      .fulfill({
        contentType: 'text/event-stream',
        body: 'data: {"content":"Late response"}\n\ndata: [DONE]\n\n'
      })
      .catch(() => undefined)
  })
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Take your time')
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  await page.getByRole('button', { name: 'Stop response', exact: true }).click()
  await expect(page.getByText('Stopped', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeVisible()
  await expect(page.getByText('Late response', { exact: true })).toHaveCount(0)
  await respond(page, 'Fresh answer')
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Try a quick answer')
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  await expect(page.getByText('Fresh answer', { exact: true })).toBeVisible()
})

test('vision uploads are stored and sent after reopening a conversation', async ({ page }) => {
  await start(page)
  await respond(page, 'An image answer')
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Attach images', exact: true }).click()
  await (
    await chooser
  ).setFiles({ name: 'reference.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') })
  await expect(page.getByRole('button', { name: 'Preview attached image' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Describe this photo')
  const firstRequest = page.waitForRequest('**/chat/*')
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  expect((await firstRequest).postDataJSON().messages[0].images[0].data).toBeTruthy()
  await expect(page.getByText('An image answer', { exact: true })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Open Describe this photo', exact: true }).click()
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('What color is it?')
  const secondRequest = page.waitForRequest('**/chat/*')
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  expect((await secondRequest).postDataJSON().messages[0].images[0].data).toBeTruthy()
})

test('image studio creates, persists, and edits images', async ({ page }, info) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await start(page)
  await page.getByRole('tab', { name: 'Image studio', exact: true }).click()
  await page.screenshot({ path: info.outputPath('studio-desktop.png') })
  await page.route('**/images/generate', (route) =>
    route.fulfill({ json: { image: `data:image/png;base64,${png}` } })
  )
  await page.getByRole('textbox', { name: 'Image prompt', exact: true }).fill('A quiet green landscape')
  await page.getByRole('button', { name: 'Aspect ratio 16:9', exact: true }).click()
  const generation = page.waitForRequest('**/images/generate')
  await page.getByRole('button', { name: 'Create image', exact: true }).click()
  expect((await generation).postDataJSON().aspectRatio).toBe('16:9')
  await expect(page.getByText('Made from your imagination.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Edit image', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Remove reference image', exact: true })).toBeVisible()
  await page.getByRole('textbox', { name: 'Image prompt', exact: true }).fill('Make it blue')
  const edit = page.waitForRequest('**/images/generate')
  await page.getByRole('button', { name: 'Create edit', exact: true }).click()
  expect((await edit).headers()['content-type']).toContain('multipart/form-data; boundary=')
  await expect(page.getByText('Made from your imagination.', { exact: true })).toBeVisible()
  await page.reload()
  await page.getByRole('tab', { name: 'Image studio', exact: true }).click()
  await expect(page.getByText('2 images · Saved on this device', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'View image: Make it blue', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('keyboard shortcuts preserve newlines and submit only once', async ({ page }) => {
  await start(page)
  let calls = 0
  await page.route('**/chat/*', (route) => {
    calls++
    return route.fulfill({
      contentType: 'text/event-stream',
      body: 'data: {"content":"Keyboard answer"}\n\ndata: [DONE]\n\n'
    })
  })
  const input = page.getByRole('textbox', { name: 'Message', exact: true })
  await input.fill('First line')
  await input.press('Shift+Enter')
  await input.pressSequentially('Second line')
  await expect(input).toHaveValue('First line\nSecond line')
  await input.press('Enter')
  await expect(page.getByText('Keyboard answer', { exact: true })).toBeVisible()
  await expect(input).toBeFocused()
  expect(calls).toBe(1)
})

test('corrupted history stays intact rather than being silently replaced', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rnai-conversations-v2', '{broken'))
  await start(page)
  await respond(page, 'Temporary answer')
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('A new question')
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  await expect(page.getByText('Temporary answer', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('rnai-conversations-v2'))).toBe('{broken')
})

test('session tokens are not saved in device settings', async ({ page }) => {
  await start(page)
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Server session token', exact: true })
    .fill('test-session-token-not-a-provider-key')
  await page.getByRole('button', { name: 'Save connection', exact: true }).click()
  await expect(page.getByText('Connection settings saved.', { exact: false })).toBeVisible()
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    'test-session-token-not-a-provider-key'
  )
})

test('large photos are resized before storage and upload', async ({ page }) => {
  await start(page)
  await respond(page, 'Optimized image received')
  const large = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 4096
    canvas.height = 2048
    const context = canvas.getContext('2d')!
    context.fillStyle = '#465D3F'
    context.fillRect(0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Attach images', exact: true }).click()
  await (
    await chooser
  ).setFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.from(large, 'base64') })
  await expect(page.getByRole('button', { name: 'Preview attached image', exact: true })).toBeVisible()
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Describe the optimized photo')
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  await expect(page.getByText('Optimized image received', { exact: true })).toBeVisible()
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('rnai-conversations-v2')!))
  expect(saved[0].messages[0].images[0]).toMatchObject({ width: 2048, height: 1024, mimeType: 'image/png' })
})

test('stopping a partial stream preserves the received text', async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.fetch.bind(window)
    window.fetch = async (input, init) => {
      if (!String(input).includes('/chat/')) return original(input, init)
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('data: {"content":"A partial answer"}\n\n'))
            init?.signal?.addEventListener(
              'abort',
              () => {
                localStorage.setItem('test-stream-aborted', 'yes')
                controller.error(new DOMException('Aborted', 'AbortError'))
              },
              { once: true }
            )
          }
        }),
        { headers: { 'Content-Type': 'text/event-stream' } }
      )
    }
  })
  await start(page)
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Start a longer answer')
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  await expect(page.getByText('A partial answer', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Stop response', exact: true }).click()
  await expect(page.getByText('Stopped', { exact: true })).toBeVisible()
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('rnai-conversations-v2')!))
  expect(saved[0].messages.at(-1)).toMatchObject({ content: 'A partial answer', stopped: true })
  expect(await page.evaluate(() => localStorage.getItem('test-stream-aborted'))).toBe('yes')
})

test('mobile navigation, model sheet, appearance, and no horizontal overflow', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await start(page)
  await expect(page.getByRole('tab', { name: 'Chat', exact: true })).toBeVisible()
  await page.screenshot({ path: info.outputPath('home-mobile.png') })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('button', { name: /Change model/ }).click()
  await page.getByRole('button', { name: 'Fast', exact: true }).click()
  await page.getByRole('button', { name: 'Select Claude Haiku 4.5', exact: true }).click()
  await page.getByRole('tab', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Use Dark appearance', exact: true }).click()
  await page.screenshot({ path: info.outputPath('settings-mobile-dark.png') })
  await page.getByRole('tab', { name: 'Image studio', exact: true }).click()
  await page.screenshot({ path: info.outputPath('studio-mobile-dark.png') })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
