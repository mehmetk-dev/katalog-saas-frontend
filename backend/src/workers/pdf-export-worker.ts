import 'dotenv/config';
import { chromium, type Browser, type BrowserContext } from 'playwright';

import { supabase } from '../services/supabase';
import { createPdfExportWorker, type PdfExportBullJob } from '../services/pdf-export-queue';
import { getPdfExportRelativePath, writePdfExportFile } from '../services/pdf-export-storage';
import { createPdfExportToken } from '../services/pdf-export-token';
import { cleanupExpiredPdfExports } from './pdf-export-cleanup';

function getFrontendOrigin(): string {
    return (process.env.PDF_EXPORT_RENDER_ORIGIN || process.env.APP_ORIGIN || 'http://localhost:3000').replace(/\/$/, '');
}

async function updateJob(jobId: string, patch: Record<string, unknown>): Promise<void> {
    const { error } = await supabase
        .from('pdf_export_jobs')
        .update(patch)
        .eq('id', jobId);

    if (error) throw error;
}

let sharedBrowser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
    if (sharedBrowser && sharedBrowser.isConnected()) {
        return sharedBrowser;
    }
    sharedBrowser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--no-zygote',
        ],
    });
    return sharedBrowser;
}

const READY_TIMEOUT_MS = Number(process.env.PDF_EXPORT_READY_TIMEOUT_MS || 300_000);

const MAX_CHUNK_TIMEOUT_MS = READY_TIMEOUT_MS + 120_000;

async function renderPdf(job: PdfExportBullJob): Promise<void> {
    const { jobId, userId } = job.data;

    try {
        await updateJob(jobId, {
            status: 'processing',
            progress: 15,
            attempts: job.attemptsMade + 1,
            started_at: new Date().toISOString(),
        });

        const token = createPdfExportToken(jobId);
        const renderUrl = `${getFrontendOrigin()}/export/catalog/${jobId}?token=${encodeURIComponent(token)}`;

        const browser = await getBrowser();
        const page = await browser.newPage({
            viewport: { width: 794, height: 1123 },
            deviceScaleFactor: job.data.quality === 'high' ? 2 : 1,
        });

        try {
            await page.route('**/*', (route) => {
                const resourceType = route.request().resourceType();

                if (resourceType === 'image') {
                    return route.continue();
                }

                if (resourceType === 'font') {
                    const fontUrl = route.request().url();
                    if (fontUrl.includes('fonts.googleapis.com') || fontUrl.includes('fonts.gstatic.com')) {
                        return route.abort();
                    }
                    return route.continue();
                }

                if (resourceType === 'script') {
                    const urlLower = route.request().url().toLowerCase();
                    if (
                        urlLower.includes('analytics') ||
                        urlLower.includes('sentry') ||
                        urlLower.includes('gtag') ||
                        urlLower.includes('google-analytics') ||
                        urlLower.includes('googletagmanager') ||
                        urlLower.includes('hotjar') ||
                        urlLower.includes('clarity') ||
                        urlLower.includes('facebook') ||
                        urlLower.includes('tiktok')
                    ) {
                        return route.abort();
                    }
                    return route.continue();
                }

                return route.continue();
            });

            await page.goto(renderUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
            await updateJob(jobId, { progress: 35 });

            await page.waitForFunction(
                () => (window as typeof window & { __PDF_EXPORT_READY?: boolean }).__PDF_EXPORT_READY === true,
                null,
                { timeout: READY_TIMEOUT_MS },
            );
            const pageCount = await page.locator('.catalog-page-wrapper').count().catch(() => null);
            await updateJob(jobId, { progress: 70, page_count: pageCount });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: true,
                margin: { top: '0', right: '0', bottom: '0', left: '0' },
            });

            const relativePath = getPdfExportRelativePath(userId, jobId);
            await updateJob(jobId, { progress: 90 });
            const { size } = await writePdfExportFile(relativePath, pdfBuffer);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

            await updateJob(jobId, {
                status: 'completed',
                progress: 100,
                file_path: relativePath,
                file_size_bytes: size,
                completed_at: new Date().toISOString(),
                expires_at: expiresAt,
                error_message: null,
            });
        } finally {
            await page.close().catch(() => undefined);
        }
    } catch (error) {
        if (sharedBrowser && !sharedBrowser.isConnected()) {
            sharedBrowser = null;
        }
        await updateJob(jobId, {
            status: 'failed',
            progress: 0,
            error_message: error instanceof Error ? error.message : 'PDF export failed',
        }).catch(() => undefined);
        throw error;
    }
}

const worker = createPdfExportWorker(renderPdf);

worker.on('completed', (job) => {
    console.log(`[pdf-export-worker] completed ${job.id}`);
});

worker.on('failed', (job, error) => {
    console.error(`[pdf-export-worker] failed ${job?.id}:`, error);
});

async function shutdown(): Promise<void> {
    await sharedBrowser?.close().catch(() => undefined);
    await worker.close();
    process.exit(0);
}

process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());

void worker.waitUntilReady().then(() => {
    console.log('[pdf-export-worker] ready');
});

const CLEANUP_INTERVAL_MS = Number(process.env.PDF_EXPORT_CLEANUP_INTERVAL_MS || 60 * 60 * 1000);
async function runCleanupTick(): Promise<void> {
    try {
        const { processed } = await cleanupExpiredPdfExports();
        if (processed > 0) {
            console.log(`[pdf-export-worker] cleanup expired ${processed} job(s)`);
        }
    } catch (error) {
        console.error('[pdf-export-worker] cleanup tick failed:', error);
    }
}
void runCleanupTick();
setInterval(() => void runCleanupTick(), CLEANUP_INTERVAL_MS);