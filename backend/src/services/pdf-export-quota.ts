import { supabase } from './supabase'

/**
 * PDF indirme hakkı her takvim ayında yenilenir (Türkiye saati, UTC+3).
 * Kullanım = bu ay tamamlanan PDF işleri (pdf_export_jobs.quota_consumed_at). İşler silinmez,
 * süresi dolunca yalnızca "expired" olur; bu yüzden sayım ay boyunca kalıcıdır.
 * Frontend aynı hesabı lib/billing/export-quota.ts içinde yapar.
 */
const TURKEY_UTC_OFFSET_MS = 3 * 60 * 60 * 1000

export const PDF_EXPORT_MONTHLY_LIMITS: Record<string, number> = {
    free: 1,
    plus: 50,
    pro: Number.POSITIVE_INFINITY,
}

export function getMonthlyExportLimit(plan: string | null | undefined): number {
    return PDF_EXPORT_MONTHLY_LIMITS[plan || 'free'] ?? PDF_EXPORT_MONTHLY_LIMITS.free
}

export function getExportQuotaPeriodStart(now: Date = new Date()): Date {
    const local = new Date(now.getTime() + TURKEY_UTC_OFFSET_MS)
    return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - TURKEY_UTC_OFFSET_MS)
}

export async function countMonthlyExports(userId: string, now: Date = new Date()): Promise<number> {
    const { count, error } = await supabase
        .from('pdf_export_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('quota_consumed_at', getExportQuotaPeriodStart(now).toISOString())

    if (error) throw error
    return count ?? 0
}
