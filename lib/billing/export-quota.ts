import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * PDF indirme hakkı her takvim ayında yenilenir (Türkiye saati, UTC+3; 2016'dan beri yaz saati yok).
 * Kullanım, ay içinde tamamlanan PDF işlerinden sayılır (pdf_export_jobs.quota_consumed_at);
 * işler silinmediği (süresi dolunca yalnızca "expired" olduğu) için sayım güvenilirdir.
 * Backend aynı hesabı backend/src/services/pdf-export-quota.ts içinde yapar.
 */
const TURKEY_UTC_OFFSET_MS = 3 * 60 * 60 * 1000

export function getExportQuotaPeriodStart(now: Date = new Date()): Date {
    const local = new Date(now.getTime() + TURKEY_UTC_OFFSET_MS)
    return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - TURKEY_UTC_OFFSET_MS)
}

export function getNextExportQuotaReset(now: Date = new Date()): Date {
    const local = new Date(now.getTime() + TURKEY_UTC_OFFSET_MS)
    return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1) - TURKEY_UTC_OFFSET_MS)
}

export async function countMonthlyExports(supabase: SupabaseClient, userId: string, now: Date = new Date()): Promise<number> {
    const { count, error } = await supabase
        .from("pdf_export_jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("quota_consumed_at", getExportQuotaPeriodStart(now).toISOString())

    if (error) throw error
    return count ?? 0
}
