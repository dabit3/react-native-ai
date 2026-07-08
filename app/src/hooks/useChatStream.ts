import { useRef, useState, useCallback, useEffect } from 'react'
import { getEventSource, getChatRoute } from '../utils'
import { ChatMessage, Model } from '../../types'

const FLUSH_INTERVAL_MS = 50

export interface StreamCallbacks {
  onToken: (fullResponse: string) => void
  onDone: (fullResponse: string) => void
  onError: (message: string) => void
}

interface WireMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  image?: { mimeType: string, data: string }
}

function toWireMessages(messages: ChatMessage[], systemPrompt: string): WireMessage[] {
  const wire: WireMessage[] = []
  if (systemPrompt.trim()) {
    wire.push({ role: 'system', content: systemPrompt.trim() })
  }
  for (const message of messages) {
    wire.push({
      role: message.role,
      content: message.content,
      ...(message.image?.base64
        ? { image: { mimeType: message.image.mimeType, data: message.image.base64 } }
        : {})
    })
  }
  return wire
}

/**
 * Streams a chat completion for any provider through the server proxy.
 * Batches token updates to avoid re-rendering on every SSE event and
 * supports cancelling an in-flight response.
 */
export function useChatStream() {
  const [streaming, setStreaming] = useState(false)
  const esRef = useRef<ReturnType<typeof getEventSource> | null>(null)
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stop = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
    }
    esRef.current?.close()
    esRef.current = null
    setStreaming(false)
  }, [])

  useEffect(() => stop, [stop])

  const send = useCallback((
    model: Model,
    messages: ChatMessage[],
    systemPrompt: string,
    callbacks: StreamCallbacks
  ) => {
    stop()
    setStreaming(true)

    let response = ''
    let pendingFlush = false
    let finished = false

    const flush = () => {
      flushTimerRef.current = null
      pendingFlush = false
      callbacks.onToken(response)
    }

    const scheduleFlush = () => {
      if (pendingFlush) return
      pendingFlush = true
      flushTimerRef.current = setTimeout(flush, FLUSH_INTERVAL_MS)
    }

    const finish = (handler: () => void) => {
      if (finished) return
      finished = true
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current)
        flushTimerRef.current = null
      }
      esRef.current?.close()
      esRef.current = null
      setStreaming(false)
      handler()
    }

    const es = getEventSource({
      body: {
        model: model.label,
        messages: toWireMessages(messages, systemPrompt)
      },
      type: getChatRoute(model)
    })
    esRef.current = es

    es.addEventListener('message', (event: any) => {
      if (event.data === '[DONE]') {
        finish(() => callbacks.onDone(response))
        return
      }
      try {
        const data = JSON.parse(event.data)
        if (data?.error) {
          finish(() => callbacks.onError(data.error))
          return
        }
        if (typeof data?.content === 'string') {
          response += data.content
          scheduleFlush()
        }
      } catch {}
    })

    es.addEventListener('error', (event: any) => {
      finish(() => callbacks.onError(
        event?.message || 'Unable to reach the server. Check your connection and try again.'
      ))
    })
  }, [stop])

  return { streaming, send, stop }
}
