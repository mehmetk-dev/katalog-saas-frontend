import {
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let cachedClient: S3Client | null = null;

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

export function getPdfExportRelativePath(userId: string, jobId: string): string {
    return `${userId}/${jobId}.pdf`;
}

function toObjectKey(relativePath: string): string {
    const cleaned = relativePath.replace(/^\/+/, '');
    if (cleaned.includes('..')) {
        throw new Error('Invalid PDF export key');
    }
    const prefix = getKeyPrefix();
    return prefix ? `${prefix}/${cleaned}` : cleaned;
}

export async function writePdfExportFile(
    relativePath: string,
    buffer: Buffer,
): Promise<{ key: string; size: number }> {
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
    return { key: Key, size: buffer.byteLength };
}

export async function pdfExportFileExists(relativePath: string): Promise<boolean> {
    try {
        await getR2Client().send(
            new HeadObjectCommand({ Bucket: getBucket(), Key: toObjectKey(relativePath) }),
        );
        return true;
    } catch {
        return false;
    }
}

export async function deletePdfExportFile(relativePath: string | null): Promise<void> {
    if (!relativePath) return;
    try {
        await getR2Client().send(
            new DeleteObjectCommand({ Bucket: getBucket(), Key: toObjectKey(relativePath) }),
        );
    } catch {
        // Cleanup is best effort; the scheduled janitor can retry stale files.
    }
}

export async function getPdfExportSignedUrl(
    relativePath: string,
    options: { ttlSeconds?: number; downloadFilename?: string } = {},
): Promise<string> {
    const ttlSeconds = Math.max(60, Math.min(7 * 24 * 60 * 60, options.ttlSeconds ?? 15 * 60));
    const filename = options.downloadFilename
        ? `attachment; filename="${options.downloadFilename.replace(/"/g, '')}"`
        : undefined;

    const command = new GetObjectCommand({
        Bucket: getBucket(),
        Key: toObjectKey(relativePath),
        ResponseContentType: 'application/pdf',
        ResponseContentDisposition: filename,
    });

    return getSignedUrl(getR2Client(), command, { expiresIn: ttlSeconds });
}

