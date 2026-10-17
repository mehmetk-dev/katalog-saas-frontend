import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => {
    class PublicPdfExportError extends Error {
        constructor(message: string, readonly status: number, readonly code?: string) {
            super(message)
        }
    }
    return {
        PublicPdfExportError,
        createPublicPdfExport: vi.fn(),
        getPublicPdfExport: vi.fn(),
        getPublicPdfDownloadUrl: vi.fn((id: string, token: string) => `/api/v1/pdf-exports/${id}/public-download?token=${token}`),
    }
})

vi.mock('@/app/catalog/[slug]/_hooks/public-pdf-export-api', () => api)
vi.mock('jspdf', () => ({ jsPDF: vi.fn() }))
vi.mock('html-to-image', () => ({ toJpeg: vi.fn() }))

import { usePublicPdfExport } from '@/app/catalog/[slug]/_hooks/use-public-pdf-export'

function job(overrides: Record<string, unknown> = {}) {
    return { id: 'job-1', status: 'processing', progress: 40, page_count: 3, error_message: null, ...overrides }
}

function setup(slug: string | null = 'katalog') {
    return renderHook(() => usePublicPdfExport({ catalogName: 'Katalog', slug, expectedPageCount: 0, t: (key) => key }))
}

describe('usePublicPdfExport', () => {
    const assign = vi.fn()

    beforeEach(() => {
        vi.useFakeTimers()
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        Object.defineProperty(window, 'location', { value: { ...window.location, assign }, writable: true })
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.clearAllMocks()
    })

    it('downloads a PDF the worker already produced without rendering pages in the browser', async () => {
        api.createPublicPdfExport.mockResolvedValue({ job: job({ status: 'completed' }), token: 'tok', reused: true })
        const { result } = setup()

        await act(async () => {
            await result.current.handleDownload()
        })

        expect(api.createPublicPdfExport).toHaveBeenCalledWith('katalog')
        expect(assign).toHaveBeenCalledWith('/api/v1/pdf-exports/job-1/public-download?token=tok')
        expect(result.current.pdfProgress.phase).toBe('done')
        expect(result.current.pdfProgress.downloadUrl).toContain('public-download')
        expect(result.current.isExporting).toBe(false)
    })

    it('polls the worker job until it completes', async () => {
        api.createPublicPdfExport.mockResolvedValue({ job: job({ status: 'queued', progress: 0 }), token: 'tok', reused: false })
        api.getPublicPdfExport.mockResolvedValueOnce({ job: job() }).mockResolvedValueOnce({ job: job({ status: 'completed' }) })
        const { result } = setup()

        let done!: Promise<void>
        act(() => {
            done = result.current.handleDownload()
        })
        await act(async () => {
            await vi.advanceTimersByTimeAsync(3000)
        })
        expect(result.current.pdfProgress.phase).toBe('rendering')
        await act(async () => {
            await vi.advanceTimersByTimeAsync(3000)
            await done
        })

        expect(api.getPublicPdfExport).toHaveBeenCalledWith('job-1', 'tok')
        expect(result.current.pdfProgress.phase).toBe('done')
        expect(assign).toHaveBeenCalledTimes(1)
    })

    it('falls back to browser rendering when the PDF service is unavailable', async () => {
        api.createPublicPdfExport.mockRejectedValue(new api.PublicPdfExportError('down', 503, 'queue_unavailable'))
        const { result } = setup()

        let done!: Promise<void>
        act(() => {
            done = result.current.handleDownload()
        })
        await act(async () => {
            await vi.advanceTimersByTimeAsync(15_000)
            await done
        })

        // Tarayıcı yoluna geçti: sayfa bulunamadığı için kendi hata mesajını verir
        expect(assign).not.toHaveBeenCalled()
        expect(result.current.pdfProgress.phase).toBe('error')
        expect(result.current.pdfProgress.errorMessage).toBe('pdf.noPagesToExport')
    })

    it('does not fall back when the catalog itself is missing', async () => {
        api.createPublicPdfExport.mockRejectedValue(new api.PublicPdfExportError('not found', 404))
        const { result } = setup()

        await act(async () => {
            await result.current.handleDownload()
        })

        expect(result.current.pdfProgress.phase).toBe('error')
        expect(result.current.pdfProgress.errorMessage).toBe('pdf.exportFailed')
    })
})
