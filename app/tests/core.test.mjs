import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createEventParser } from '../src/stream.ts'
import { imageMimeType, resizeDimensions } from '../src/imageData.ts'
import {
  conversationTitle,
  getContextMessages,
  isConversation,
  migrateLegacyChats,
  transcript
} from '../src/conversations.ts'

const message = (role, content, id = content) => ({ id, role, content })

test('image sizing bounds large photos without upscaling small images', () => {
  assert.deepEqual(resizeDimensions(6000, 4000), { width: 2048, height: 1365 })
  assert.deepEqual(resizeDimensions(3000, 6000), { width: 1024, height: 2048 })
  assert.deepEqual(resizeDimensions(100, 50), { width: 100, height: 50 })
  assert.throws(() => resizeDimensions(0, 50), /invalid/)
})

test('image MIME detection follows the bytes rather than a file extension', () => {
  assert.equal(imageMimeType('iVBORw0KGgoAAAANS'), 'image/png')
  assert.equal(imageMimeType('/9j/4AAQSkZJRgAB'), 'image/jpeg')
  assert.equal(imageMimeType('UklGRiQAAABXRUJQ'), 'image/webp')
  assert.equal(imageMimeType('not-an-image'), undefined)
})

test('SSE parser bounds a multiline event across small chunks', () => {
  const parser = createEventParser(() => undefined)
  const part = `data: ${'a'.repeat(1000)}\n`
  assert.throws(() => {
    for (let i = 0; i < 3000; i++) parser.push(part)
  }, /oversized/)
})

test('SSE parser handles arbitrary UTF-8 chunks, CRLF, comments, and multiline data', () => {
  const values = []
  const parser = createEventParser((value) => values.push(value))
  const bytes = new TextEncoder().encode(': heartbeat\r\ndata: café\r\ndata: 第二行\r\n\r\ndata: [DONE]\n\n')
  const decoder = new TextDecoder()
  for (const byte of bytes) parser.push(decoder.decode(Uint8Array.of(byte), { stream: true }))
  parser.push(decoder.decode())
  parser.end()
  assert.deepEqual(values, ['café\n第二行', '[DONE]'])
})

test('SSE parser flushes an unterminated final event and rejects oversized buffers', () => {
  const values = []
  const parser = createEventParser((value) => values.push(value))
  parser.push('data: final')
  assert.deepEqual(values, [])
  parser.end()
  assert.deepEqual(values, ['final'])
  assert.throws(() => parser.push('a'.repeat(2_000_001)), /oversized/)
})

test('legacy conversations migrate without deleting original image references', () => {
  const original = {
    oldModel: [
      { role: 'user', content: '  A   question ', image: { uri: 'file://photo.png', mimeType: 'image/png' } },
      { role: 'assistant', content: 'Answer' }
    ]
  }
  const migrated = migrateLegacyChats(original)
  assert.equal(migrated.length, 1)
  assert.equal(migrated[0].title, 'A question')
  assert.equal(migrated[0].messages[0].images[0].uri, 'file://photo.png')
  assert.equal(original.oldModel[0].image.uri, 'file://photo.png')
  assert.equal(isConversation(migrated[0]), true)
})

test('legacy migration ignores malformed entries', () => {
  assert.deepEqual(migrateLegacyChats(null), [])
  assert.deepEqual(migrateLegacyChats([]), [])
  assert.deepEqual(migrateLegacyChats({ invalid: [null, { role: 'invalid', content: 'no' }] }), [])
})

test('conversation validation rejects malformed storage', () => {
  for (const value of [
    null,
    {},
    { id: '1', messages: null },
    { id: '1', title: 'test', model: 'test', createdAt: 1, updatedAt: 1, messages: [null] }
  ]) {
    assert.equal(isConversation(value), false)
  }
})

test('context keeps recent turns, starts at a user, and does not mutate history', () => {
  const messages = Array.from({ length: 201 }, (_, i) =>
    message(i % 2 ? 'assistant' : 'user', `message ${i}`)
  )
  const context = getContextMessages(messages)
  assert.equal(context.trimmed, true)
  assert.ok(context.messages.length <= 80)
  assert.equal(context.messages[0].role, 'user')
  assert.equal(context.messages.at(-1).content, 'message 200')
  assert.equal(messages.length, 201)
})

test('context excludes errors and empty stopped responses but retains images', () => {
  const imageTurn = {
    ...message('user', ''),
    images: [{ id: 'image', uri: 'media:image', mimeType: 'image/png' }]
  }
  const context = getContextMessages([
    message('user', 'Hi'),
    { ...message('assistant', 'partial'), error: 'Failed' },
    imageTurn,
    { ...message('assistant', ''), stopped: true }
  ])
  assert.equal(context.messages.length, 2)
  assert.equal(context.messages[1], imageTurn)
})

test('context bounds text length while preserving the latest question', () => {
  const context = getContextMessages([
    message('user', 'a'.repeat(60000)),
    message('assistant', 'b'.repeat(60000)),
    message('user', 'Last question')
  ])
  assert.equal(context.trimmed, true)
  assert.deepEqual(
    context.messages.map((m) => m.content),
    ['Last question']
  )
})

test('titles and exports handle image-only questions and errors', () => {
  assert.equal(conversationTitle([message('user', '')]), 'An image conversation')
  assert.equal(conversationTitle([message('user', 'a'.repeat(100))]).length, 72)
  assert.match(
    transcript({
      title: 'Title',
      messages: [{ ...message('assistant', 'partial'), model: 'Test model', error: 'Connection lost' }]
    }),
    /Test model\n\npartial\n\nError: Connection lost/
  )
})
