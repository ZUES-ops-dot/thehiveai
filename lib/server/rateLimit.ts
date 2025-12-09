/**
 * Simple in-memory rate limiter.
 * NOTE: Only works for single-instance dev. Replace with Redis/KV in production.
 */

interface Bucket {
  tokens: number
  lastRefill: number
}

const buckets = new Map<string, Bucket>()
const MAX_TOKENS = 10
const REFILL_INTERVAL_MS = 60_000 // 1 minute
const REFILL_TOKENS = 10

/**
 * Check if a request should be allowed based on rate limiting.
 * @param key - Unique identifier for the rate limit bucket (e.g., `play-solana-${ip}`)
 * @returns true if request is allowed, false if rate limited
 */
export function rateLimit(key: string): boolean {
  const now = Date.now()
  const bucket = buckets.get(key) ?? { tokens: MAX_TOKENS, lastRefill: now }

  // Refill tokens if interval has passed
  const elapsed = now - bucket.lastRefill
  if (elapsed >= REFILL_INTERVAL_MS) {
    const refillCount = Math.floor(elapsed / REFILL_INTERVAL_MS)
    bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + REFILL_TOKENS * refillCount)
    bucket.lastRefill = now
  }

  // Check if tokens available
  if (bucket.tokens <= 0) {
    buckets.set(key, bucket)
    return false
  }

  // Consume a token
  bucket.tokens -= 1
  buckets.set(key, bucket)
  return true
}

/**
 * Get remaining tokens for a bucket
 */
export function getRemainingTokens(key: string): number {
  const bucket = buckets.get(key)
  return bucket?.tokens ?? MAX_TOKENS
}

/**
 * Reset rate limit for a specific key
 */
export function resetRateLimit(key: string): void {
  buckets.delete(key)
}
