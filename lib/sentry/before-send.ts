import type { ErrorEvent, EventHint } from "@sentry/nextjs"

/**
 * Sentry `beforeSend` hook — beklenen iş-mantığı hatalarını (plan limit,
 * auth, not found, rate-limit) filtreler, böylece Sentry'de gerçek bug'lar
 * görünür olur.
 *
 * Filtrelenen durumlar:
 *  - `apiFetch` (lib/api.ts) tarafından fırlatılan `ApiError` objesi
 *    `isExpected === true` ise (status: 401/402/403/404/409/422/429).
 *  - Mesajı bilinen kullanıcıya-yönelik kalıplarla eşleşen hatalar.
 */
export function sentryBeforeSend(
    event: ErrorEvent,
    hint: EventHint,
): ErrorEvent | null {
    const original = hint?.originalException as
        | { isExpected?: boolean; status?: number; message?: string }
        | undefined

    if (original?.isExpected === true) return null

    // Fallback: bazı runtime'larda `originalException` serialize edilmiş olabilir.
    // Exception value'sunda "Limit Reached" / "Unauthorized" gibi kalıpları yakala.
    const firstException = event.exception?.values?.[0]
    const message = firstException?.value || event.message || ""
    if (EXPECTED_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))) {
        return null
    }

    return event
}

const EXPECTED_MESSAGE_PATTERNS: RegExp[] = [
    /^Limit Reached$/i,
    /^Unauthorized$/i,
    /^Forbidden$/i,
    /^Not Found$/i,
    /^Rate Limit/i,
    /^api\.error\.(forbidden|unauthorized|notFound|rateLimit|conflict|validationError)$/,
]
