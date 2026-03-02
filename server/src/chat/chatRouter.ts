import express from 'express'
import { claude } from './claude'
import { gemini } from './gemini'
import { gpt } from './gpt'
import { kimi } from './kimi'

const router = express.Router()

router.post('/claude', claude)
router.post('/gpt', gpt)
router.post('/gemini', gemini)
router.post('/kimi', kimi)

export default router
