import { AspectRatio, ImageModel } from '../models'
import { ImageAttachment, ImageRequest } from '../types'

const sizes: Record<AspectRatio, string> = {
  '1:1': '1024x1024',
  '3:2': '1536x1024',
  '2:3': '1024x1536',
  '16:9': '1536x864',
  '9:16': '864x1536'
}

export async function generateOpenAIImage(
  model: ImageModel,
  request: ImageRequest,
  images: ImageAttachment[],
  signal: AbortSignal
) {
  const settings = {
    model: model.modelId,
    prompt: request.prompt,
    size: sizes[request.aspectRatio],
    quality: 'medium',
    output_format: 'png'
  }
  const headers: Record<string, string> = { Authorization: `Bearer ${process.env.OPENAI_API_KEY || ''}` }
  let body: string | FormData
  if (images.length) {
    const form = new FormData()
    for (const [key, value] of Object.entries(settings)) form.append(key, value)
    images.forEach((image, index) => {
      const bytes = new Uint8Array(Buffer.from(image.data, 'base64'))
      form.append(
        'image[]',
        new Blob([bytes], { type: image.mimeType }),
        `reference-${index}.${image.mimeType === 'image/jpeg' ? 'jpg' : image.mimeType === 'image/webp' ? 'webp' : 'png'}`
      )
    })
    body = form
  } else {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify({ ...settings, n: 1 })
  }
  return fetch(`https://api.openai.com/v1/images/${images.length ? 'edits' : 'generations'}`, {
    method: 'POST',
    signal,
    headers,
    body
  })
}
