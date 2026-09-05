import { useCallback, useEffect, useRef, useState } from 'react'
import { fetch as streamingFetch } from 'expo/fetch'
import { apiHeaders, errorMessage, getChatRoute, responseError } from '../utils'
import { ChatMessage, Model } from '../../types'
import { getImageBase64 } from '../mediaStore'
import { createEventParser } from '../stream'
import { getContextMessages } from '../conversations'

const FLUSH_INTERVAL_MS = 60

export interface StreamCallbacks {
  onToken: (fullResponse: string) => void
  onDone: (fullResponse: string, stopped?: boolean) => void
  onError: (message: string, partial: string) => void
}

type Session = {
  controller: AbortController
  response: string
  callbacks: StreamCallbacks
  timer?: ReturnType<typeof setTimeout>
  timeout?: ReturnType<typeof setTimeout>
  finished: boolean
}

async function toWireMessages(messages: ChatMessage[], systemPrompt: string) {
  const history = getContextMessages(messages).messages
  const imageCount = history.reduce((count, m) => count + (m.images?.length || 0), 0)
  if (imageCount > 4)
    throw new Error('This conversation has more than four images. Start a new conversation to attach more.')
  const wire = await Promise.all(
    history.map(async (message) => ({
      role: message.role,
      content: message.content,
      ...(message.images?.length
        ? {
            images: await Promise.all(
              message.images.map(async (image) => ({
                mimeType: image.mimeType,
                data: await getImageBase64(image)
              }))
            )
          }
        : {})
    }))
  )
  return systemPrompt.trim() ? [{ role: 'system', content: systemPrompt.trim() }, ...wire] : wire
}

/**
 * Streams a chat completion for any provider through the server proxy.
 * Batches token updates to avoid re-rendering on every SSE event and
 * supports cancelling an in-flight response.
 */
export function useChatStream() {
  const [streaming, setStreaming] = useState(false)
  const session = useRef<Session | null>(null)

  const finish = useCallback((current: Session, done: () => void) => {
    if (current.finished || session.current !== current) return
    current.finished = true
    clearTimeout(current.timer)
    clearTimeout(current.timeout)
    current.controller.abort()
    session.current = null
    setStreaming(false)
    done()
  }, [])

  const stop = useCallback(() => {
    const current = session.current
    if (current) finish(current, () => current.callbacks.onDone(current.response, true))
  }, [finish])

  useEffect(
    () => () => {
      const current = session.current
      if (!current) return
      current.finished = true
      clearTimeout(current.timer)
      clearTimeout(current.timeout)
      current.controller.abort()
      session.current = null
    },
    []
  )

  const send = useCallback(
    async (
      model: Model,
      messages: ChatMessage[],
      systemPrompt: string,
      connection: { url: string; token: string },
      callbacks: StreamCallbacks
    ) => {
      if (session.current) return
      const current: Session = { controller: new AbortController(), response: '', callbacks, finished: false }
      session.current = current
      setStreaming(true)
      current.timeout = setTimeout(
        () =>
          finish(current, () =>
            callbacks.onError('The response timed out. Try again or choose a faster model.', current.response)
          ),
        180000
      )
      try {
        if (!connection.url) throw new Error('Connect your server in Settings before you send a message.')
        if (model.available === false)
          throw new Error(
            'This provider needs an API key on the server. Choose a configured model or open Settings.'
          )
        if (!model.supportsVision && messages.some((m) => m.images?.length))
          throw new Error('This conversation contains images. Choose a model with vision support.')
        const wire = await toWireMessages(messages, systemPrompt)
        if (current.finished) return
        const response = await streamingFetch(`${connection.url}/chat/${getChatRoute(model)}`, {
          method: 'POST',
          headers: apiHeaders(connection.token),
          signal: current.controller.signal,
          body: JSON.stringify({ model: model.label, messages: wire })
        })
        if (!response.ok) throw new Error(await responseError(response))
        if (!response.body) throw new Error('The server did not return a response stream.')
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        const parser = createEventParser((data) => {
          if (current.finished) return
          if (data === '[DONE]') {
            finish(current, () =>
              current.response
                ? callbacks.onDone(current.response)
                : callbacks.onError('The model returned no text. Try a different prompt or model.', '')
            )
            return
          }
          const event = JSON.parse(data)
          if (typeof event.error === 'string') {
            finish(current, () => callbacks.onError(event.error, current.response))
          } else if (typeof event.content === 'string') {
            current.response += event.content
            if (!current.timer)
              current.timer = setTimeout(() => {
                current.timer = undefined
                if (!current.finished) callbacks.onToken(current.response)
              }, FLUSH_INTERVAL_MS)
          }
        })
        try {
          while (!current.finished) {
            const { value, done } = await reader.read()
            if (done) {
              parser.push(decoder.decode())
              parser.end()
              break
            }
            parser.push(decoder.decode(value, { stream: true }))
          }
        } finally {
          await reader.cancel().catch(() => undefined)
          reader.releaseLock()
        }
        if (!current.finished)
          throw new Error('The connection ended before the response was complete. You can retry below.')
      } catch (error) {
        const message =
          error instanceof TypeError
            ? 'The server could not be reached. Check your connection and server address in Settings.'
            : errorMessage(error)
        finish(current, () => callbacks.onError(message, current.response))
      }
    },
    [finish]
  )

  return { streaming, send, stop }
}
