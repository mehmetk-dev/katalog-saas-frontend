"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBillingDocumentWorker = startBillingDocumentWorker;
const crypto_1 = __importDefault(require("crypto"));
const playwright_1 = require("playwright");
const billing_document_queue_1 = require("../services/billing-document-queue");
const billing_document_token_1 = require("../services/billing-document-token");
const pdf_export_storage_1 = require("../services/pdf-export-storage");
const supabase_1 = require("../services/supabase");
let browser = null;
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return 'Unknown billing document error';
}
function getFrontendOrigin() {
    return (process.env.BILLING_DOCUMENT_RENDER_ORIGIN ||
        process.env.PDF_EXPORT_RENDER_ORIGIN ||
        process.env.APP_ORIGIN ||
        'http://localhost:3000').replace(/\/$/, '');
}
async function getBrowser() {
    if (browser?.isConnected())
        return browser;
    browser = await playwright_1.chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote',
        ],
    });
    return browser;
}
async function closeBrowser() {
    if (!browser)
        return;
    await browser.close().catch(() => undefined);
    browser = null;
}
async function updateDocument(documentId, patch) {
    const { data, error } = await supabase_1.supabase
        .from('billing_documents')
        .update(patch)
        .eq('id', documentId)
        .select('id')
        .maybeSingle();
    if (error || !data) {
        throw new Error('Billing document update failed');
    }
}
async function markDocumentProcessing(documentId, attempts) {
    const { data, error } = await supabase_1.supabase
        .from('billing_documents')
        .update({
        status: 'processing',
        attempts,
        started_at: new Date().toISOString(),
        error_message: null,
    })
        .eq('id', documentId)
        .in('status', ['queued', 'processing', 'failed'])
        .select('id')
        .maybeSingle();
    if (error)
        throw new Error('Billing document processing transition failed');
    if (data)
        return true;
    const { data: existing } = await supabase_1.supabase
        .from('billing_documents')
        .select('status')
        .eq('id', documentId)
        .maybeSingle();
    if (existing?.status === 'completed')
        return false;
    throw new Error('Billing document is not renderable');
}
async function getDocumentNumber(documentId) {
    const { data, error } = await supabase_1.supabase
        .from('billing_documents')
        .select('document_number')
        .eq('id', documentId)
        .single();
    if (error || !data?.document_number) {
        throw new Error('Billing document number not found');
    }
    return String(data.document_number);
}
async function renderBillingDocument(job) {
    const { documentId } = job.data;
    let phase = 'initializing';
    try {
        phase = 'marking-processing';
        const shouldRender = await markDocumentProcessing(documentId, job.attemptsMade + 1);
        if (!shouldRender)
            return;
        const token = (0, billing_document_token_1.createBillingDocumentToken)(documentId);
        const frontendOrigin = getFrontendOrigin();
        const renderUrl = `${frontendOrigin}/export/billing/${documentId}?token=${encodeURIComponent(token)}`;
        phase = 'loading-render-page';
        const activeBrowser = await getBrowser();
        const page = await activeBrowser.newPage({
            viewport: { width: 794, height: 1123 },
            deviceScaleFactor: 1,
        });
        try {
            await page.route('**/*', (route) => {
                const requestUrl = new URL(route.request().url());
                if (requestUrl.origin !== frontendOrigin) {
                    return route.abort();
                }
                const resourceType = route.request().resourceType();
                if (['document', 'script', 'stylesheet', 'font'].includes(resourceType)) {
                    return route.continue();
                }
                return route.abort();
            });
            await page.goto(renderUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 90000,
            });
            phase = 'waiting-render-ready';
            await page.waitForFunction(() => window
                .__BILLING_DOCUMENT_READY === true, null, { timeout: 60000 });
            phase = 'rendering-pdf';
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: true,
                margin: { top: '0', right: '0', bottom: '0', left: '0' },
            });
            phase = 'uploading-r2';
            const documentNumber = await getDocumentNumber(documentId);
            const relativePath = (0, pdf_export_storage_1.getBillingDocumentRelativePath)({
                documentId,
                documentNumber,
            });
            const { storagePath, size } = await (0, pdf_export_storage_1.writeBillingDocumentFile)(relativePath, pdfBuffer);
            const sha256 = crypto_1.default.createHash('sha256').update(pdfBuffer).digest('hex');
            phase = 'finalizing-document';
            const { error } = await supabase_1.supabase.rpc('complete_billing_document', {
                p_document_id: documentId,
                p_file_path: storagePath,
                p_file_size_bytes: size,
                p_file_sha256: sha256,
            });
            if (error)
                throw new Error('Billing document completion failed');
        }
        finally {
            await page.close().catch(() => undefined);
        }
    }
    catch (error) {
        const message = getErrorMessage(error);
        await updateDocument(documentId, {
            status: 'failed',
            error_message: `${phase}: ${message}`.slice(0, 1000),
        }).catch(() => undefined);
        if (/browser.*closed|target.*closed|browser.*crash/i.test(message)) {
            await closeBrowser();
        }
        throw new Error(`[${phase}] ${message}`);
    }
}
function startBillingDocumentWorker() {
    const worker = (0, billing_document_queue_1.createBillingDocumentWorker)(renderBillingDocument);
    worker.on('completed', (job) => {
        console.log(`[billing-document-worker] completed ${job.id}`);
    });
    worker.on('failed', (job) => {
        console.error(`[billing-document-worker] failed ${job?.id}`);
    });
    return {
        close: async () => {
            await closeBrowser();
            await worker.close();
        },
    };
}
