import type { Request, Response } from 'express';
import { z } from 'zod';

import { supabase } from '../services/supabase';
import {
    enqueuePdfExportJob,
    isPdfExportQueueConfigured,
    removePdfExportQueueJob,
} from '../services/pdf-export-queue';
import { getPdfExportSignedUrl, pdfExportFileExists } from '../services/pdf-export-storage';
import { verifyPdfExportToken } from '../services/pdf-export-token';
import { safeErrorMessage } from '../utils/safe-error';
import type { AuthUser } from '../middlewares/auth';

const createExportSchema = z.object({
    catalogId: z.string().uuid(),
    quality: z.enum(['standard', 'high']).default('standard'),
});

type PdfExportStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired';

interface PdfExportJobRow {
    id: string;
    user_id: string;
    catalog_id: string;
    status: PdfExportStatus;
    quality: 'standard' | 'high';
    progress: number;
    page_count: number | null;
    file_path: string | null;
    file_size_bytes: number | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
    expires_at: string | null;
}

function getRequestUserId(req: Request): string {
    return (req as Request & { user: AuthUser }).user.id;
}

function buildDownloadFilename(catalog: { name?: unknown } | null | undefined, jobId: string): string {
    const raw = typeof catalog?.name === 'string' && catalog.name.trim() ? catalog.name : `catalog-${jobId}`;
    const safe = raw.replace(/[^\w\-. ]+/g, '_').slice(0, 80).trim() || `catalog-${jobId}`;
    return `${safe}.pdf`;
}

async function getOwnedCatalog(catalogId: string, userId: string) {
    const { data, error } = await supabase
        .from('catalogs')
        .select('*')
        .eq('id', catalogId)
        .eq('user_id', userId)
        .single();

    if (error || !data) return null;
    return data as Record<string, unknown>;
}

async function getOwnedJob(jobId: string, userId: string): Promise<PdfExportJobRow | null> {
    const { data, error } = await supabase
        .from('pdf_export_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', userId)
        .single();

    if (error || !data) return null;
    return data as PdfExportJobRow;
}

async function getProductsForCatalog(userId: string, productIds: string[]): Promise<Record<string, unknown>[]> {
    if (productIds.length === 0) return [];

    const uniqueIds = Array.from(new Set(productIds));
    const products: Record<string, unknown>[] = [];
    const chunkSize = 50;

    for (let i = 0; i < uniqueIds.length; i += chunkSize) {
        const chunk = uniqueIds.slice(i, i + chunkSize);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .in('id', chunk);

        if (error) throw error;
        products.push(...((data || []) as Record<string, unknown>[]));
    }

    const byId = new Map(products.map((product) => [String(product.id), product]));
    return uniqueIds
        .map((id) => byId.get(id))
        .filter((product): product is Record<string, unknown> => Boolean(product));
}

export async function createPdfExport(req: Request, res: Response) {
    try {
        if (!isPdfExportQueueConfigured()) {
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

        const productIds = Array.isArray((catalog as { product_ids?: unknown }).product_ids)
            ? ((catalog as { product_ids: unknown[] }).product_ids)
            : [];
        if (productIds.length === 0) {
            return res.status(400).json({ error: 'Boş katalog için PDF üretilemez.' });
        }

        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('plan, exports_used')
            .eq('id', userId)
            .single();
        if (profileError || !profile) {
            return res.status(403).json({ error: 'Kullanıcı planı doğrulanamadı.' });
        }
        const plan = (profile.plan as string) || 'free';
        const used = Number(profile.exports_used) || 0;
        const limit = plan === 'pro' ? Number.POSITIVE_INFINITY : plan === 'plus' ? 50 : 1;
        if (used >= limit) {
            return res.status(403).json({ error: 'Export hakkınız doldu. Planınızı yükseltin.' });
        }
        if (parsed.data.quality === 'high' && plan === 'free') {
            return res.status(403).json({ error: 'Yüksek kalite PDF için Plus veya Pro plan gerekir.' });
        }

        const { data: activeJobs, error: activeError } = await supabase
            .from('pdf_export_jobs')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['queued', 'processing'])
            .order('created_at', { ascending: false })
            .limit(1);

        if (activeError) throw activeError;
        if (activeJobs?.[0]) {
            return res.status(200).json({ job: activeJobs[0], reused: true });
        }

        const { data: job, error } = await supabase
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

        if (error || !job) throw error || new Error('PDF export job could not be created');

        try {
            await enqueuePdfExportJob({
                jobId: job.id,
                userId,
                catalogId: parsed.data.catalogId,
                quality: parsed.data.quality,
            });
        } catch (queueError) {
            await supabase
                .from('pdf_export_jobs')
                .update({ status: 'failed', error_message: 'PDF export queue unavailable' })
                .eq('id', job.id);
            throw queueError;
        }

        return res.status(202).json({ job, reused: false });
    } catch (error) {
        return res.status(500).json({ error: safeErrorMessage(error) });
    }
}

