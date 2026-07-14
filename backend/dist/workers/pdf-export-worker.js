"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const playwright_1 = require("playwright");
const http_1 = __importDefault(require("http"));
const supabase_1 = require("../services/supabase");
const pdf_export_queue_1 = require("../services/pdf-export-queue");
const pdf_export_storage_1 = require("../services/pdf-export-storage");
const pdf_export_token_1 = require("../services/pdf-export-token");
const pdf_export_cleanup_1 = require("./pdf-export-cleanup");
let cachedFrontendOrigin = null;
function probeFrontend(host, port) {
    return new Promise((resolve) => {
        const req = http_1.default.get(`http://${host}:${port}/api/health`, { timeout: 3000 }, (res) => {
            resolve(res.statusCode === 200);
            res.resume();
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
    });
}
async function discoverFrontendOrigin() {
    const envValue = (process.env.PDF_EXPORT_RENDER_ORIGIN || '').replace(/\/$/, '');
    if (envValue) {
        cachedFrontendOrigin = envValue;
        return envValue;
    }
    const candidates = [
        { host: 'frontend', port: 3000 },
        { host: 'nextjs', port: 3000 },
        { host: 'app', port: 3000 },
        { host: 'localhost', port: 3000 },
    ];
    for (const c of candidates) {
        if (await probeFrontend(c.host, c.port)) {
            const origin = `http://${c.host}:${c.port}`;
            console.log(`[pdf-export-worker] discovered frontend at ${origin}`);
            cachedFrontendOrigin = origin;
            return origin;
        }
    }
    const fallback = (process.env.APP_ORIGIN || 'http://localhost:3000').replace(/\/$/, '');
    console.warn(`[pdf-export-worker] could not discover frontend, using fallback: ${fallback}`);
    cachedFrontendOrigin = fallback;
    return fallback;
}
async function updateJob(jobId, patch) {
    const { data, error } = await supabase_1.supabase
        .from('pdf_export_jobs')
        .update(patch)
        .eq('id', jobId)
        .select('id')
        .maybeSingle();
    if (error) {
        throw new Error(`PDF export job update failed: ${getErrorMessage(error)}`);
    }
    if (!data) {
        throw new Error(`PDF export job not found: ${jobId}`);
    }
}
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    if (error && typeof error === 'object' && 'message' in error) {
        const message = error.message;
        if (typeof message === 'string' && message.trim())
            return message;
    }
    if (typeof error === 'string' && error.trim())
        return error;
    try {
        return JSON.stringify(error);
    }
    catch {
        return 'Unknown PDF export error';
    }
}
async function updateJobWithRetry(jobId, patch, attempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            await updateJob(jobId, patch);
            return;
        }
        catch (error) {
            lastError = error;
            if (attempt < attempts) {
                console.warn(`[pdf-export-worker] job update retry ${attempt}/${attempts - 1} for ${jobId}: ${getErrorMessage(error)}`);
                await new Promise((resolve) => setTimeout(resolve, attempt * 750));
            }
        }
    }
    throw lastError;
}
async function getCatalogExportName(catalogId, userId) {
    const { data, error } = await supabase_1.supabase
        .from('catalogs')
        .select('name,share_slug')
        .eq('id', catalogId)
        .eq('user_id', userId)
        .single();
    if (error) {
        console.warn(`[pdf-export-worker] catalog name lookup failed for ${catalogId}:`, error.message);
        return null;
    }
    return data;
}
let sharedBrowser = null;
let browserCrashCount = 0;
const MAX_BROWSER_CRASHES = 3;
async function getBrowser() {
    if (sharedBrowser && sharedBrowser.isConnected()) {
        return sharedBrowser;
    }
    browserCrashCount = 0;
    sharedBrowser = await playwright_1.chromium.launch({
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
async function recoverBrowser() {
    if (sharedBrowser) {
        try {
            if (sharedBrowser.isConnected()) {
                await sharedBrowser.close();
            }
        }
        catch {
            // browser already dead
        }
        sharedBrowser = null;
    }
}
const READY_TIMEOUT_MS = Number(process.env.PDF_EXPORT_READY_TIMEOUT_MS || 300000);
const GOTO_TIMEOUT_MS = Number(process.env.PDF_EXPORT_GOTO_TIMEOUT_MS || 120000);
async function renderPdf(job) {
    const { jobId, userId, catalogId } = job.data;
    let phase = 'initializing';
    try {
        phase = 'marking-processing';
        await updateJob(jobId, {
            status: 'processing',
            progress: 15,
            attempts: job.attemptsMade + 1,
            started_at: new Date().toISOString(),
        });
        phase = 'loading-render-page';
        const token = (0, pdf_export_token_1.createPdfExportToken)(jobId);
        const frontendOrigin = await discoverFrontendOrigin();
        const renderUrl = `${frontendOrigin}/export/catalog/${jobId}?token=${encodeURIComponent(token)}`;
        const browser = await getBrowser();
        const page = await browser.newPage({
            viewport: { width: 794, height: 1123 },
            deviceScaleFactor: job.data.quality === 'high' ? 2 : 1,
        });
        try {
            await page.route('**/*', (route) => {
                const resourceType = route.request().resourceType();
                if (resourceType === 'image' || resourceType === 'font' || resourceType === 'stylesheet') {
                    return route.continue();
                }
                if (resourceType === 'script') {
                    const urlLower = route.request().url().toLowerCase();
                    if (urlLower.includes('analytics') ||
                        urlLower.includes('sentry') ||
                        urlLower.includes('gtag') ||
                        urlLower.includes('google-analytics') ||
                        urlLower.includes('googletagmanager') ||
                        urlLower.includes('hotjar') ||
                        urlLower.includes('clarity') ||
                        urlLower.includes('facebook') ||
                        urlLower.includes('tiktok')) {
                        return route.abort();
                    }
                    return route.continue();
                }
                return route.continue();
            });
            await page.goto(renderUrl, { waitUntil: 'domcontentloaded', timeout: GOTO_TIMEOUT_MS });
            await updateJob(jobId, { progress: 35 });
            await page.waitForFunction(() => window
                .__PDF_EXPORT_READY === true, null, { timeout: READY_TIMEOUT_MS });
            const pageCount = await page
                .locator('.catalog-page-wrapper')
                .count()
                .catch(() => null);
            await updateJob(jobId, { progress: 50, page_count: pageCount });
            await page.waitForFunction(() => {
                const images = Array.from(document.querySelectorAll('img'));
                if (images.length === 0)
                    return true;
                return images.every((img) => img.complete);
            }, null, { timeout: READY_TIMEOUT_MS });
            await updateJob(jobId, { progress: 70 });
            phase = 'rendering-pdf';
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: true,
                margin: { top: '0', right: '0', bottom: '0', left: '0' },
            });
            const catalogName = await getCatalogExportName(catalogId, userId);
            const relativePath = (0, pdf_export_storage_1.getPdfExportRelativePath)({
                jobId,
                catalogName: catalogName?.name,
                catalogSlug: catalogName?.share_slug,
            });
            await updateJob(jobId, { progress: 90 });
            phase = 'uploading-r2';
            const { key, storagePath, size } = await (0, pdf_export_storage_1.writePdfExportFile)(relativePath, pdfBuffer);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            console.log(`[pdf-export-worker] uploaded ${jobId} to R2 key=${key} size=${size}`);
            phase = 'finalizing-job';
            await updateJobWithRetry(jobId, {
                status: 'completed',
                progress: 100,
                file_path: storagePath,
                error_message: null,
            });
            await updateJobWithRetry(jobId, {
                file_size_bytes: size,
                completed_at: new Date().toISOString(),
                expires_at: expiresAt,
            }).catch((error) => {
                console.error(`[pdf-export-worker] metadata update failed for completed job ${jobId}: ${getErrorMessage(error)}`);
            });
            browserCrashCount = 0;
        }
        finally {
            await page.close().catch(() => undefined);
        }
    }
    catch (error) {
        const errorMessage = getErrorMessage(error);
        const browserFailed = /browser.*closed|target.*closed|browser.*crash/i.test(errorMessage);
        if (browserFailed)
            browserCrashCount++;
        if (browserCrashCount >= MAX_BROWSER_CRASHES || browserFailed) {
            await recoverBrowser();
        }
        await updateJob(jobId, {
            status: 'failed',
            progress: 0,
            error_message: `${phase}: ${errorMessage}`.slice(0, 1000),
        }).catch(() => undefined);
        throw new Error(`[${phase}] ${errorMessage}`);
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
    await recoverBrowser();
    await worker.close();
    process.exit(0);
}
process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());
void worker.waitUntilReady().then(async () => {
    const origin = await discoverFrontendOrigin();
    console.log(`[pdf-export-worker] ready — frontend: ${origin}`);
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
