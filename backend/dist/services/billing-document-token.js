"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBillingDocumentToken = createBillingDocumentToken;
exports.verifyBillingDocumentToken = verifyBillingDocumentToken;
const crypto_1 = __importDefault(require("crypto"));
const TOKEN_TTL_MS = 20 * 60 * 1000;
const TOKEN_SCOPE = 'billing-document';
function getSecret() {
    const secret = process.env.WORKER_EXPORT_SECRET?.trim();
    if (!secret) {
        throw new Error('WORKER_EXPORT_SECRET is required for billing document rendering');
    }
    return secret;
}
function sign(documentId, expiresAt, secret) {
    return crypto_1.default
        .createHmac('sha256', secret)
        .update(`${TOKEN_SCOPE}.${documentId}.${expiresAt}`)
        .digest('base64url');
}
function createBillingDocumentToken(documentId, ttlMs = TOKEN_TTL_MS) {
    const expiresAt = Date.now() + ttlMs;
    return `${documentId}.${expiresAt}.${sign(documentId, expiresAt, getSecret())}`;
}
function verifyBillingDocumentToken(documentId, token) {
    try {
        const secret = process.env.WORKER_EXPORT_SECRET?.trim();
        if (!secret || typeof token !== 'string')
            return false;
        const [tokenDocumentId, rawExpiresAt, signature] = token.split('.');
        const expiresAt = Number(rawExpiresAt);
        if (tokenDocumentId !== documentId ||
            !Number.isFinite(expiresAt) ||
            expiresAt < Date.now() ||
            !signature) {
            return false;
        }
        const expected = sign(documentId, expiresAt, secret);
        const providedBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expected);
        return (providedBuffer.length === expectedBuffer.length &&
            crypto_1.default.timingSafeEqual(providedBuffer, expectedBuffer));
    }
    catch {
        return false;
    }
}
