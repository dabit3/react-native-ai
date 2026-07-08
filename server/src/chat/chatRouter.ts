import express from 'express'
import { claude } from './claude'
import { gpt } from './gpt'
import { gemini } from './gemini'
import { glm } from './glm'
import { kimi } from './kimi'
import { validateBody } from '../middleware'
import { chatRequestSchema } from '../types'

const router = express.Router()

router.use(validateBody(chatRequestSchema))

router.post('/claude', claude)
router.post('/gpt', gpt)
router.post('/gemini', gemini)
router.post('/glm', glm)
router.post('/kimi', kimi)

export default router
