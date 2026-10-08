import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => {
    class PdfExportApiError extends Error {
        constructor(message: string, readonly status: number, readonly code?: string) {
            super(message)
        }
    }
    return {
        PdfExportApiError,
        clientCreatePdfExportJob: vi.fn(),
        clientGetPdfExportJob: vi.fn(),
        clientGetPdfExportShareLink: vi.fn(),
        clientCancelPdfExportJob: vi.fn(async () => ({ job: { id: 'job-1', status: 'cancelled' } })),
    }
})

vi.mock('@/lib/hooks/pdf-export-client-api', () => api)
vi.mock('@/lib/contexts/i18n-provider', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), info: vi.fn(), dismiss: vi.fn(), error: vi.fn() } }))

import { usePdfExport } from '@/lib/hooks/use-pdf-export'

function job(overrides: Record<string, unknown> = {}) {
    return { id: 'job-1', status: 'processing', progress: 40, page_count: 3, started_at: '2026-10-08T00:00:00Z', error_message: null, ...overrides }
}

function setup(overrides: Partial<Parameters<typeof usePdfExport>[0]> = {}) {
    const onShowUpgradeModal = vi.fn()
    const hook = renderHook(() =>
        usePdfExport({
            catalogId: 'catalog-1',
            catalogName: 'Katalog',
            hasUnsavedChanges: false,
            canExport: () => true,
            refreshUser: async () => undefined,
            onSaveCatalog: async () => 'catalog-1',
            onShowUpgradeModal,
            ...overrides,
        }),
    )
    return { ...hook, onShowUpgradeModal }
}

describe('usePdfExport', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.clearAllMocks()
        api.clientCreatePdfExportJob.mockResolvedValue({ job: job({ status: 'queued', progress: 0, started_at: null }) })
        api.clientGetPdfExportShareLink.mockResolvedValue({ url: 'https://api.example.com/pdf', expiresAt: '2026-10-15' })
    })
    afterEach(() => vi.useRealTimers())

    it('survives a transient polling failure and completes', async () => {
        api.clientGetPdfExportJob
            .mockRejectedValueOnce(new Error('Failed to fetch'))
            .mockResolvedValueOnce({ job: job() })
            .mockResolvedValueOnce({ job: job({ status: 'completed', progress: 100 }) })
        const { result } = setup()

        await act(async () => {
            const run = result.current.handleDownloadPDF()
            await vi.advanceTimersByTimeAsync(20_000)
            await run
        })

        expect(result.current.pdfProgress.phase).toBe('done')
        expect(result.current.pdfProgress.downloadUrl).toBe('https://api.example.com/pdf')
    })

    it('gives up with a friendly message after repeated connection failures', async () => {
        api.clientGetPdfExportJob.mockRejectedValue(new Error('Failed to fetch'))
        const { result } = setup()

        await act(async () => {
            const run = result.current.handleDownloadPDF()
            await vi.advanceTimersByTimeAsync(120_000)
            await run
        })

        expect(result.current.pdfProgress.phase).toBe('error')
        expect(result.current.pdfProgress.errorMessage).toBe('pdf.connectionLost')
    })

    it('translates worker error codes instead of showing technical text', async () => {
        api.clientGetPdfExportJob.mockResolvedValue({ job: job({ status: 'failed', error_message: 'render_timeout' }) })
        const { result } = setup()

        await act(async () => {
            await result.current.handleDownloadPDF()
        })

        expect(result.current.pdfProgress.errorMessage).toBe('pdf.errorCodes.render_timeout')
    })

    it('opens the upgrade modal when the server reports the quota is used up', async () => {
        api.clientCreatePdfExportJob.mockRejectedValue(new api.PdfExportApiError('Hakkınız doldu', 403, 'quota_exceeded'))
        const { result, onShowUpgradeModal } = setup()

        await act(async () => {
            await result.current.handleDownloadPDF()
        })

        expect(onShowUpgradeModal).toHaveBeenCalled()
        expect(result.current.pdfProgress.phase).toBe('idle')
    })

    it('stops waiting and cancels when no worker picks the job up', async () => {
        api.clientGetPdfExportJob.mockResolvedValue({ job: job({ status: 'queued', progress: 0, started_at: null }) })
        const { result } = setup()

        await act(async () => {
            const run = result.current.handleDownloadPDF()
            await vi.advanceTimersByTimeAsync(11 * 60 * 1000)
            await run
        })

        expect(result.current.pdfProgress.errorMessage).toBe('pdf.stuckInQueue')
        expect(api.clientCancelPdfExportJob).toHaveBeenCalledWith('job-1')
    })
})
