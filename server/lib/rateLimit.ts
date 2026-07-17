const WINDOW_MS = 60 * 1000

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

function getLimit(): number {
  return Number(process.env.RATE_LIMIT_PER_MINUTE || 60)
}

function getClientKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

/**
 * Fixed-window in-memory rate limiter, keyed by client IP. Returns a 429
 * Response when the limit is exceeded, otherwise null.
 */
export function checkRateLimit(req: Request): Response | null {
  const limit = getLimit()
  const key = getClientKey(req)
  const now = Date.now()

  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS }
    buckets.set(key, bucket)
  }

  bucket.count += 1

  const remaining = Math.max(0, limit - bucket.count)
  const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000)
  const headers = {
    'RateLimit-Limit': String(limit),
    'RateLimit-Remaining': String(remaining),
    'RateLimit-Reset': String(resetSeconds)
  }

  if (bucket.count > limit) {
    return Response.json(
      { error: 'Too many requests, please try again later.' },
      {
        status: 429,
        headers: { ...headers, 'Retry-After': String(resetSeconds) }
      }
    )
  }

  return null
}
