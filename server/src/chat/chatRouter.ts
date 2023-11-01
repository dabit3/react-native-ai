import express from 'express'
import { cohere } from './cohere'
import { claude } from './claude'
import { openai } from './openai'

const router = express.Router()

router.post('/claude', claude)
router.get('/cohere', cohere)
router.get('/openai', openai)

export default router