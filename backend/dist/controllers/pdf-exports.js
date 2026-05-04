"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPdfExport = createPdfExport;
exports.listPdfExports = listPdfExports;
exports.getPdfExport = getPdfExport;
exports.cancelPdfExport = cancelPdfExport;
exports.downloadPdfExport = downloadPdfExport;
exports.getPdfExportShareLink = getPdfExportShareLink;
exports.publicDownloadPdfExport = publicDownloadPdfExport;
exports.getPdfExportRenderData = getPdfExportRenderData;
const zod_1 = require("zod");
const supabase_1 = require("../services/supabase");
const pdf_export_queue_1 = require("../services/pdf-export-queue");
const pdf_export_storage_1 = require("../services/pdf-export-storage");
const pdf_export_token_1 = require("../services/pdf-export-token");
const safe_error_1 = require("../utils/safe-error");
const createExportSchema = zod_1.z.object({
    catalogId: zod_1.z.string().uuid(),
    quality: zod_1.z.enum(['standard', 'high']).default('standard'),
});
function getRequestUserId(req) {
    return req.user.id;
}
function buildDownloadFilename(catalog, jobId) {
    const raw = typeof catalog?.name === 'string' && catalog.name.trim() ? catalog.name : `catalog-${jobId}`;
    const safe = raw.replace(/[^\w\-. ]+/g, '_').slice(0, 80).trim() || `catalog-${jobId}`;
    return `${safe}.pdf`;
}
async function getOwnedCatalog(catalogId, userId) {
    const { data, error } = await supabase_1.supabase
        .from('catalogs')
        .select('*')
        .eq('id', catalogId)
        .eq('user_id', userId)
        .single();
    if (error || !data)
        return null;
    return data;
}
async function getOwnedJob(jobId, userId) {
    const { data, error } = await supabase_1.supabase
        .from('pdf_export_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', userId)
        .single();
    if (error || !data)
        return null;
    return data;
}
async function getProductsForCatalog(userId, productIds) {
    if (productIds.length === 0)
        return [];
    const uniqueIds = Array.from(new Set(productIds));
    const products = [];
    const chunkSize = 50;
    for (let i = 0; i < uniqueIds.length; i += chunkSize) {
        const chunk = uniqueIds.slice(i, i + chunkSize);
        const { data, error } = await supabase_1.supabase
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .in('id', chunk);
        if (error)
            throw error;
        products.push(...(data || []));
    }
    const byId = new Map(products.map((product) => [String(product.id), product]));
    return uniqueIds
        .map((id) => byId.get(id))
        .filter((product) => Boolean(product));
}
async function createPdfExport(req, res) {
    try {
        if (!(0, pdf_export_queue_1.isPdfExportQueueConfigured)()) {
            return res.status(503).json({ error: 'PDF export queue is not configured.' });
        }
        const userId = getRequestUserId(req);
        const parsed = createExportSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid export payload' });
        }
        const catalog = await getOwnedCatalog(parsed.data.catalogId, userId);
        if (!catalog) {
            return res.status(404).json({ error: 'Katalog bulunamadı veya yetkiniz yok.' });
        }
        const productIds = Array.isArray(catalog.product_ids)
            ? (catalog.product_ids)
            : [];
        if (productIds.length === 0) {
            return res.status(400).json({ error: 'Boş katalog için PDF üretilemez.' });
        }
        const { data: profile, error: profileError } = await supabase_1.supabase
            .from('users')
            .select('plan, exports_used')
            .eq('id', userId)
            .single();
        if (profileError || !profile) {
            return res.status(403).json({ error: 'Kullanıcı planı doğrulanamadı.' });
        }
        const plan = profile.plan || 'free';
        const used = Number(profile.exports_used) || 0;
        const limit = plan === 'pro' ? Number.POSITIVE_INFINITY : plan === 'plus' ? 50 : 1;
        if (used >= limit) {
            return res.status(403).json({ error: 'Export hakkınız doldu. Planınızı yükseltin.' });
        }
        if (parsed.data.quality === 'high' && plan === 'free') {
            return res.status(403).json({ error: 'Yüksek kalite PDF için Plus veya Pro plan gerekir.' });
        }
        const { data: activeJobs, error: activeError } = await supabase_1.supabase
            .from('pdf_export_jobs')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['queued', 'processing'])
            .order('created_at', { ascending: false })
            .limit(1);
        if (activeError)
            throw activeError;
        if (activeJobs?.[0]) {
            return res.status(200).json({ job: activeJobs[0], reused: true });
        }
        const { data: job, error } = await supabase_1.supabase
            .from('pdf_export_jobs')
            .insert({
            user_id: userId,
            catalog_id: parsed.data.catalogId,
            quality: parsed.data.quality,
            status: 'queued',
            progress: 0,
        })
            .select('*')
            .single();
        if (error || !job)
            throw error || new Error('PDF export job could not be created');
        try {
            await (0, pdf_export_queue_1.enqueuePdfExportJob)({
                jobId: job.id,
                userId,
                catalogId: parsed.data.catalogId,
                quality: parsed.data.quality,
            });
        }
        catch (queueError) {
            await supabase_1.supabase
                .from('pdf_export_jobs')
                .update({ status: 'failed', error_message: 'PDF export queue unavailable' })
                .eq('id', job.id);
            throw queueError;
        }
        return res.status(202).json({ job, reused: false });
    }
    catch (error) {
        return res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
}
async function listPdfExports(req, res) {
    try {
        const userId = getRequestUserId(req);
        const { data, error } = await supabase_1.supabase
            .from('pdf_export_jobs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(25);
        if (error)
            throw error;
        return res.json({ jobs: data || [] });
    }
    catch (error) {
        return res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
}
async function getPdfExport(req, res) {
    try {
        const job = await getOwnedJob(req.params.id, getRequestUserId(req));
        if (!job)
            return res.status(404).json({ error: 'PDF export bulunamadı.' });
        return res.json({ job });
    }
    catch (error) {
        return res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
}
async function cancelPdfExport(req, res) {
    try {
        const userId = getRequestUserId(req);
        const job = await getOwnedJob(req.params.id, userId);
        if (!job)
            return res.status(404).json({ error: 'PDF export bulunamadı.' });
        if (!['queued', 'processing'].includes(job.status)) {
            return res.status(409).json({ error: 'Bu export işi iptal edilemez.' });
        }
        await (0, pdf_export_queue_1.removePdfExportQueueJob)(job.id).catch(() => undefined);
        const { data, error } = await supabase_1.supabase
            .from('pdf_export_jobs')
            .update({ status: 'cancelled', progress: 0 })
            .eq('id', job.id)
            .eq('user_id', userId)
            .select('*')
            .single();
        if (error)
            throw error;
        return res.json({ job: data });
    }
    catch (error) {
        return res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
}
async function buildSignedUrlForJob(job, ttlSeconds) {
    if (job.status !== 'completed' || !job.file_path)
        return null;
    if (job.expires_at && new Date(job.expires_at).getTime() < Date.now())
        return null;
    if (!(await (0, pdf_export_storage_1.pdfExportFileExists)(job.file_path)))
        return null;
    const catalog = await getOwnedCatalog(job.catalog_id, job.user_id);
    return (0, pdf_export_storage_1.getPdfExportSignedUrl)(job.file_path, {
        ttlSeconds,
        downloadFilename: buildDownloadFilename(catalog, job.id),
    });
}
async function downloadPdfExport(req, res) {
    try {
        const job = await getOwnedJob(req.params.id, getRequestUserId(req));
        if (!job)
            return res.status(404).json({ error: 'PDF export bulunamadı.' });
        if (job.status !== 'completed' || !job.file_path) {
            return res.status(409).json({ error: 'PDF henüz hazır değil.' });
        }
        if (job.expires_at && new Date(job.expires_at).getTime() < Date.now()) {
            return res.status(410).json({ error: 'PDF indirme linkinin süresi doldu.' });
        }
        const signedUrl = await buildSignedUrlForJob(job, 15 * 60);
        if (!signedUrl)
            return res.status(404).json({ error: 'PDF dosyası bulunamadı.' });
        return res.redirect(302, signedUrl);
    }
    catch (error) {
        return res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
}
async function getPdfExportShareLink(req, res) {
    try {
        const job = await getOwnedJob(req.params.id, getRequestUserId(req));
        if (!job)
            return res.status(404).json({ error: 'PDF export bulunamadı.' });
        if (job.status !== 'completed' || !job.file_path) {
            return res.status(409).json({ error: 'PDF henüz hazır değil.' });
        }
        const ttlSeconds = 7 * 24 * 60 * 60;
        const signedUrl = await buildSignedUrlForJob(job, ttlSeconds);
        if (!signedUrl)
            return res.status(404).json({ error: 'PDF dosyası bulunamadı.' });
        return res.json({
            url: signedUrl,
            expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
        });
    }
    catch (error) {
        return res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
}
async function publicDownloadPdfExport(req, res) {
    try {
        const jobId = req.params.id;
        if (!(0, pdf_export_token_1.verifyPdfExportToken)(jobId, req.query.token)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const { data: job, error } = await supabase_1.supabase
            .from('pdf_export_jobs')
            .select('*')
            .eq('id', jobId)
            .single();
        if (error || !job)
            return res.status(404).json({ error: 'PDF export bulunamadı.' });
        const typedJob = job;
        if (typedJob.status !== 'completed' || !typedJob.file_path) {
            return res.status(409).json({ error: 'PDF henüz hazır değil.' });
        }
        if (typedJob.expires_at && new Date(typedJob.expires_at).getTime() < Date.now()) {
            return res.status(410).json({ error: 'PDF indirme linkinin süresi doldu.' });
        }
        const signedUrl = await buildSignedUrlForJob(typedJob, 15 * 60);
        if (!signedUrl)
            return res.status(404).json({ error: 'PDF dosyası bulunamadı.' });
        return res.redirect(302, signedUrl);
    }
    catch (error) {
        return res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
}
async function getPdfExportRenderData(req, res) {
    try {
        const jobId = req.params.id;
        if (!(0, pdf_export_token_1.verifyPdfExportToken)(jobId, req.query.token)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const { data: job, error: jobError } = await supabase_1.supabase
            .from('pdf_export_jobs')
            .select('*')
            .eq('id', jobId)
            .single();
        if (jobError || !job)
            return res.status(404).json({ error: 'PDF export bulunamadı.' });
        const catalog = await getOwnedCatalog(job.catalog_id, job.user_id);
        if (!catalog)
            return res.status(404).json({ error: 'Katalog bulunamadı.' });
        const productIds = Array.isArray(catalog.product_ids) ? catalog.product_ids.map(String) : [];
        const products = await getProductsForCatalog(String(job.user_id), productIds);
        const { data: user } = await supabase_1.supabase
            .from('users')
            .select('id,email,full_name,company,plan,exports_used,logo_url')
            .eq('id', job.user_id)
            .single();
        return res.json({
            job,
            catalog,
            products,
            user,
        });
    }
    catch (error) {
        return res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
}
