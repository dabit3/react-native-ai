import { Request, Response } from "express"
import asyncHandler from 'express-async-handler'
import fs from 'fs'

export const transcribe = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No audio file provided' })
      return
    }

    const fileBuffer = fs.readFileSync(req.file.path)
    const blob = new Blob([fileBuffer], { type: req.file.mimetype || 'audio/m4a' })
    const formData = new FormData()
    formData.append('file', blob, req.file.originalname || 'audio.m4a')
    formData.append('model', 'whisper-1')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    })

    const data = await response.json() as { text?: string }

    try { fs.unlinkSync(req.file.path) } catch (e) {}

    if (data.text) {
      res.json({ text: data.text })
    } else {
      res.status(500).json({ error: 'No transcription returned' })
    }
  } catch (err) {
    console.log('error in transcription: ', err)
    if (req.file?.path) { try { fs.unlinkSync(req.file.path) } catch (e) {} }
    res.status(500).json({ error: 'Transcription failed' })
  }
})
