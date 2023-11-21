import express from 'express'
import { uploadFile } from './upload-file'

const router = express.Router()

router.post('/upload-file', uploadFile)

export default router
