import { getImageModel } from '../models'

const geminiApiBase = 'https://generativelanguage.googleapis.com/v1beta/models'

interface GeminiImageInput {
  model: string
  prompt?: string
  file?: {
    mimeType: string
    data: string
  }
}

function getInlineData(part: any) {
  return part?.inlineData || part?.inline_data
}

export async function geminiImage({ model, prompt, file }: GeminiImageInput): Promise<Response> {
  try {
    const imageModel = getImageModel(model)

    if (!imageModel) {
      return Response.json({ error: `unsupported model: ${model}` }, { status: 400 })
    }

    if (!prompt && !file) {
      return Response.json({ error: 'a prompt or image is required' }, { status: 400 })
    }

    const parts: any[] = []
    if (prompt) {
      parts.push({ text: prompt })
    }

    if (file) {
      parts.push({
        inline_data: {
          mime_type: file.mimeType,
          data: file.data
        }
      })
    }

    const response = await fetch(`${geminiApiBase}/${imageModel.modelId}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY || ''
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      })
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error('gemini image error:', response.status, detail)
      return Response.json({ error: `provider error (${response.status})` }, { status: 502 })
    }

    const data = await response.json()
    const responseParts = data?.candidates?.[0]?.content?.parts || []
    const imagePart = responseParts.find((part: any) => getInlineData(part)?.data)
    const inlineData = getInlineData(imagePart)

    if (!inlineData?.data) {
      return Response.json(
        {
          error: 'the model did not return an image',
          details: data
        },
        { status: 502 }
      )
    }

    const mimeType = inlineData.mimeType || inlineData.mime_type || 'image/png'

    return Response.json({
      image: `data:${mimeType};base64,${inlineData.data}`
    })
  } catch (err) {
    console.error('error generating Gemini image:', err)
    return Response.json({ error: 'error generating image' }, { status: 500 })
  }
}
