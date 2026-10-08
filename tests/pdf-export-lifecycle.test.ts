import { describe, expect, it } from 'vitest'

import {
    PDF_EXPORT_STALE_AFTER_MS,
    classifyPdfExportFailure,
    isFinalAttempt,
    isStaleActiveJob,
} from '@/backend/src/workers/pdf-export-job-lifecycle'
import { resolvePdfExportErrorMessage } from '@/lib/pdf-export-progress'

const t = (key: string) => key

describe('PDF export job lifecycle', () => {
    it('treats only long-silent active jobs as stale', () => {
        const now = Date.parse('2026-10-08T12:00:00Z')
        const old = new Date(now - PDF_EXPORT_STALE_AFTER_MS - 1000).toISOString()
        const fresh = new Date(now - 60_000).toISOString()

        expect(isStaleActiveJob({ status: 'processing', updated_at: old }, now)).toBe(true)
        expect(isStaleActiveJob({ status: 'queued', updated_at: old }, now)).toBe(true)
        expect(isStaleActiveJob({ status: 'processing', updated_at: fresh }, now)).toBe(false)
        expect(isStaleActiveJob({ status: 'completed', updated_at: old }, now)).toBe(false)
    })

    it('marks failure as final only on the last BullMQ attempt', () => {
        expect(isFinalAttempt({ attemptsMade: 0, opts: { attempts: 2 } })).toBe(false)
        expect(isFinalAttempt({ attemptsMade: 1, opts: { attempts: 2 } })).toBe(true)
        expect(isFinalAttempt({ attemptsMade: 0 })).toBe(true)
    })

    it('maps worker phases to user-facing error codes', () => {
        expect(classifyPdfExportFailure('waiting-render-ready', 'Timeout 300000ms exceeded')).toBe('render_timeout')
        expect(classifyPdfExportFailure('waiting-images', 'Timeout')).toBe('asset_timeout')
        expect(classifyPdfExportFailure('uploading-r2', 'AccessDenied')).toBe('storage_failed')
        expect(classifyPdfExportFailure('marking-processing', 'boom')).toBe('unknown')
    })

    it('never shows technical worker messages to the user', () => {
        expect(resolvePdfExportErrorMessage('render_timeout', t)).toBe('pdf.errorCodes.render_timeout')
        expect(resolvePdfExportErrorMessage('waiting-render-ready: page.waitForFunction: Timeout 300000ms exceeded', t))
            .toBe('pdf.progressFailedDesc')
        expect(resolvePdfExportErrorMessage(null, t)).toBe('pdf.progressFailedDesc')
    })
})
