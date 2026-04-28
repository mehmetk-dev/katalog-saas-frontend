import 'dotenv/config';

import { supabase } from '../services/supabase';
import { deletePdfExportFile } from '../services/pdf-export-storage';

const CLEANUP_INTERVAL_MS = Number(process.env.PDF_EXPORT_CLEANUP_INTERVAL_MS || 60 * 60 * 1000);
const CLEANUP_BATCH_SIZE = Number(process.env.PDF_EXPORT_CLEANUP_BATCH_SIZE || 100);

interface ExpiredJobRow {
    id: string;
    file_path: string | null;
}

export async function cleanupExpiredPdfExports(): Promise<{ processed: number }> {
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
        .from('pdf_export_jobs')
        .select('id, file_path')
        .lt('expires_at', nowIso)
        .in('status', ['completed', 'failed'])
        .limit(CLEANUP_BATCH_SIZE);

    if (error) throw error;
    const rows = (data || []) as ExpiredJobRow[];
    if (rows.length === 0) return { processed: 0 };

    for (const row of rows) {
        await deletePdfExportFile(row.file_path);
        const { error: updateError } = await supabase
            .from('pdf_export_jobs')
            .update({ status: 'expired', file_path: null, file_size_bytes: null })
            .eq('id', row.id);
        if (updateError) {
            // eslint-disable-next-line no-console
            console.error(`[pdf-export-cleanup] failed to mark ${row.id} expired:`, updateError);
        }
    }

    return { processed: rows.length };
}

async function tick(): Promise<void> {
    try {
        const { processed } = await cleanupExpiredPdfExports();
        if (processed > 0) {
            // eslint-disable-next-line no-console
            console.log(`[pdf-export-cleanup] expired ${processed} job(s)`);
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[pdf-export-cleanup] tick failed:', error);
    }
}

if (require.main === module) {
    void tick();
    const timer = setInterval(() => void tick(), CLEANUP_INTERVAL_MS);
    process.on('SIGTERM', () => { clearInterval(timer); process.exit(0); });
    process.on('SIGINT', () => { clearInterval(timer); process.exit(0); });
}
