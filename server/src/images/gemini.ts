import { Request, Response } from "express"

type GeminiImageModel = "nanoBanana" | "nanoBananaPro"

const geminiModels: Record<GeminiImageModel, string> = {
  nanoBanana: "gemini-2.5-flash-image",
  nanoBananaPro: "gemini-3-pro-image-preview"
}

const geminiApiBase = "https://generativelanguage.googleapis.com/v1beta/models"

function getInlineData(part: any) {
  return part?.inlineData || part?.inline_data
}

export async function geminiImage(req: Request, res: Response) {
  try {
    const { prompt, model } = req.body
    const selectedModel = geminiModels[model as GeminiImageModel]

    if (!selectedModel) {
      return res.json({
        error: "unsupported model"
      })
    }

    if (!prompt && !req.file) {
      return res.json({
        error: "no prompt"
      })
    }

    const parts: any[] = []
    if (prompt) {
      parts.push({ text: prompt })
    }

    if (req.file) {
      parts.push({
        inline_data: {
          mime_type: req.file.mimetype,
          data: req.file.buffer.toString("base64")
        }
      })
    }

    const response = await fetch(`${geminiApiBase}/${selectedModel}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY || ""
      },
      body: JSON.stringify({
        contents: [{
          parts
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      })
    })

    const data = await response.json()
    const responseParts = data?.candidates?.[0]?.content?.parts || []
    const imagePart = responseParts.find((part: any) => {
      const inlineData = getInlineData(part)
      return inlineData?.data
    })
    const inlineData = getInlineData(imagePart)

    if (!inlineData?.data) {
      return res.json({
        error: "error generating image",
        details: data
      })
    }

    const mimeType = inlineData.mimeType || inlineData.mime_type || "image/png"

    return res.json({
      image: `data:${mimeType};base64,${inlineData.data}`
    })
  } catch (err) {
    console.log("error generating Gemini image: ", err)
    return res.json({
      error: "error generating image"
    })
  }
}
