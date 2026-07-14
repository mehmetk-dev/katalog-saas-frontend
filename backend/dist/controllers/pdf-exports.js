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
const PDF_EXPORT_PRODUCT_SELECT = [
    'id',
    'sku',
    'name',
    'description',
    'price',
    'category',
    'image_url',
    'images',
    'product_url',
    'custom_attributes',
].join(',');
const PRODUCT_FETCH_CHUNK_SIZE = 75;
const PRODUCT_FETCH_CONCURRENCY = 4;
const PDF_PUBLIC_LINK_TTL_SECONDS = 7 * 24 * 60 * 60;
function getRequestUserId(req) {
    return req.user.id;
}
function buildDownloadFilename(catalog, jobId) {
    const raw = typeof catalog?.name === 'string' && catalog.name.trim() ? catalog.name : `catalog-${jobId}`;
    const safe = raw
        .replace(/[^\w\-. ]+/g, '_')
        .slice(0, 80)
        .trim() || `catalog-${jobId}`;
    return `${safe}.pdf`;
}
function getPublicApiBaseUrl(req) {
    const configured = process.env.PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (configured?.trim())
        return configured.trim().replace(/\/$/, '');
    const fallback = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
    if (fallback?.trim())
        return `${fallback.trim().replace(/\/$/, '')}/api/v1`;
    const forwardedHost = req.get('x-forwarded-host')?.split(',')[0]?.trim();
    const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const host = forwardedHost || req.get('host') || '';
    const protocol = forwardedProto || req.protocol;
    console.warn(`[pdf-exports] PUBLIC_API_URL not set, falling back to request host: ${host}`);
    return `${protocol}://${host}/api/v1`;
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
    const chunks = [];
    for (let i = 0; i < uniqueIds.length; i += PRODUCT_FETCH_CHUNK_SIZE) {
        chunks.push(uniqueIds.slice(i, i + PRODUCT_FETCH_CHUNK_SIZE));
    }
    async function fetchChunk(chunk) {
        const { data, error } = await supabase_1.supabase
            .from('products')
            .select(PDF_EXPORT_PRODUCT_SELECT)
            .eq('user_id', userId)
            .in('id', chunk);
        if (error)
            throw error;
        return (data || []);
    }
    const products = [];
    for (let i = 0; i < chunks.length; i += PRODUCT_FETCH_CONCURRENCY) {
        const batch = chunks.slice(i, i + PRODUCT_FETCH_CONCURRENCY);
        const results = await Promise.all(batch.map(fetchChunk));
        for (const result of results) {
            products.push(...result);
        }
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
            return res
                .status(400)
                .json({ error: parsed.error.errors[0]?.message || 'Invalid export payload' });
        }
        const catalog = await getOwnedCatalog(parsed.data.catalogId, userId);
        if (!catalog) {
            return res.status(404).json({ error: 'Katalog bulunamadı veya yetkiniz yok.' });
        }
        const productIds = Array.isArray(catalog.product_ids)
            ? catalog.product_ids
            : [];
        if (productIds.length === 0) {
            return res.status(400).json({ error: 'Boş katalog için PDF üretilemez.' });
        }
        const { data: activeJobs, error: activeError } = await supabase_1.supabase
            .from('pdf_export_jobs')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['queued', 'processing'])
            .order('created_at', { ascending: false })
            .limit(5);
        if (activeError)
            throw activeError;
        const matchingActiveJob = activeJobs?.find((job) => job.catalog_id === parsed.data.catalogId);
        if (matchingActiveJob) {
            return res.status(200).json({ job: matchingActiveJob, reused: true });
        }
        if (activeJobs?.[0]) {
            return res.status(409).json({
                error: 'Devam eden başka bir PDF export işi var. Lütfen tamamlanmasını bekleyin.',
            });
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
            return res
                .status(403)
                .json({ error: 'Yüksek kalite PDF için Plus veya Pro plan gerekir.' });
        }
        // Atomic increment to prevent race condition on concurrent exports
        const { data: updatedUser, error: incError } = await supabase_1.supabase
            .from('users')
            .update({ exports_used: used + 1 })
            .eq('id', userId)
            .eq('exports_used', used)
            .select('id')
            .single();
        if (incError || !updatedUser) {
            return res.status(409).json({
                error: 'Aynı anda başka bir export işlemi devam ediyor. Lütfen tekrar deneyin.',
            });
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
    if (job.status !== 'completed' || !job.file_path) {
        console.warn(`[pdf-exports] buildSignedUrl: job=${job.id} not ready (status=${job.status} file_path=${job.file_path ? 'set' : 'null'})`);
        return null;
    }
    if (job.expires_at && new Date(job.expires_at).getTime() < Date.now()) {
        console.warn(`[pdf-exports] buildSignedUrl: job=${job.id} expired at ${job.expires_at}`);
        return null;
    }
    let catalog;
    try {
        catalog = await getOwnedCatalog(job.catalog_id, job.user_id);
    }
    catch (error) {
        console.warn(`[pdf-exports] buildSignedUrl: catalog lookup failed for job=${job.id} catalogId=${job.catalog_id}:`, error instanceof Error ? error.message : error);
        // Continue with null catalog — use fallback filename
    }
    try {
        const filename = buildDownloadFilename(catalog, job.id);
        console.log(`[pdf-exports] buildSignedUrl: generating signed URL for job=${job.id} filePath=${job.file_path} filename=${filename} ttlSeconds=${ttlSeconds}`);
        return await (0, pdf_export_storage_1.getPdfExportSignedUrl)(job.file_path, {
            ttlSeconds,
            downloadFilename: filename,
        });
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`[pdf-exports] buildSignedUrl: signed URL generation FAILED for job=${job.id} filePath=${job.file_path}: ${errMsg}`);
        throw new Error(`PDF indirme linki oluşturulamadı: ${errMsg}`);
    }
}
async function downloadPdfExport(req, res) {
    try {
        const userId = getRequestUserId(req);
        const jobId = req.params.id;
        const job = await getOwnedJob(jobId, userId);
        if (!job) {
            console.warn(`[pdf-exports] download: job=${jobId} not found for user=${userId}`);
            return res.status(404).json({ error: 'PDF export bulunamadı.' });
        }
        if (job.status !== 'completed' || !job.file_path) {
            console.warn(`[pdf-exports] download: job=${jobId} status=${job.status} file_path=${job.file_path ? 'set' : 'null'}`);
            return res.status(409).json({ error: 'PDF henüz hazır değil.' });
        }
        if (job.expires_at && new Date(job.expires_at).getTime() < Date.now()) {
            console.warn(`[pdf-exports] download: job=${jobId} expired at ${job.expires_at}`);
            return res.status(410).json({ error: 'PDF indirme linkinin süresi doldu.' });
        }
        const signedUrl = await buildSignedUrlForJob(job, 15 * 60);
        if (!signedUrl) {
            console.error(`[pdf-exports] download: buildSignedUrlForJob returned null for job=${jobId}`);
            return res.status(404).json({ error: 'PDF dosyası bulunamadı.' });
        }
        return res.redirect(302, signedUrl);
    }
    catch (error) {
        const errMsg = (0, safe_error_1.safeErrorMessage)(error);
        console.error(`[pdf-exports] download error for job=${req.params.id}:`, error instanceof Error ? error.message : error);
        return res.status(500).json({ error: errMsg });
    }
}
async function getPdfExportShareLink(req, res) {
    try {
        const userId = getRequestUserId(req);
        const jobId = req.params.id;
        const job = await getOwnedJob(jobId, userId);
        if (!job) {
            console.error(`[pdf-exports] share-link 404: job=${jobId} not found for user=${userId}`);
            return res.status(404).json({ error: 'PDF export bulunamadı.' });
        }
        if (job.status !== 'completed' || !job.file_path) {
            console.warn(`[pdf-exports] share-link 409: job=${jobId} status=${job.status} file_path=${job.file_path ? 'set' : 'null'}`);
            return res.status(409).json({ error: 'PDF henüz hazır değil.' });
        }
        const token = (0, pdf_export_token_1.createPdfExportToken)(job.id, PDF_PUBLIC_LINK_TTL_SECONDS * 1000);
        const publicUrl = `${getPublicApiBaseUrl(req)}/pdf-exports/${encodeURIComponent(job.id)}/public-download?token=${encodeURIComponent(token)}`;
        return res.json({
            url: publicUrl,
            expiresAt: new Date(Date.now() + PDF_PUBLIC_LINK_TTL_SECONDS * 1000).toISOString(),
        });
    }
    catch (error) {
        console.error(`[pdf-exports] share-link error for job=${req.params.id}:`, error instanceof Error ? error.message : error);
        return res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
}
async function publicDownloadPdfExport(req, res) {
    try {
        const jobId = req.params.id;
        if (!(0, pdf_export_token_1.verifyPdfExportToken)(jobId, req.query.token)) {
            console.warn(`[pdf-exports] public-download: token verification failed for job=${jobId}`);
            return res.status(403).json({ error: 'Forbidden' });
        }
        const { data: job, error } = await supabase_1.supabase
            .from('pdf_export_jobs')
            .select('*')
            .eq('id', jobId)
            .single();
        if (error || !job) {
            console.warn(`[pdf-exports] public-download: job=${jobId} not found in DB`);
            return res.status(404).json({ error: 'PDF export bulunamadı.' });
        }
        const typedJob = job;
        if (typedJob.status !== 'completed' || !typedJob.file_path) {
            console.warn(`[pdf-exports] public-download: job=${jobId} status=${typedJob.status} file_path=${typedJob.file_path ? 'set' : 'null'}`);
            return res.status(409).json({ error: 'PDF henüz hazır değil.' });
        }
        if (typedJob.expires_at && new Date(typedJob.expires_at).getTime() < Date.now()) {
            console.warn(`[pdf-exports] public-download: job=${jobId} expired at ${typedJob.expires_at}`);
            return res.status(410).json({ error: 'PDF indirme linkinin süresi doldu.' });
        }
        const signedUrl = await buildSignedUrlForJob(typedJob, 15 * 60);
        if (!signedUrl) {
            console.error(`[pdf-exports] public-download: buildSignedUrlForJob returned null for job=${jobId}`);
            return res.status(404).json({ error: 'PDF dosyası bulunamadı.' });
        }
        return res.redirect(302, signedUrl);
    }
    catch (error) {
        const errMsg = (0, safe_error_1.safeErrorMessage)(error);
        console.error(`[pdf-exports] public-download error for job=${req.params.id}:`, error instanceof Error ? error.message : error);
        return res.status(500).json({ error: errMsg });
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
        if (jobError || !job) {
            console.error(`[pdf-exports] render-data: job not found id=${jobId}`, jobError?.message);
            return res.status(404).json({ error: 'PDF export bulunamadı.' });
        }
        if (job.status !== 'processing' && job.status !== 'queued') {
            console.warn(`[pdf-exports] render-data: job=${jobId} status=${job.status} (expected processing/queued)`);
        }
        const catalog = await getOwnedCatalog(job.catalog_id, job.user_id);
        if (!catalog)
            return res.status(404).json({ error: 'Katalog bulunamadı.' });
        const productIds = Array.isArray(catalog.product_ids) ? catalog.product_ids.map(String) : [];
        const [products, userResult] = await Promise.all([
            getProductsForCatalog(String(job.user_id), productIds),
            supabase_1.supabase
                .from('users')
                .select('id,email,full_name,company,plan,exports_used,logo_url')
                .eq('id', job.user_id)
                .single(),
        ]);
        return res.json({
            job,
            catalog,
            products,
            user: userResult.data,
        });
    }
    catch (error) {
        console.error(`[pdf-exports] render-data error for job=${req.params.id}:`, error instanceof Error ? error.message : error);
        return res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
}
