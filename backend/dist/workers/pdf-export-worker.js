"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const playwright_1 = require("playwright");
const supabase_1 = require("../services/supabase");
const pdf_export_queue_1 = require("../services/pdf-export-queue");
const pdf_export_storage_1 = require("../services/pdf-export-storage");
const pdf_export_token_1 = require("../services/pdf-export-token");
const pdf_export_cleanup_1 = require("./pdf-export-cleanup");
function getFrontendOrigin() {
    return (process.env.PDF_EXPORT_RENDER_ORIGIN || process.env.APP_ORIGIN || 'http://localhost:3000').replace(/\/$/, '');
}
async function updateJob(jobId, patch) {
    const { error } = await supabase_1.supabase
        .from('pdf_export_jobs')
        .update(patch)
        .eq('id', jobId);
    if (error)
        throw error;
}
async function incrementUserExports(userId) {
    const { data, error } = await supabase_1.supabase
        .from('users')
        .select('exports_used')
        .eq('id', userId)
        .single();
    if (error || !data)
        return;
    const used = Number(data.exports_used) || 0;
    await supabase_1.supabase
        .from('users')
        .update({ exports_used: used + 1 })
        .eq('id', userId)
        .eq('exports_used', used);
}
async function renderPdf(job) {
    const { jobId, userId } = job.data;
    let browser = null;
    try {
        await updateJob(jobId, {
            status: 'processing',
            progress: 10,
            attempts: job.attemptsMade + 1,
            started_at: new Date().toISOString(),
        });
        const token = (0, pdf_export_token_1.createPdfExportToken)(jobId);
        const renderUrl = `${getFrontendOrigin()}/export/catalog/${jobId}?token=${encodeURIComponent(token)}`;
        browser = await playwright_1.chromium.launch({ headless: true });
        const page = await browser.newPage({
            viewport: { width: 794, height: 1123 },
            deviceScaleFactor: job.data.quality === 'high' ? 2 : 1,
        });
        await page.goto(renderUrl, { waitUntil: 'networkidle', timeout: 120000 });
        await updateJob(jobId, { progress: 45 });
        await page.waitForFunction(() => window.__PDF_EXPORT_READY === true, null, { timeout: 120000 });
        const pageCount = await page.locator('.catalog-page-wrapper').count().catch(() => null);
        await updateJob(jobId, { progress: 80, page_count: pageCount });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
        });
        const relativePath = (0, pdf_export_storage_1.getPdfExportRelativePath)(userId, jobId);
        const { size } = await (0, pdf_export_storage_1.writePdfExportFile)(relativePath, pdfBuffer);
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
    }
    catch (error) {
        await updateJob(jobId, {
            status: 'failed',
            progress: 0,
            error_message: error instanceof Error ? error.message : 'PDF export failed',
        }).catch(() => undefined);
        throw error;
    }
    finally {
        await browser?.close().catch(() => undefined);
    }
}
const worker = (0, pdf_export_queue_1.createPdfExportWorker)(renderPdf);
worker.on('completed', (job) => {
    console.log(`[pdf-export-worker] completed ${job.id}`);
});
worker.on('failed', (job, error) => {
    console.error(`[pdf-export-worker] failed ${job?.id}:`, error);
});
async function shutdown() {
    await worker.close();
    process.exit(0);
}
process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());
void worker.waitUntilReady().then(() => {
    console.log('[pdf-export-worker] ready');
});
const CLEANUP_INTERVAL_MS = Number(process.env.PDF_EXPORT_CLEANUP_INTERVAL_MS || 60 * 60 * 1000);
async function runCleanupTick() {
    try {
        const { processed } = await (0, pdf_export_cleanup_1.cleanupExpiredPdfExports)();
        if (processed > 0) {
            console.log(`[pdf-export-worker] cleanup expired ${processed} job(s)`);
        }
    }
    catch (error) {
        console.error('[pdf-export-worker] cleanup tick failed:', error);
    }
}
void runCleanupTick();
setInterval(() => void runCleanupTick(), CLEANUP_INTERVAL_MS);
