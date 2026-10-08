import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { CatalogsPageClient } from '@/components/catalogs/catalogs-page-client'
import type { Catalog } from '@/lib/actions/catalogs'
import type { Product } from '@/lib/actions/products'

const { routerMock, actionMocks } = vi.hoisted(() => ({
    routerMock: { refresh: vi.fn(), push: vi.fn() },
    actionMocks: {
        deleteCatalog: vi.fn(),
        duplicateCatalog: vi.fn(),
        updateCatalog: vi.fn(),
        createCatalog: vi.fn(),
    },
}))

vi.mock('next/navigation', () => ({
    useRouter: () => routerMock,
    useSearchParams: () => new URLSearchParams(),
}))

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}))

vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}))

vi.mock('@/lib/contexts/i18n-provider', () => ({
    useTranslation: () => ({
        t: (key: string, params?: Record<string, unknown>) => {
            if (key === 'catalogs.productCount') return `${params?.count} urun`
            if (key === 'catalogs.catalogCount') return `${params?.count}/${params?.max}`
            if (key === 'catalogs.copySuffix') return '(kopya)'
            return key
        },
        language: 'tr',
    }),
}))

vi.mock('@/lib/contexts/user-context', () => ({
    useUser: () => ({
        refreshUser: vi.fn(),
        adjustCatalogsCount: vi.fn(),
    }),
}))

vi.mock('@/components/builder/modals/upgrade-modal', () => ({
    UpgradeModal: ({ open }: { open: boolean }) => (open ? <div data-testid="upgrade-modal" /> : null),
}))

vi.mock('@/components/catalogs/share-modal', () => ({
    ShareModal: () => null,
}))

vi.mock('@/components/builder/preview/catalog-preview', () => ({
    CatalogPreview: ({ products }: { products: Product[] }) => (
        <div data-testid="catalog-preview-products">{products.length}</div>
    ),
}))

vi.mock('@/lib/actions/catalogs', () => actionMocks)

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

beforeEach(() => {
    vi.clearAllMocks()
})

async function openActions(user: ReturnType<typeof userEvent.setup>, cardName: string) {
    const card = screen.getByText(cardName).closest('article')!
    await user.click(within(card).getByRole('button', { name: 'catalogs.actions' }))
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

    it('distinguishes "no results" from "no catalogs yet"', async () => {
        const user = userEvent.setup()
        render(<CatalogsPageClient initialCatalogs={[makeCatalog()]} userProducts={[]} userPlan="plus" />)

        await user.type(screen.getByRole('searchbox'), 'yok-boyle-bir-sey')

        expect(screen.getByText('catalogs.noResults')).toBeInTheDocument()
        expect(screen.queryByText('catalogs.noCatalogsYet')).not.toBeInTheDocument()
    })

    it('filters by publish status', async () => {
        const user = userEvent.setup()
        render(
            <CatalogsPageClient
                initialCatalogs={[
                    makeCatalog({ id: 'c1', name: 'Yayindaki' }),
                    makeCatalog({ id: 'c2', name: 'Taslak Katalog', is_published: false, share_slug: null }),
                ]}
                userProducts={[]}
                userPlan="plus"
            />
        )

        await user.click(screen.getByRole('radio', { name: /catalogs.filter.draft/ }))

        expect(screen.getByText('Taslak Katalog')).toBeInTheDocument()
        expect(screen.queryByText('Yayindaki')).not.toBeInTheDocument()
    })

    it('keeps the delete dialog open and reports the error when deletion fails', async () => {
        const user = userEvent.setup()
        actionMocks.deleteCatalog.mockRejectedValueOnce(new Error('Sunucu hatasi'))
        render(<CatalogsPageClient initialCatalogs={[makeCatalog()]} userProducts={[]} userPlan="plus" />)

        await openActions(user, 'Dergi')
        await user.click(await screen.findByRole('menuitem', { name: /catalogs.delete/ }))
        await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: /catalogs.delete/ }))

        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Sunucu hatasi'))
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
        expect(screen.getAllByText('Dergi').length).toBeGreaterThan(0)
    })

    it('deletes a published catalog and revalidates its public page', async () => {
        const user = userEvent.setup()
        actionMocks.deleteCatalog.mockResolvedValueOnce({ success: true })
        render(<CatalogsPageClient initialCatalogs={[makeCatalog()]} userProducts={[]} userPlan="plus" />)

        await openActions(user, 'Dergi')
        await user.click(await screen.findByRole('menuitem', { name: /catalogs.delete/ }))
        await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: /catalogs.delete/ }))

        await waitFor(() => expect(actionMocks.deleteCatalog).toHaveBeenCalledWith('catalog-1', 'dergi'))
        await waitFor(() => expect(screen.queryByRole('article')).not.toBeInTheDocument())
    })

    it('opens the upgrade modal instead of duplicating at the plan limit', async () => {
        const user = userEvent.setup()
        render(<CatalogsPageClient initialCatalogs={[makeCatalog()]} userProducts={[]} userPlan="free" />)

        await openActions(user, 'Dergi')
        await user.click(await screen.findByRole('menuitem', { name: /catalogs.duplicate/ }))

        expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument()
        expect(actionMocks.duplicateCatalog).not.toHaveBeenCalled()
    })

    it('adds the duplicated catalog to the list', async () => {
        const user = userEvent.setup()
        actionMocks.duplicateCatalog.mockResolvedValueOnce(
            makeCatalog({ id: 'catalog-2', name: 'Dergi (kopya)', is_published: false, share_slug: 'dergi-2' })
        )
        render(<CatalogsPageClient initialCatalogs={[makeCatalog()]} userProducts={[]} userPlan="plus" />)

        await openActions(user, 'Dergi')
        await user.click(await screen.findByRole('menuitem', { name: /catalogs.duplicate/ }))

        await waitFor(() => expect(actionMocks.duplicateCatalog).toHaveBeenCalledWith('catalog-1', 'Dergi (kopya)'))
        expect(await screen.findByText('Dergi (kopya)')).toBeInTheDocument()
    })

    it('renames a catalog from the list', async () => {
        const user = userEvent.setup()
        actionMocks.updateCatalog.mockResolvedValueOnce({ success: true })
        render(<CatalogsPageClient initialCatalogs={[makeCatalog()]} userProducts={[]} userPlan="plus" />)

        await openActions(user, 'Dergi')
        await user.click(await screen.findByRole('menuitem', { name: /catalogs.rename/ }))
        const input = await screen.findByLabelText('catalogs.name')
        await user.clear(input)
        await user.type(input, 'Yaz Koleksiyonu')
        await user.click(screen.getByRole('button', { name: 'catalogs.save' }))

        await waitFor(() =>
            expect(actionMocks.updateCatalog).toHaveBeenCalledWith('catalog-1', { name: 'Yaz Koleksiyonu' }, { publicSlug: 'dergi' })
        )
        expect(await screen.findByText('Yaz Koleksiyonu')).toBeInTheDocument()
    })

    it('shows locked catalogs without an edit link', () => {
        render(
            <CatalogsPageClient
                initialCatalogs={[makeCatalog({ is_disabled: true })]}
                userProducts={[]}
                userPlan="free"
            />
        )

        expect(screen.getByText('catalogs.lockedTitle')).toBeInTheDocument()
        expect(screen.queryByRole('link', { name: /Dergi/ })).not.toBeInTheDocument()
    })
})
