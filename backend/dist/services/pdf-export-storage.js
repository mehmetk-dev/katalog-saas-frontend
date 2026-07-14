"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getR2Client = getR2Client;
exports.getPdfExportRelativePath = getPdfExportRelativePath;
exports.toPdfExportStoragePath = toPdfExportStoragePath;
exports.resolvePdfExportObjectKey = resolvePdfExportObjectKey;
exports.writePdfExportFile = writePdfExportFile;
exports.deletePdfExportFile = deletePdfExportFile;
exports.getPdfExportSignedUrl = getPdfExportSignedUrl;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
let cachedClient = null;
const STORED_OBJECT_KEY_PREFIX = 'r2-key:';
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
function slugifyPdfSegment(value) {
    if (typeof value !== 'string')
        return '';
    const normalized = value
        .trim()
        .toLocaleLowerCase('tr-TR')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return normalized.slice(0, 80);
}
function formatExportDate(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}
function getPdfExportRelativePath(options) {
    const baseName = slugifyPdfSegment(options.catalogSlug) || slugifyPdfSegment(options.catalogName) || 'catalog';
    const date = formatExportDate(options.createdAt ?? new Date());
    return `${baseName}-${date}-${options.jobId.slice(0, 12)}.pdf`;
}
function cleanObjectKey(value) {
    const cleaned = value.trim().replace(/^\/+/, '');
    if (!cleaned || cleaned.includes('..')) {
        throw new Error('Invalid PDF export key');
    }
    return cleaned;
}
function toObjectKey(relativePath) {
    const cleaned = cleanObjectKey(relativePath);
    const prefix = getKeyPrefix();
    return prefix ? `${prefix}/${cleaned}` : cleaned;
}
function toPdfExportStoragePath(objectKey) {
    return `${STORED_OBJECT_KEY_PREFIX}${cleanObjectKey(objectKey)}`;
}
function resolvePdfExportObjectKey(storagePath) {
    const value = storagePath.trim();
    if (value.startsWith(STORED_OBJECT_KEY_PREFIX)) {
        return cleanObjectKey(value.slice(STORED_OBJECT_KEY_PREFIX.length));
    }
    return toObjectKey(value);
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
    return {
        key: Key,
        storagePath: toPdfExportStoragePath(Key),
        size: buffer.byteLength,
    };
}
async function deletePdfExportFile(storagePath) {
    if (!storagePath)
        return;
    try {
        await getR2Client().send(new client_s3_1.DeleteObjectCommand({
            Bucket: getBucket(),
            Key: resolvePdfExportObjectKey(storagePath),
        }));
    }
    catch {
        // Cleanup is best effort; the scheduled janitor can retry stale files.
    }
}
async function getPdfExportSignedUrl(storagePath, options = {}) {
    const ttlSeconds = Math.max(60, Math.min(7 * 24 * 60 * 60, options.ttlSeconds ?? 15 * 60));
    const filename = options.downloadFilename
        ? `attachment; filename="${options.downloadFilename.replace(/"/g, '')}"`
        : undefined;
    const Key = resolvePdfExportObjectKey(storagePath);
    const Bucket = getBucket();
    try {
        const command = new client_s3_1.GetObjectCommand({
            Bucket,
            Key,
            ResponseContentType: 'application/pdf',
            ResponseContentDisposition: filename,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(getR2Client(), command, { expiresIn: ttlSeconds });
        return url;
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`[pdf-export-storage] getPdfExportSignedUrl failed: bucket=${Bucket} key=${Key} ttl=${ttlSeconds} error=${errMsg}`);
        throw new Error(`Signed URL generation failed for key "${Key}": ${errMsg}`);
    }
}
