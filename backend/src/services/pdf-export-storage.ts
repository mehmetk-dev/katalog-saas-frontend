import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let cachedClient: S3Client | null = null;
const STORED_OBJECT_KEY_PREFIX = 'r2-key:';

function requireEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`${name} is required for PDF export storage (Cloudflare R2)`);
    }
    return value;
}

function getBucket(): string {
    return requireEnv('R2_BUCKET');
}

function getKeyPrefix(): string {
    const prefix = process.env.R2_PDF_EXPORT_PREFIX?.trim();
    if (!prefix) return '';
    return prefix.replace(/^\/+|\/+$/g, '');
}

export function getR2Client(): S3Client {
    if (cachedClient) return cachedClient;
    const accountId = requireEnv('R2_ACCOUNT_ID');
    const accessKeyId = requireEnv('R2_ACCESS_KEY_ID');
    const secretAccessKey = requireEnv('R2_SECRET_ACCESS_KEY');
    const endpoint = process.env.R2_ENDPOINT?.trim() || `https://${accountId}.r2.cloudflarestorage.com`;
    cachedClient = new S3Client({
        region: 'auto',
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
    });
    return cachedClient;
}

function slugifyPdfSegment(value: unknown): string {
    if (typeof value !== 'string') return '';
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

function formatExportDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

export function getPdfExportRelativePath(options: {
    jobId: string;
    catalogName?: unknown;
    catalogSlug?: unknown;
    createdAt?: Date;
}): string {
    const baseName =
        slugifyPdfSegment(options.catalogSlug) || slugifyPdfSegment(options.catalogName) || 'catalog';
    const date = formatExportDate(options.createdAt ?? new Date());
    return `${baseName}-${date}-${options.jobId.slice(0, 12)}.pdf`;
}

function cleanObjectKey(value: string): string {
    const cleaned = value.trim().replace(/^\/+/, '');
    if (!cleaned || cleaned.includes('..')) {
        throw new Error('Invalid PDF export key');
    }
    return cleaned;
}

function toObjectKey(relativePath: string): string {
    const cleaned = cleanObjectKey(relativePath);
    const prefix = getKeyPrefix();
    return prefix ? `${prefix}/${cleaned}` : cleaned;
}

export function toPdfExportStoragePath(objectKey: string): string {
    return `${STORED_OBJECT_KEY_PREFIX}${cleanObjectKey(objectKey)}`;
}

export function resolvePdfExportObjectKey(storagePath: string): string {
    const value = storagePath.trim();
    if (value.startsWith(STORED_OBJECT_KEY_PREFIX)) {
        return cleanObjectKey(value.slice(STORED_OBJECT_KEY_PREFIX.length));
    }

    return toObjectKey(value);
}

export async function writePdfExportFile(
    relativePath: string,
    buffer: Buffer,
): Promise<{ key: string; storagePath: string; size: number }> {
    const Key = toObjectKey(relativePath);
    await getR2Client().send(
        new PutObjectCommand({
            Bucket: getBucket(),
            Key,
            Body: buffer,
            ContentType: 'application/pdf',
            CacheControl: 'private, max-age=0, no-store',
        }),
    );
    return {
        key: Key,
        storagePath: toPdfExportStoragePath(Key),
        size: buffer.byteLength,
    };
}

export async function deletePdfExportFile(storagePath: string | null): Promise<void> {
    if (!storagePath) return;
    try {
        await getR2Client().send(
            new DeleteObjectCommand({
                Bucket: getBucket(),
                Key: resolvePdfExportObjectKey(storagePath),
            }),
        );
    } catch {
        // Cleanup is best effort; the scheduled janitor can retry stale files.
    }
}

export async function getPdfExportSignedUrl(
    storagePath: string,
    options: { ttlSeconds?: number; downloadFilename?: string } = {},
): Promise<string> {
    const ttlSeconds = Math.max(60, Math.min(7 * 24 * 60 * 60, options.ttlSeconds ?? 15 * 60));
    const filename = options.downloadFilename
        ? `attachment; filename="${options.downloadFilename.replace(/"/g, '')}"`
        : undefined;

    const Key = resolvePdfExportObjectKey(storagePath);
    const Bucket = getBucket();

    try {
        const command = new GetObjectCommand({
            Bucket,
            Key,
            ResponseContentType: 'application/pdf',
            ResponseContentDisposition: filename,
        });

        const url = await getSignedUrl(getR2Client(), command, { expiresIn: ttlSeconds });
        return url;
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`[pdf-export-storage] getPdfExportSignedUrl failed: bucket=${Bucket} key=${Key} ttl=${ttlSeconds} error=${errMsg}`);
        throw new Error(`Signed URL generation failed for key "${Key}": ${errMsg}`);
    }
}
