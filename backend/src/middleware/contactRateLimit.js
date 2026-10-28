import { ApiError } from './apiError.js'

export function createContactRateLimiter({
  max = 5,
  windowMs = 15 * 60 * 1000,
  maxEntries = 10_000,
  now = Date.now,
} = {}) {
  const entries = new Map()
  let nextCleanup = 0

  return function contactRateLimit(request, response, next) {
    const time = now()
    if (time >= nextCleanup || entries.size >= maxEntries) {
      for (const [key, entry] of entries) {
        if (entry.resetAt <= time) entries.delete(key)
      }
      nextCleanup = time + Math.min(windowMs, 60_000)
    }
    const key = request.ip || 'unknown'
    let entry = entries.get(key)
    if (!entry || entry.resetAt <= time) {
      if (entries.size >= maxEntries && !entry) {
        response.set('Retry-After', String(Math.ceil(windowMs / 1000)))
        return next(
          new ApiError(429, 'RATE_LIMITED', 'Please wait before sending another message.'),
        )
      }
      entry = { count: 0, resetAt: time + windowMs }
      entries.set(key, entry)
    }
    const remaining = Math.max(0, entry.resetAt - time)
    response.set({
      'RateLimit-Limit': String(max),
      'RateLimit-Remaining': String(Math.max(0, max - entry.count - 1)),
      'RateLimit-Reset': String(Math.ceil(remaining / 1000)),
      'Cache-Control': 'no-store',
    })
    if (entry.count >= max) {
      response.set('Retry-After', String(Math.ceil(remaining / 1000)))
      return next(new ApiError(429, 'RATE_LIMITED', 'Please wait before sending another message.'))
    }
    entry.count += 1
    next()
  }
}
