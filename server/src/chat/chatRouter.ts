import express from 'express'
import { cohere } from './cohere'
import { claude } from './claude'
import { gpt } from './gpt'

const router = express.Router()

router.post('/claude', claude)
router.post('/cohere', cohere)
router.post('/gpt', gpt)

export default router
