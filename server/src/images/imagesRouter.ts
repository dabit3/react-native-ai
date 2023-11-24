import express from 'express'
import multer from 'multer'
import { falAI } from './fal'

const upload = multer()
const router = express.Router()

router.post('/fal', upload.single('file'), falAI)

export default router
