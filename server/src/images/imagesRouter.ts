import express from 'express'
import { falAI } from './fal'

const router = express.Router()

router.post('/fal', falAI)

export default router
