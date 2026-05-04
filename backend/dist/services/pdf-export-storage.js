"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getR2Client = getR2Client;
exports.getPdfExportRelativePath = getPdfExportRelativePath;
exports.writePdfExportFile = writePdfExportFile;
exports.pdfExportFileExists = pdfExportFileExists;
exports.deletePdfExportFile = deletePdfExportFile;
exports.getPdfExportSignedUrl = getPdfExportSignedUrl;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
let cachedClient = null;
function requireEnv(name) {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`${name} is required for PDF export storage (Cloudflare R2)`);
    }
    return value;
}
function getBucket() {
    return requireEnv('R2_BUCKET');
}
function getKeyPrefix() {
    const prefix = process.env.R2_PDF_EXPORT_PREFIX?.trim();
    if (!prefix)
        return '';
    return prefix.replace(/^\/+|\/+$/g, '');
}
function getR2Client() {
    if (cachedClient)
        return cachedClient;
    const accountId = requireEnv('R2_ACCOUNT_ID');
    const accessKeyId = requireEnv('R2_ACCESS_KEY_ID');
    const secretAccessKey = requireEnv('R2_SECRET_ACCESS_KEY');
    const endpoint = process.env.R2_ENDPOINT?.trim() || `https://${accountId}.r2.cloudflarestorage.com`;
    cachedClient = new client_s3_1.S3Client({
        region: 'auto',
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
    });
    return cachedClient;
}
function getPdfExportRelativePath(userId, jobId) {
    return `${userId}/${jobId}.pdf`;
}
function toObjectKey(relativePath) {
    const cleaned = relativePath.replace(/^\/+/, '');
    if (cleaned.includes('..')) {
        throw new Error('Invalid PDF export key');
    }
    const prefix = getKeyPrefix();
    return prefix ? `${prefix}/${cleaned}` : cleaned;
}
async function writePdfExportFile(relativePath, buffer) {
    const Key = toObjectKey(relativePath);
    await getR2Client().send(new client_s3_1.PutObjectCommand({
        Bucket: getBucket(),
        Key,
        Body: buffer,
        ContentType: 'application/pdf',
        CacheControl: 'private, max-age=0, no-store',
    }));
    return { key: Key, size: buffer.byteLength };
}
async function pdfExportFileExists(relativePath) {
    try {
        await getR2Client().send(new client_s3_1.HeadObjectCommand({ Bucket: getBucket(), Key: toObjectKey(relativePath) }));
        return true;
    }
    catch {
        return false;
    }
}
async function deletePdfExportFile(relativePath) {
    if (!relativePath)
        return;
    try {
        await getR2Client().send(new client_s3_1.DeleteObjectCommand({ Bucket: getBucket(), Key: toObjectKey(relativePath) }));
    }
    catch {
        // Cleanup is best effort; the scheduled janitor can retry stale files.
    }
}
async function getPdfExportSignedUrl(relativePath, options = {}) {
    const ttlSeconds = Math.max(60, Math.min(7 * 24 * 60 * 60, options.ttlSeconds ?? 15 * 60));
    const filename = options.downloadFilename
        ? `attachment; filename="${options.downloadFilename.replace(/"/g, '')}"`
        : undefined;
    const command = new client_s3_1.GetObjectCommand({
        Bucket: getBucket(),
        Key: toObjectKey(relativePath),
        ResponseContentType: 'application/pdf',
        ResponseContentDisposition: filename,
    });
    return (0, s3_request_presigner_1.getSignedUrl)(getR2Client(), command, { expiresIn: ttlSeconds });
}
