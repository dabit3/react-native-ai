import { timingSafeEqual } from 'crypto'

/**
 * Optional bearer-token auth. Enabled by setting API_AUTH_TOKEN in the
 * server environment; clients must then send `Authorization: Bearer <token>`.
 * Returns a 401 Response when the check fails, otherwise null.
 */
export function checkAuth(req: Request): Response | null {
  const token = process.env.API_AUTH_TOKEN
  if (!token) return null

  const header = req.headers.get('authorization') || ''
  const expected = Buffer.from(`Bearer ${token}`)
  const provided = Buffer.from(header)

  if (expected.length === provided.length && timingSafeEqual(expected, provided)) {
    return null
  }

  return Response.json({ error: 'unauthorized' }, { status: 401 })
}
