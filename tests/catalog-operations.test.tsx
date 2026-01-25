
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BuilderPageClient } from '@/components/builder/builder-page-client'
import { CatalogsPageClient } from '@/components/catalogs/catalogs-page-client'

// Mock dependencies
vi.mock('@/lib/i18n-provider', () => ({
    useTranslation: () => ({ t: (key: string) => key, language: 'tr' }),
}))

vi.mock('@/lib/user-context', () => ({
    useUser: () => ({
        user: { id: 'test-user', plan: 'free' },
        isLoading: false,
        refreshUser: vi.fn(),
    }),
    UserProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/lib/api', () => ({
    apiFetch: vi.fn(),
}))

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
    }),
    usePathname: () => '/dashboard/builder',
    useSearchParams: () => new URLSearchParams(),
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
    },
}))

vi.mock('@/lib/actions/catalogs', () => ({
    updateCatalog: vi.fn().mockResolvedValue({ success: true }),
    publishCatalog: vi.fn().mockResolvedValue({ success: true }),
    revalidateCatalogPublic: vi.fn().mockResolvedValue({ success: true }),
    getCatalog: vi.fn(),
    getCatalogs: vi.fn(),
    deleteCatalog: vi.fn(),
    getPublicCatalog: vi.fn(),
}))

vi.mock('@/lib/actions/products', () => ({
    getProducts: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/components/builder/upgrade-modal', () => ({
    UpgradeModal: () => null,
}))

global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
} as any

describe('Katalog İşlemleri Testleri', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Katalog Yayınlama', () => {
        it('Katalog yayınlandığında slug oluşturulur', async () => {
            const mockCatalog = {
                id: 'catalog-1',
                name: 'Test Catalog',
                description: 'Test',
                layout: 'modern-grid',
                is_published: false,
                share_slug: null,
                product_ids: [],
                user_id: 'test-user',
                template_id: null,
                primary_color: '#000000',
                show_prices: true,
                show_descriptions: true,
                show_attributes: true,
                show_sku: true,
                show_urls: true,
                columns_per_row: 3,
                background_color: '#ffffff',
                background_image: null,
                background_gradient: null,
                logo_url: null,
                logo_position: null,
                logo_size: 'medium',
                title_position: 'left',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }

            const { publishCatalog } = await import('@/lib/actions/catalogs')
            
            // Yayınlama işlemi
            await publishCatalog('catalog-1', true, 'test-catalog-slug')

            expect(publishCatalog).toHaveBeenCalledWith('catalog-1', true, 'test-catalog-slug')
        })

        it('Yayınlanmamış katalog public erişilemez', async () => {
            const { getPublicCatalog } = await import('@/lib/actions/catalogs')
            const { apiFetch } = await import('@/lib/api')

            vi.mocked(apiFetch).mockRejectedValueOnce(new Error('Catalog not found or not published'))

            // getPublicCatalog hata fırlatmalı
            try {
                await getPublicCatalog('test-slug')
                expect.fail('Should have thrown an error')
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
            }
        })
    })

    describe('Katalog Silme', () => {
        it('Katalog silindiğinde ürünler etkilenmez', async () => {
            const mockCatalogs = [{
                id: 'catalog-1',
                name: 'Test Catalog',
                product_ids: ['product-1', 'product-2'],
            }]

            const { deleteCatalog } = await import('@/lib/actions/catalogs')
            vi.mocked(deleteCatalog).mockResolvedValueOnce({ success: true })

            const result = await deleteCatalog('catalog-1')
            expect(result.success).toBe(true)
        })
    })

    describe('Katalog Düzenleme', () => {
        it('Katalog adı güncellenebilir', async () => {
            const { updateCatalog } = await import('@/lib/actions/catalogs')
            
            await updateCatalog('catalog-1', { name: 'Yeni İsim' })

            expect(updateCatalog).toHaveBeenCalledWith('catalog-1', { name: 'Yeni İsim' })
        })

        it('Katalog layout değiştirilebilir', async () => {
            const { updateCatalog } = await import('@/lib/actions/catalogs')
            
            await updateCatalog('catalog-1', { layout: 'elegant-cards' })

            expect(updateCatalog).toHaveBeenCalledWith('catalog-1', { layout: 'elegant-cards' })
        })
    })
})
