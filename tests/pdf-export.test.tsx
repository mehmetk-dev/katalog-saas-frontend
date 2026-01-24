import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BuilderPageClient } from '@/components/builder/builder-page-client'
import { useUser } from '@/lib/user-context'
import { useRouter } from 'next/navigation'

// Mock dependencies
vi.mock('@/lib/user-context')
vi.mock('@/lib/i18n-provider', () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}))
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}))
vi.mock('sonner', () => ({
    toast: {
        loading: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        dismiss: vi.fn(),
    },
}))
vi.mock('html-to-image', () => ({
    toJpeg: vi.fn().mockResolvedValue('data:image/jpeg;base64,mockdata'),
}))
vi.mock('jspdf', () => ({
    jsPDF: vi.fn().mockImplementation(() => ({
        internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
        addPage: vi.fn(),
        addImage: vi.fn(),
        save: vi.fn(),
    })),
}))

vi.mock('@/lib/actions/user', () => ({
    incrementUserExports: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock CatalogEditor and CatalogPreview to simplify rendering
vi.mock('@/components/builder/catalog-editor', () => ({
    CatalogEditor: () => <div data-testid="catalog-editor" />
}))
vi.mock('@/components/builder/catalog-preview', () => ({
    CatalogPreview: ({ isExporting }: any) => (
        <div data-testid="catalog-preview">
            {isExporting && (
                <div id="catalog-export-container">
                    <div className="catalog-page-wrapper">Page 1</div>
                </div>
            )}
            <div id="catalog-preview-container">Preview</div>
        </div>
    )
}))

describe('BuilderPageClient PDF Export', () => {
    const mockRouter = { push: vi.fn() }

    beforeEach(() => {
        vi.clearAllMocks()
            ; (useRouter as any).mockReturnValue(mockRouter)
            ; (useUser as any).mockReturnValue({
                user: { plan: 'free', exports_remaining: 5 },
                refreshUser: vi.fn()
            })
    })

    it('should set isExporting to true and attempt PDF download', async () => {
        // Mock translate function is already handled via @/lib/i18n-provider mock

        render(<BuilderPageClient
            catalog={{
                id: '1',
                name: 'Test',
                product_ids: [],
                layout: 'modern-grid',
                user_id: 'user1',
                description: '',
                primary_color: '#000000',
                header_text_color: '#ffffff',
                show_prices: true,
                show_descriptions: true,
                show_attributes: true,
                show_sku: true,
                show_urls: true,
                created_at: '',
                updated_at: '',
                share_slug: 'test-slug',
                is_published: true
            } as any}
            products={[]}
        />)

        // Find the "More" button by title
        const moreButton = screen.getByTitle(/Daha fazla seçenek/i)
        fireEvent.click(moreButton)

        // Find "PDF İndir" menu item (Wait for it to appear in portal)
        const downloadOption = await screen.findByText(/PDF İndir/i)
        expect(downloadOption).toBeDefined()
        fireEvent.click(downloadOption)

        // expect toast.info to have been called (download starting)
        const { toast } = await import('sonner')
        await waitFor(() => {
            expect(toast.info).toHaveBeenCalledWith('builder.downloadStarting', expect.anything())
        })

        // isExporting should be true
        // We wait for the ghost container to be rendered
        await waitFor(() => {
            const ghost = document.getElementById('catalog-export-container')
            expect(ghost).not.toBeNull()
        }, { timeout: 4000 })
    })
})
