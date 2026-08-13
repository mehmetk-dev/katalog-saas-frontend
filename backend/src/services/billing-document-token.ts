import crypto from 'crypto'

const TOKEN_TTL_MS = 20 * 60 * 1000
const TOKEN_SCOPE = 'billing-document'

function getSecret(): string {
    const secret = process.env.WORKER_EXPORT_SECRET?.trim()
    if (!secret) {
        throw new Error('WORKER_EXPORT_SECRET is required for billing document rendering')
    }
    return secret
}

function sign(documentId: string, expiresAt: number, secret: string): string {
    return crypto
        .createHmac('sha256', secret)
        .update(`${TOKEN_SCOPE}.${documentId}.${expiresAt}`)
        .digest('base64url')
}

export function createBillingDocumentToken(
    documentId: string,
    ttlMs = TOKEN_TTL_MS
): string {
    const expiresAt = Date.now() + ttlMs
    return `${documentId}.${expiresAt}.${sign(documentId, expiresAt, getSecret())}`
}

export function verifyBillingDocumentToken(documentId: string, token: unknown): boolean {
    try {
        const secret = process.env.WORKER_EXPORT_SECRET?.trim()
        if (!secret || typeof token !== 'string') return false

        const [tokenDocumentId, rawExpiresAt, signature] = token.split('.')
        const expiresAt = Number(rawExpiresAt)
        if (
            tokenDocumentId !== documentId ||
            !Number.isFinite(expiresAt) ||
            expiresAt < Date.now() ||
            !signature
        ) {
            return false
        }

        const expected = sign(documentId, expiresAt, secret)
        const providedBuffer = Buffer.from(signature)
        const expectedBuffer = Buffer.from(expected)
        return (
            providedBuffer.length === expectedBuffer.length &&
            crypto.timingSafeEqual(providedBuffer, expectedBuffer)
        )
    } catch {
        return false
    }
}
