import { Request, Response } from 'express'
import { getImageModel, ImageModel, providerAvailable } from '../models'
import { ImageAttachment, ImageRequest, validImageBytes } from '../types'
import { providerError, requestLifetime } from '../provider'
import { generateOpenAIImage } from './openai'

export async function generateGeminiImage(
  model: ImageModel,
  request: ImageRequest,
  images: ImageAttachment[],
  signal: AbortSignal
) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model.modelId}:generateContent`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY || '' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: request.prompt },
            ...images.map((image) => ({ inlineData: { mimeType: image.mimeType, data: image.data } }))
          ]
        }
      ],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        responseFormat: { image: { aspectRatio: request.aspectRatio } }
      }
    })
  })
}

export async function geminiImage(req: Request, res: Response) {
  const request: ImageRequest = req.body
  const model = getImageModel(request.model)
  if (!model) {
    res.status(400).json({ error: 'Unsupported image model. Refresh the model list and choose again.' })
    return
  }
  if (!providerAvailable(model.provider)) {
    res.status(503).json({ error: 'This image provider needs an API key on the server.' })
    return
  }
  if (!model.aspectRatios.includes(request.aspectRatio)) {
    res.status(400).json({ error: 'This model does not support the selected aspect ratio.' })
    return
  }
  const files = Object.values((req.files || {}) as Record<string, Express.Multer.File[]>).flat()
  const images: ImageAttachment[] = [...(request.images || [])]
  if (files.length + images.length > 4) {
    res.status(400).json({ error: 'Use up to four reference images.' })
    return
  }
  for (const file of files) {
    if (!validImageBytes(file.buffer, file.mimetype)) {
      res.status(400).json({ error: 'The uploaded file is not a supported JPEG, PNG, or WebP image.' })
      return
    }
    images.push({
      mimeType: file.mimetype as ImageAttachment['mimeType'],
      data: file.buffer.toString('base64')
    })
  }
  if (images.length && !model.supportsEditing) {
    res.status(400).json({ error: 'This model does not support reference images.' })
    return
  }
  const lifetime = requestLifetime(res)
  try {
    const response =
      model.provider === 'openai'
        ? await generateOpenAIImage(model, request, images, lifetime.signal)
        : await generateGeminiImage(model, request, images, lifetime.signal)
    if (!response.ok) {
      await response.body?.cancel()
      if (!res.destroyed) res.status(502).json({ error: providerError(response.status) })
      return
    }
    const data = await response.json()
    const parts = data.candidates?.[0]?.content?.parts || []
    const inline = parts.find(
      (part: any) => !part.thought && (part.inlineData?.data || part.inline_data?.data)
    )
    const source = inline?.inlineData || inline?.inline_data
    const base64 = model.provider === 'openai' ? data.data?.[0]?.b64_json : source?.data
    const mimeType =
      model.provider === 'openai' ? 'image/png' : source?.mimeType || source?.mime_type || 'image/png'
    if (
      typeof base64 !== 'string' ||
      !base64.length ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)
    ) {
      if (!res.destroyed)
        res.status(502).json({ error: 'The model did not return an image. Try a different prompt.' })
      return
    }
    if (!res.destroyed)
      res.json({
        image: `data:${mimeType};base64,${base64}`,
        model: model.label,
        aspectRatio: request.aspectRatio
      })
  } catch {
    if (!res.destroyed)
      res
        .status(lifetime.timedOut() ? 504 : 502)
        .json({
          error: lifetime.timedOut()
            ? 'The image request timed out. Try again.'
            : 'The image provider could not be reached. Try again.'
        })
  } finally {
    lifetime.dispose()
  }
}
