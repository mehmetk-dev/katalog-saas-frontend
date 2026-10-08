/**
 * PDF export işinin yaşam döngüsü kuralları (worker ve API ortak kullanır).
 * DB'de `error_message` alanına kullanıcıya gösterilecek kısa bir hata KODU yazılır;
 * teknik ayrıntı yalnızca loglara gider. Frontend kodu çevirir (pdf.errorCodes.*).
 */

export type PdfExportErrorCode =
    | 'render_timeout'
    | 'asset_timeout'
    | 'render_failed'
    | 'storage_failed'
    | 'catalog_missing'
    | 'worker_stalled'
    | 'queue_unavailable'
    | 'unknown'

/** İş kullanıcı tarafından iptal edildi (veya silindi); worker sessizce durmalı, yeniden denememeli. */
export class PdfExportJobCancelledError extends Error {
    constructor(jobId: string) {
        super(`PDF export job ${jobId} is no longer active`)
        this.name = 'PdfExportJobCancelledError'
    }
}

export const ACTIVE_PDF_EXPORT_STATUSES = ['queued', 'processing'] as const

/** BullMQ kilidi (30 dk) + pay: bu süreden uzun güncellenmeyen aktif iş takılmış sayılır. */
export const PDF_EXPORT_STALE_AFTER_MS = 40 * 60 * 1000

export function isStaleActiveJob(job: { status: string; updated_at: string }, now = Date.now()): boolean {
    if (!(ACTIVE_PDF_EXPORT_STATUSES as readonly string[]).includes(job.status)) return false
    const updatedAt = new Date(job.updated_at).getTime()
    return Number.isFinite(updatedAt) && now - updatedAt > PDF_EXPORT_STALE_AFTER_MS
}

export function isFinalAttempt(job: { attemptsMade: number; opts?: { attempts?: number } }): boolean {
    const maxAttempts = Math.max(1, job.opts?.attempts ?? 1)
    return job.attemptsMade + 1 >= maxAttempts
}

export function classifyPdfExportFailure(phase: string, message: string): PdfExportErrorCode {
    if (phase === 'loading-render-page' && /404|not found/i.test(message)) return 'catalog_missing'
    if (phase === 'waiting-render-ready') return 'render_timeout'
    if (phase === 'waiting-images') return 'asset_timeout'
    if (phase === 'uploading-r2') return 'storage_failed'
    if (phase === 'loading-render-page' || phase === 'rendering-pdf') return 'render_failed'
    return 'unknown'
}
