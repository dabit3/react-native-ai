const WINDOW_MS = 60 * 1000

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
let lastSweep = Date.now()

function getLimit(): number {
  return Number(process.env.RATE_LIMIT_PER_MINUTE || 60)
}

/**
 * Amortized cleanup: at most once per window, drop buckets whose window has
 * fully elapsed so keys from one-time clients don't accumulate forever.
 */
function sweepExpired(now: number) {
  if (now - lastSweep < WINDOW_MS) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
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

  sweepExpired(now)

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
