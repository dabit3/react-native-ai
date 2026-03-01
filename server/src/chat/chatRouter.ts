import express from 'express'
import { claude } from './claude'
import { gpt } from './gpt'
import { gemini } from './gemini'
import { kimi } from './kimi'
import { deepseek } from './deepseek'

const router = express.Router()

router.post('/claude', claude)
router.post('/gpt', gpt)
router.post('/gemini', gemini)
router.post('/kimi', kimi)
router.post('/deepseek', deepseek)

export default router
