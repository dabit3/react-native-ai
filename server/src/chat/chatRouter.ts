import express from 'express'
import { claude } from './claude'
import { gpt } from './gpt'
import { gemini } from './gemini'

const router = express.Router()

router.post('/claude', claude)
router.post('/gpt', gpt)
router.post('/gemini', gemini)

export default router