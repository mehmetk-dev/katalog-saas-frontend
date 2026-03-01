/**
 * In-memory rate limiter with LRU eviction.
 * Production'da Redis tabanlı (örn. @upstash/ratelimit) kullanılabilir.
 * Tek instance / serverless cold start için uygun.
 *
 * SECURITY improvements:
 * - LRU max size prevents memory exhaustion from unique IPs (DoS vector)
 * - Automatic cleanup of expired entries
 * - Bounded memory usage
 */

// SECURITY: Maximum unique keys to prevent memory exhaustion
// An attacker rotating IPs could create unlimited entries without this cap
const MAX_STORE_SIZE = 10_000

const store = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60 * 1000 // 1 dakika
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 dakikada bir eski kayıtları temizle

function getClientIdFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")
  const realIp = headers.get("x-real-ip")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  if (realIp) return realIp.trim()
  // Proxy yoksa tüm istekler aynı key'e düşer (dev veya tek client)
  return "unknown"
}

function cleanup() {
  const now = Date.now()
  for (const [key, value] of store.entries()) {
    if (value.resetAt < now) store.delete(key)
  }
}

/**
 * SECURITY: Evict oldest entries when store reaches max capacity
 * Prevents memory exhaustion from attacker rotating source IPs
 */
function evictOldest() {
  // First pass: remove expired entries
  cleanup()

  // If still above limit, remove oldest 20% by resetAt
  if (store.size >= MAX_STORE_SIZE) {
    const toRemove = Math.ceil(MAX_STORE_SIZE * 0.2)
    const entries = [...store.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt)
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      store.delete(entries[i][0])
    }
  }
}

let cleanupTimer: ReturnType<typeof setInterval> | null = null
function scheduleCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL)
  if (cleanupTimer.unref) cleanupTimer.unref()
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Rate limit kontrolü. limit kadar istek windowMs içinde yapılabilir.
 * request veya headers (Next.js server action için await headers()) verebilirsiniz.
 */
export function checkRateLimit(
  requestOrHeaders: Request | Headers,
  keyPrefix: string,
  limit: number,
  windowMs: number = WINDOW_MS
): RateLimitResult {
  scheduleCleanup()
  const headers = requestOrHeaders instanceof Request ? requestOrHeaders.headers : requestOrHeaders
  const clientId = getClientIdFromHeaders(headers)
  const key = `${keyPrefix}:${clientId}`
  const now = Date.now()
  let entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    // SECURITY: Evict oldest entries if store is full (LRU-style)
    if (store.size >= MAX_STORE_SIZE) {
      evictOldest()
    }
    entry = { count: 1, resetAt: now + windowMs }
    store.set(key, entry)
    return { allowed: true, remaining: limit - 1, resetAt: entry.resetAt }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count += 1
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  }
}

/** Auth callback: dakikada en fazla 15 deneme (OAuth redirect) */
export const AUTH_CALLBACK_LIMIT = 15
export const AUTH_CALLBACK_WINDOW_MS = 60 * 1000

/** Feedback gönderimi: 10 dakikada en fazla 5 */
export const FEEDBACK_LIMIT = 5
export const FEEDBACK_WINDOW_MS = 10 * 60 * 1000

/** Public iletişim formu: 10 dakikada en fazla 3 */
export const CONTACT_LIMIT = 3
export const CONTACT_WINDOW_MS = 10 * 60 * 1000