export async function listPdfExports(req: Request, res: Response) {
    try {
        const userId = getRequestUserId(req);
        const { data, error } = await supabase
            .from('pdf_export_jobs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(25);

        if (error) throw error;
        return res.json({ jobs: data || [] });
    } catch (error) {
        return res.status(500).json({ error: safeErrorMessage(error) });
    }
}

export async function getPdfExport(req: Request, res: Response) {
    try {
        const job = await getOwnedJob(req.params.id, getRequestUserId(req));
        if (!job) return res.status(404).json({ error: 'PDF export bulunamadı.' });
        return res.json({ job });
    } catch (error) {
        return res.status(500).json({ error: safeErrorMessage(error) });
    }
}

export async function cancelPdfExport(req: Request, res: Response) {
    try {
        const userId = getRequestUserId(req);
        const job = await getOwnedJob(req.params.id, userId);
        if (!job) return res.status(404).json({ error: 'PDF export bulunamadı.' });
        if (!['queued', 'processing'].includes(job.status)) {
            return res.status(409).json({ error: 'Bu export işi iptal edilemez.' });
        }

        await removePdfExportQueueJob(job.id).catch(() => undefined);
        const { data, error } = await supabase
            .from('pdf_export_jobs')
            .update({ status: 'cancelled', progress: 0 })
            .eq('id', job.id)
            .eq('user_id', userId)
            .select('*')
            .single();

        if (error) throw error;
        return res.json({ job: data });
    } catch (error) {
        return res.status(500).json({ error: safeErrorMessage(error) });
    }
}

async function buildSignedUrlForJob(job: PdfExportJobRow, ttlSeconds: number): Promise<string | null> {
    if (job.status !== 'completed' || !job.file_path) return null;
    if (job.expires_at && new Date(job.expires_at).getTime() < Date.now()) return null;
    if (!(await pdfExportFileExists(job.file_path))) return null;

    const catalog = await getOwnedCatalog(job.catalog_id, job.user_id);
    return getPdfExportSignedUrl(job.file_path, {
        ttlSeconds,
        downloadFilename: buildDownloadFilename(catalog, job.id),
    });
}

export async function downloadPdfExport(req: Request, res: Response) {
    try {
        const job = await getOwnedJob(req.params.id, getRequestUserId(req));
        if (!job) return res.status(404).json({ error: 'PDF export bulunamadı.' });
        if (job.status !== 'completed' || !job.file_path) {
            return res.status(409).json({ error: 'PDF henüz hazır değil.' });
        }
        if (job.expires_at && new Date(job.expires_at).getTime() < Date.now()) {
            return res.status(410).json({ error: 'PDF indirme linkinin süresi doldu.' });
        }
        const signedUrl = await buildSignedUrlForJob(job, 15 * 60);
        if (!signedUrl) return res.status(404).json({ error: 'PDF dosyası bulunamadı.' });
        return res.redirect(302, signedUrl);
    } catch (error) {
        return res.status(500).json({ error: safeErrorMessage(error) });
    }
}

export async function getPdfExportShareLink(req: Request, res: Response) {
    try {
        const job = await getOwnedJob(req.params.id, getRequestUserId(req));
        if (!job) return res.status(404).json({ error: 'PDF export bulunamadı.' });
        if (job.status !== 'completed' || !job.file_path) {
            return res.status(409).json({ error: 'PDF henüz hazır değil.' });
        }

        const ttlSeconds = 7 * 24 * 60 * 60;
        const signedUrl = await buildSignedUrlForJob(job, ttlSeconds);
        if (!signedUrl) return res.status(404).json({ error: 'PDF dosyası bulunamadı.' });

        return res.json({
            url: signedUrl,
            expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
        });
    } catch (error) {
        return res.status(500).json({ error: safeErrorMessage(error) });
    }
}

export async function publicDownloadPdfExport(req: Request, res: Response) {
    try {
        const jobId = req.params.id;
        if (!verifyPdfExportToken(jobId, req.query.token)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { data: job, error } = await supabase
            .from('pdf_export_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (error || !job) return res.status(404).json({ error: 'PDF export bulunamadı.' });
        const typedJob = job as PdfExportJobRow;
        if (typedJob.status !== 'completed' || !typedJob.file_path) {
            return res.status(409).json({ error: 'PDF henüz hazır değil.' });
        }
        if (typedJob.expires_at && new Date(typedJob.expires_at).getTime() < Date.now()) {
            return res.status(410).json({ error: 'PDF indirme linkinin süresi doldu.' });
        }

        const signedUrl = await buildSignedUrlForJob(typedJob, 15 * 60);
        if (!signedUrl) return res.status(404).json({ error: 'PDF dosyası bulunamadı.' });
        return res.redirect(302, signedUrl);
    } catch (error) {
        return res.status(500).json({ error: safeErrorMessage(error) });
    }
}

export async function getPdfExportRenderData(req: Request, res: Response) {
    try {
        const jobId = req.params.id;
        if (!verifyPdfExportToken(jobId, req.query.token)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { data: job, error: jobError } = await supabase
            .from('pdf_export_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (jobError || !job) return res.status(404).json({ error: 'PDF export bulunamadı.' });

        const catalog = await getOwnedCatalog(job.catalog_id, job.user_id);
        if (!catalog) return res.status(404).json({ error: 'Katalog bulunamadı.' });

        const productIds = Array.isArray(catalog.product_ids) ? catalog.product_ids.map(String) : [];
        const products = await getProductsForCatalog(String(job.user_id), productIds);

        const { data: user } = await supabase
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
    } catch (error) {
        return res.status(500).json({ error: safeErrorMessage(error) });
    }
}
