import { Request, Response } from 'express'
import { getImageModel } from '../models'

const geminiApiBase = 'https://generativelanguage.googleapis.com/v1beta/models'

function getInlineData(part: any) {
  return part?.inlineData || part?.inline_data
}

export async function geminiImage(req: Request, res: Response) {
  try {
    const { prompt, model } = req.body
    const imageModel = getImageModel(model)

    if (!imageModel) {
      return res.status(400).json({ error: `unsupported model: ${model}` })
    }

    if (!prompt && !req.file) {
      return res.status(400).json({ error: 'a prompt or image is required' })
    }

    const parts: any[] = []
    if (prompt) {
      parts.push({ text: prompt })
    }

    if (req.file) {
      parts.push({
        inline_data: {
          mime_type: req.file.mimetype,
          data: req.file.buffer.toString('base64')
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
      return res.status(502).json({ error: `provider error (${response.status})` })
    }

    const data = await response.json()
    const responseParts = data?.candidates?.[0]?.content?.parts || []
    const imagePart = responseParts.find((part: any) => getInlineData(part)?.data)
    const inlineData = getInlineData(imagePart)

    if (!inlineData?.data) {
      return res.status(502).json({
        error: 'the model did not return an image',
        details: data
      })
    }

    const mimeType = inlineData.mimeType || inlineData.mime_type || 'image/png'

    return res.json({
      image: `data:${mimeType};base64,${inlineData.data}`
    })
  } catch (err) {
    console.error('error generating Gemini image:', err)
    return res.status(500).json({ error: 'error generating image' })
  }
}
