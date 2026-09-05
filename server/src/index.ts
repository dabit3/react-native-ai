import 'dotenv/config'
import express, { ErrorRequestHandler } from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import chatRouter from './chat/chatRouter'
import imagesRouter from './images/imagesRouter'
import { auth } from './middleware'
import { CHAT_MODELS, IMAGE_MODELS, providerAvailable } from './models'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })
  app.get('/models', (_req, res) => {
    res.set('Cache-Control', 'no-store').json({
      chatModels: Object.values(CHAT_MODELS).map(({ modelId: _modelId, ...model }) => ({
        ...model,
        available: providerAvailable(model.provider)
      })),
      imageModels: Object.values(IMAGE_MODELS).map(({ modelId: _modelId, ...model }) => ({
        ...model,
        available: providerAvailable(model.provider)
      }))
    })
  })

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_PER_MINUTE || 60),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'The request limit was reached. Wait a moment, then try again.' }
  })
  app.use(['/chat', '/images'], auth, limiter)
  app.use(express.json({ limit: '24mb' }))
  app.use(express.urlencoded({ extended: false, limit: '16kb' }))
  app.use('/chat', chatRouter)
  app.use('/images', imagesRouter)
  app.use((_req, res) => {
    res.status(404).json({ error: 'This endpoint does not exist.' })
  })

  const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
    if (res.headersSent) {
      res.end()
      return
    }
    if (error instanceof multer.MulterError) {
      res
        .status(400)
        .json({
          error:
            error.code === 'LIMIT_FILE_SIZE'
              ? 'An image is too large. Use images under 4 MB.'
              : 'Use up to four image files and a short prompt.'
        })
      return
    }
    const status =
      error.status === 413 ? 413 : error.status === 400 || error instanceof SyntaxError ? 400 : 500
    res
      .status(status)
      .json({
        error:
          status === 413
            ? 'This request is too large. Use fewer images or a shorter conversation.'
            : status === 400
              ? 'The request is invalid. Check the prompt and image files.'
              : 'The server could not complete this request. Try again.'
      })
  }
  app.use(handleError)
  return app
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3050)
  createApp().listen(port, () => {
    console.log(`Server started on port ${port}`)
  })
}
