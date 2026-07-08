import { Request, Response, NextFunction } from 'express'
import { timingSafeEqual } from 'crypto'
import { ZodSchema } from 'zod'

/**
 * Optional bearer-token auth. Enabled by setting API_AUTH_TOKEN in the
 * server environment; clients must then send `Authorization: Bearer <token>`.
 */
export function auth(req: Request, res: Response, next: NextFunction) {
  const token = process.env.API_AUTH_TOKEN
  if (!token) return next()
  const header = req.headers.authorization || ''
  const expected = Buffer.from(`Bearer ${token}`)
  const provided = Buffer.from(header)
  if (
    expected.length === provided.length &&
    timingSafeEqual(expected, provided)
  ) return next()
  res.status(401).json({ error: 'unauthorized' })
}

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({
        error: 'invalid request body',
        details: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
      })
      return
    }
    req.body = result.data
    next()
  }
}
