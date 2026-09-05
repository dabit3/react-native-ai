import { Response } from 'express'
import { ChatModel, getChatModel, Provider, providerAvailable } from './models'
import { ChatRequest, messageImages } from './types'
import { createSSEParser, initSSE, pumpStream, sendDone, sendError, sendToken } from './sse'

export function providerError(status: number): string {
  if (status === 401 || status === 403)
    return `The provider rejected this request (${status}). Check the server API key and your account model access.`
  if (status === 429)
    return 'The provider rate limit or credit limit was reached. Wait a moment or check your provider billing.'
  if (status === 404) return 'This model is not available to your provider account. Choose another model.'
  if (status === 400)
    return 'The provider could not accept this request. Try a shorter prompt or a different model.'
  return `The provider is unavailable (${status}). Try again shortly.`
}

export function requestLifetime(res: Response, duration = 175000) {
  const controller = new AbortController()
  let timedOut = false
  const abort = () => controller.abort()
  const timeout = setTimeout(() => {
    timedOut = true
    abort()
  }, duration)
  res.once('close', abort)
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    dispose() {
      clearTimeout(timeout)
      res.off('close', abort)
      abort()
    }
  }
}

export interface ProviderEvent {
  content?: string
  error?: string
  done?: boolean
}

export async function streamProvider(
  res: Response,
  request: ChatRequest,
  provider: Provider,
  makeRequest: (model: ChatModel, signal: AbortSignal) => Promise<globalThis.Response>,
  parseEvent: (data: string) => ProviderEvent
) {
  initSSE(res)
  const model = getChatModel(request.model)
  if (!model || model.provider !== provider) {
    sendError(res, 'Unsupported model. Refresh the model list and choose again.')
    sendDone(res)
    return
  }
  if (!model.supportsVision && request.messages.some((m) => messageImages(m).length)) {
    sendError(res, 'This model does not support vision. Choose a model with image support.')
    sendDone(res)
    return
  }
  if (!providerAvailable(provider)) {
    sendError(res, 'This provider needs an API key on the server. Choose a configured model.')
    sendDone(res)
    return
  }
  const lifetime = requestLifetime(res)
  const heartbeat = setInterval(() => {
    if (!res.destroyed && !res.writableEnded) res.write(': heartbeat\n\n')
  }, 15000)
  let completed = false
  let failed = false
  try {
    const response = await makeRequest(model, lifetime.signal)
    if (!response.ok) {
      await response.body?.cancel()
      sendError(res, providerError(response.status))
      return
    }
    const parse = createSSEParser((data) => {
      if (failed || completed) return
      const event = parseEvent(data)
      if (event.error) {
        failed = true
        sendError(res, event.error)
      }
      if (event.content) sendToken(res, event.content)
      if (event.done) completed = true
    })
    await pumpStream(response.body, parse, res, () => completed || failed)
    parse.end()
    if (!completed && !failed && !res.destroyed)
      sendError(res, 'The provider connection ended before the response was complete. Try again.')
  } catch {
    if (!res.destroyed)
      sendError(
        res,
        lifetime.timedOut()
          ? 'The provider took too long to respond. Try a faster model.'
          : 'The provider connection failed. Try again.'
      )
  } finally {
    clearInterval(heartbeat)
    lifetime.dispose()
    sendDone(res)
  }
}
