import crypto from 'crypto';

const TOKEN_TTL_MS = 30 * 60 * 1000;

function getSecret(): string {
    const secret = process.env.WORKER_EXPORT_SECRET?.trim();
    if (!secret) {
        throw new Error('WORKER_EXPORT_SECRET is required for PDF export rendering');
    }
    return secret;
}

function sign(jobId: string, expiresAt: number): string {
    return crypto
        .createHmac('sha256', getSecret())
        .update(`${jobId}.${expiresAt}`)
        .digest('base64url');
}

export function createPdfExportToken(jobId: string, ttlMs = TOKEN_TTL_MS): string {
    const expiresAt = Date.now() + ttlMs;
    return `${jobId}.${expiresAt}.${sign(jobId, expiresAt)}`;
}

export function verifyPdfExportToken(jobId: string, token: unknown): boolean {
    if (typeof token !== 'string') return false;

    const [tokenJobId, rawExpiresAt, signature] = token.split('.');
    const expiresAt = Number(rawExpiresAt);
    if (tokenJobId !== jobId || !Number.isFinite(expiresAt) || expiresAt < Date.now() || !signature) {
        return false;
    }

    const expected = sign(jobId, expiresAt);
    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    return providedBuffer.length === expectedBuffer.length
        && crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}
