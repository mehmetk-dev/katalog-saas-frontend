import 'dotenv/config';
import { chromium } from 'playwright';

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

async function incrementUserExports(userId: string): Promise<void> {
    const { data, error } = await supabase
        .from('users')
        .select('exports_used')
        .eq('id', userId)
        .single();
    if (error || !data) return;
    const used = Number(data.exports_used) || 0;
    await supabase
        .from('users')
        .update({ exports_used: used + 1 })
        .eq('id', userId)
        .eq('exports_used', used);
}

async function renderPdf(job: PdfExportBullJob): Promise<void> {
    const { jobId, userId } = job.data;
    let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;

    try {
        await updateJob(jobId, {
            status: 'processing',
            progress: 10,
            attempts: job.attemptsMade + 1,
            started_at: new Date().toISOString(),
        });

        const token = createPdfExportToken(jobId);
        const renderUrl = `${getFrontendOrigin()}/export/catalog/${jobId}?token=${encodeURIComponent(token)}`;

        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage({
            viewport: { width: 794, height: 1123 },
            deviceScaleFactor: job.data.quality === 'high' ? 2 : 1,
        });

        await page.goto(renderUrl, { waitUntil: 'networkidle', timeout: 120_000 });
        await updateJob(jobId, { progress: 45 });

        await page.waitForFunction(
            () => (window as typeof window & { __PDF_EXPORT_READY?: boolean }).__PDF_EXPORT_READY === true,
            null,
            { timeout: 120_000 },
        );
        const pageCount = await page.locator('.catalog-page-wrapper').count().catch(() => null);
        await updateJob(jobId, { progress: 80, page_count: pageCount });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
        });

        const relativePath = getPdfExportRelativePath(userId, jobId);
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

        await incrementUserExports(userId).catch((err) => {
            console.error(`[pdf-export-worker] failed to increment exports for ${userId}:`, err);
        });
    } catch (error) {
        await updateJob(jobId, {
            status: 'failed',
            progress: 0,
            error_message: error instanceof Error ? error.message : 'PDF export failed',
        }).catch(() => undefined);
        throw error;
    } finally {
        await browser?.close().catch(() => undefined);
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
