import crypto from "crypto"

function getSecret(): string | null {
  const secret = process.env.WORKER_EXPORT_SECRET?.trim()
  if (!secret) {
    console.error("[pdf-export-token] WORKER_EXPORT_SECRET is not configured — PDF export token verification will fail")
    return null
  }
  return secret
}

function sign(jobId: string, expiresAt: number, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`${jobId}.${expiresAt}`)
    .digest("base64url")
}

export function verifyPdfExportToken(jobId: string, token: unknown): boolean {
  const secret = getSecret()
  if (!secret) return false

  if (typeof token !== "string") return false

  const [tokenJobId, rawExpiresAt, signature] = token.split(".")
  const expiresAt = Number(rawExpiresAt)
  if (tokenJobId !== jobId || !Number.isFinite(expiresAt) || expiresAt < Date.now() || !signature) {
    return false
  }

  const expected = sign(jobId, expiresAt, secret)
  const providedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  return providedBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(providedBuffer, expectedBuffer)
}
