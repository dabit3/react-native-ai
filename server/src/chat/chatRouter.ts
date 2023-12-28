import express from 'express'
import multer from 'multer'
import { cohere } from './cohere'
import { claude } from './claude'
import { gpt } from './gpt'
import { mistral } from './mistral'
import { gemini } from './gemini'

const upload = multer()

// assistant API
import { createAssistant } from './createAssistant'
import { addMessageToThread } from './addMessageToThread'
import { runStatus } from './runStatus'
import { runResponse } from './runResponse'
import { getThreadMessages } from './getThreadMessages'

const router = express.Router()

router.post('/claude', claude)
router.post('/cohere', cohere)
router.post('/gpt', gpt)
router.post('/mistral', mistral)
router.post('/gemini', gemini)

// assistant
router.post('/create-assistant', upload.single('file'), createAssistant)
router.post('/add-message-to-thread', upload.single('file'), addMessageToThread)
router.post('/run-status', runStatus)
router.post('/run-response', runResponse)
router.post('/get-thread-messages', getThreadMessages)

export default router