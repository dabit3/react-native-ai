import express from 'express'
import multer from 'multer'
import { claude } from './claude'
import { gpt } from './gpt'
import { gemini } from './gemini'
import { transcribe } from './transcribe'

const router = express.Router()
const upload = multer({ dest: 'uploads/' })

router.post('/claude', claude)
router.post('/gpt', gpt)
router.post('/gemini', gemini)
router.post('/transcribe', upload.single('audio'), transcribe)

export default router
