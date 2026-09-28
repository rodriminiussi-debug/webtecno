import 'server-only'

const attempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 8

/** In-memory limiter: good enough for a single instance; swap for Redis/Upstash when scaling out. */
export function isRateLimited(key: string) {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > MAX_ATTEMPTS
}

export function clearRateLimit(key: string) {
  attempts.delete(key)
}
