"use client"

interface RetryOptions {
    /** Maksimum deneme sayısı - varsayılan 3 */
    maxRetries?: number
    /** Denemeler arası bekleme süresi (ms) - varsayılan 1000ms */
    delayMs?: number
    /** Her denemede delay'i çarp (exponential backoff) - varsayılan 2 */
    backoffMultiplier?: number
    /** Hangi hatalarda tekrar denensin (varsayılan: tüm hatalar) */
    retryCondition?: (error: unknown) => boolean
    /** Her deneme öncesi callback */
    onRetry?: (attempt: number, error: unknown) => void
}

interface RetryResult<T> {
    success: boolean
    data?: T
    error?: unknown
    attempts: number
}

/**
 * Bir async fonksiyonu belirtilen sayıda tekrar dener
 * Exponential backoff ile bekleme süresi artar
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<RetryResult<T>> {
    const {
        maxRetries = 3,
        delayMs = 1000,
        backoffMultiplier = 2,
        retryCondition = () => true,
        onRetry
    } = options

    let lastError: unknown
    let attempts = 0
    let currentDelay = delayMs

    for (let i = 0; i <= maxRetries; i++) {
        attempts = i + 1

        try {
            const result = await fn()
            return { success: true, data: result, attempts }
        } catch (error: unknown) {
            lastError = error

            // Son deneme mi veya retry koşulu sağlanmıyor mu?
            if (i === maxRetries || !retryCondition(error)) {
                break
            }

            // Retry callback
            onRetry?.(i + 1, error)

            // Bekle (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, currentDelay))
            currentDelay *= backoffMultiplier
        }
    }

    return { success: false, error: lastError, attempts }
}

/**
 * Network hatalarını tespit eder
 */
export function isNetworkError(error: unknown): boolean {
    if (!error) return false

    const networkErrorMessages = [
        'network',
        'fetch',
        'timeout',
        'ECONNREFUSED',
        'ENOTFOUND',
        'ETIMEDOUT',
        'ERR_NETWORK',
        'Failed to fetch'
    ]

    const errorMessage = (
        (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : '') ||
        String(error)
    ).toLowerCase()
    return networkErrorMessages.some(msg => errorMessage.includes(msg.toLowerCase()))
}

/**
 * Rate limit hatalarını tespit eder
 */
export function isRateLimitError(error: unknown): boolean {
    if (!error) return false

    // HTTP 429 Too Many Requests
    if (error && typeof error === 'object' && 'status' in error && (error as { status: unknown }).status === 429) {
        return true
    }

    const errorMessage = (
        (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : '') ||
        String(error)
    ).toLowerCase()
    return errorMessage.includes('rate limit') || errorMessage.includes('too many requests')
}

/**
 * Retry için önerilen bekleme süresini hesaplar
 */
export function getRetryAfter(error: unknown): number {
    // Retry-After header varsa kullan
    if (error && typeof error === 'object' && 'headers' in error) {
        const headers = (error as { headers?: { get?: (name: string) => string | null } }).headers
        if (headers?.get) {
            const retryAfter = headers.get('Retry-After')
            if (retryAfter) {
                const seconds = parseInt(retryAfter, 10)
                if (!isNaN(seconds)) return seconds * 1000
            }
        }
    }

    // Rate limit ise daha uzun bekle
    if (isRateLimitError(error)) {
        return 30000 // 30 saniye
    }

    // Varsayılan
    return 2000
}

/**
 * Akıllı retry - network ve rate limit hatalarını özel olarak işler
 */
export async function smartRetry<T>(
    fn: () => Promise<T>,
    options: Omit<RetryOptions, 'retryCondition' | 'delayMs'> = {}
): Promise<RetryResult<T>> {
    return withRetry(fn, {
        ...options,
        delayMs: 1000,
        retryCondition: (error) => {
            // Network hataları için tekrar dene
            if (isNetworkError(error)) return true

            // Rate limit için tekrar dene (daha uzun bekleyerek)
            if (isRateLimitError(error)) return true

            // Diğer hatalar için tekrar deneme
            return false
        },
        onRetry: (attempt, error) => {
            const delay = isRateLimitError(error)
                ? getRetryAfter(error)
                : options.backoffMultiplier ? 1000 * Math.pow(2, attempt - 1) : 1000

            console.warn(`Retry attempt ${attempt}, waiting ${delay}ms...`, error?.message)
            options.onRetry?.(attempt, error)
        }
    })
}
