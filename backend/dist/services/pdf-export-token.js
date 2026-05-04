"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPdfExportToken = createPdfExportToken;
exports.verifyPdfExportToken = verifyPdfExportToken;
const crypto_1 = __importDefault(require("crypto"));
const TOKEN_TTL_MS = 30 * 60 * 1000;
function getSecret() {
    const secret = process.env.WORKER_EXPORT_SECRET?.trim();
    if (!secret) {
        throw new Error('WORKER_EXPORT_SECRET is required for PDF export rendering');
    }
    return secret;
}
function sign(jobId, expiresAt) {
    return crypto_1.default
        .createHmac('sha256', getSecret())
        .update(`${jobId}.${expiresAt}`)
        .digest('base64url');
}
function createPdfExportToken(jobId, ttlMs = TOKEN_TTL_MS) {
    const expiresAt = Date.now() + ttlMs;
    return `${jobId}.${expiresAt}.${sign(jobId, expiresAt)}`;
}
function verifyPdfExportToken(jobId, token) {
    if (typeof token !== 'string')
        return false;
    const [tokenJobId, rawExpiresAt, signature] = token.split('.');
    const expiresAt = Number(rawExpiresAt);
    if (tokenJobId !== jobId || !Number.isFinite(expiresAt) || expiresAt < Date.now() || !signature) {
        return false;
    }
    const expected = sign(jobId, expiresAt);
    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    return providedBuffer.length === expectedBuffer.length
        && crypto_1.default.timingSafeEqual(providedBuffer, expectedBuffer);
}
