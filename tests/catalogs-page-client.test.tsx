import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { CatalogsPageClient } from '@/components/catalogs/catalogs-page-client'
import type { Catalog } from '@/lib/actions/catalogs'
import type { Product } from '@/lib/actions/products'

vi.mock('next/navigation', () => ({
    useRouter: () => ({ refresh: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}))

vi.mock('@/lib/contexts/i18n-provider', () => ({
    useTranslation: () => ({
        t: (key: string, params?: Record<string, unknown>) => {
            if (key === 'catalogs.products') return 'urun'
            if (key === 'catalogs.catalogCount') return `${params?.count}/${params?.max}`
            return key
        },
    }),
}))

vi.mock('@/lib/contexts/user-context', () => ({
    useUser: () => ({
        refreshUser: vi.fn(),
        adjustCatalogsCount: vi.fn(),
    }),
}))

vi.mock('@/components/builder/modals/upgrade-modal', () => ({
    UpgradeModal: () => null,
}))

vi.mock('@/components/catalogs/share-modal', () => ({
    ShareModal: () => null,
}))

vi.mock('@/components/builder/preview/catalog-preview', () => ({
    CatalogPreview: ({ products }: { products: Product[] }) => (
        <div data-testid="catalog-preview-products">{products.length}</div>
    ),
}))

vi.mock('@/lib/actions/catalogs', () => ({
    deleteCatalog: vi.fn(),
}))

beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
        observe() { }
        unobserve() { }
        disconnect() { }
    } as unknown as typeof ResizeObserver
})

function makeCatalog(overrides: Partial<Catalog> = {}): Catalog {
    return {
        id: 'catalog-1',
        user_id: 'user-1',
        template_id: null,
        name: 'Dergi',
        description: null,
        layout: 'magazine',
        primary_color: '#7c3aed',
        show_prices: true,
        show_descriptions: true,
        show_attributes: true,
        show_sku: true,
        show_urls: true,
        is_published: true,
        share_slug: 'dergi',
        product_ids: ['product-1'],
        columns_per_row: 3,
        background_color: '#ffffff',
        background_image: null,
        background_gradient: null,
        logo_url: null,
        logo_position: null,
        logo_size: 'medium',
        title_position: 'left',
        created_at: '2026-05-09T00:00:00.000Z',
        updated_at: '2026-05-09T00:00:00.000Z',
        ...overrides,
    }
}

function makeProduct(overrides: Partial<Product> = {}): Product {
    return {
        id: 'product-1',
        user_id: 'user-1',
        sku: null,
        name: 'Organic Tomato Ketchup',
        description: null,
        price: 3.49,
        stock: 10,
        category: null,
        image_url: null,
        images: [],
        product_url: null,
        custom_attributes: [],
        created_at: '2026-05-09T00:00:00.000Z',
        updated_at: '2026-05-09T00:00:00.000Z',
        order: 0,
        ...overrides,
    }
}

describe('CatalogsPageClient', () => {
    it('shows the selected product count from catalog product ids', () => {
        render(
            <CatalogsPageClient
                initialCatalogs={[makeCatalog()]}
                userProducts={[]}
                userPlan="plus"
            />
        )

        expect(screen.getByText('1 urun')).toBeInTheDocument()
    })

    it('passes matched selected products into the catalog preview', async () => {
        render(
            <CatalogsPageClient
                initialCatalogs={[makeCatalog()]}
                userProducts={[makeProduct()]}
                userPlan="plus"
            />
        )

        expect(await screen.findByTestId('catalog-preview-products')).toHaveTextContent('1')
    })
})
