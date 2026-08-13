const blockedDetailKey =
    /password|secret|token|store.?key|hash|card|pan|cvc|email|phone|xml|payload/i

export function sanitizePaymentAlertDetails(
    details: Record<string, unknown> | undefined
): Record<string, string | number | boolean | null> {
    const safe: Record<string, string | number | boolean | null> = {}
    for (const [key, value] of Object.entries(details ?? {}).slice(0, 20)) {
        if (!/^[A-Za-z][A-Za-z0-9_]{0,49}$/.test(key) || blockedDetailKey.test(key)) continue
        if (value === null || typeof value === 'boolean' || typeof value === 'number') {
            safe[key] = value
        } else if (typeof value === 'string') {
            safe[key] = value.slice(0, 200)
        }
    }
    return safe
}
