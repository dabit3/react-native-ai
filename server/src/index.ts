import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import chatRouter from './chat/chatRouter'
import imagesRouter from './images/imagesRouter'
import { auth } from './middleware'
import { CHAT_MODELS, IMAGE_MODELS } from './models'
import 'dotenv/config'

export function createApp() {
  const app = express()

  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ extended: true }))

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
  })

  app.get('/models', (req, res) => {
    res.json({
      chatModels: Object.values(CHAT_MODELS).map(({ name, label, provider, supportsVision }) => ({
        name, label, provider, supportsVision
      })),
      imageModels: Object.values(IMAGE_MODELS).map(({ name, label, provider }) => ({
        name, label, provider
      }))
    })
  })

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_PER_MINUTE || 60),
    standardHeaders: true,
    legacyHeaders: false
  })

  app.use('/chat', auth, limiter, chatRouter)
  app.use('/images', auth, limiter, imagesRouter)

  return app
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3050)
  createApp().listen(port, () => {
    console.log(`Server started on port ${port}`)
  })
}
