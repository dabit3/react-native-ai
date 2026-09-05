import express from 'express'
import multer from 'multer'
import { geminiImage } from './gemini'
import { validateBody } from '../middleware'
import { IMAGE_MIME_TYPES, imageRequestSchema, MAX_IMAGE_BYTES } from '../types'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 4, fields: 8, fieldSize: 16000, parts: 12 },
  fileFilter: (_req, file, callback) => {
    if ((IMAGE_MIME_TYPES as readonly string[]).includes(file.mimetype)) callback(null, true)
    else callback(Object.assign(new Error('Use JPEG, PNG, or WebP images.'), { status: 400 }))
  }
})
const router = express.Router()
const attachments = upload.fields([
  { name: 'files', maxCount: 4 },
  { name: 'file', maxCount: 1 }
])

router.post(['/generate', '/gemini'], attachments, validateBody(imageRequestSchema), geminiImage)

export default router
