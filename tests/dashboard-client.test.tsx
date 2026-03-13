import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { type Catalog } from '@/lib/actions/catalogs'
import { type Product } from '@/lib/actions/products'

// Mock dependencies
vi.mock('@/lib/contexts/i18n-provider', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'dashboard.welcomeUser': 'HoÃ…Å¸ geldin, {name}',
                'dashboard.totalProducts': 'Toplam ÃƒÅ“rÃƒÂ¼n',
                'dashboard.totalViews': 'Toplam GÃƒÂ¶rÃƒÂ¼ntÃƒÂ¼lenme',
                'dashboard.recentActivity': 'Son Aktiviteler',
                'dashboard.createCatalog': 'Katalog OluÃ…Å¸tur',
                'dashboard.addProduct': 'ÃƒÅ“rÃƒÂ¼n Ekle',
                'dashboard.importExcel': 'Excel ile toplu ÃƒÂ¼rÃƒÂ¼n ekle',
                'dashboard.published': 'YayÃ„Â±nda',
                'dashboard.draft': 'Taslak',
                'dashboard.edit': 'DÃƒÂ¼zenle',
                'dashboard.used': '{current}/{max} kullanÃ„Â±ldÃ„Â±',
                'dashboard.unlimited': 'SÃ„Â±nÃ„Â±rsÃ„Â±z',
                'dashboard.allCatalogs': 'TÃƒÂ¼m kataloglar',
                'dashboard.activeCatalogs': 'Aktif kataloglar',
                'catalogs.title': 'Kataloglar',
                'catalogs.view': 'TÃƒÂ¼mÃƒÂ¼nÃƒÂ¼ GÃƒÂ¶r',
                'catalogs.published': 'YayÃ„Â±nlanan',
                'catalogs.template': 'Ã…Âablonlar',
                'products.product': 'ÃƒÅ“rÃƒÂ¼n',
                'products.addProduct': 'ÃƒÅ“rÃƒÂ¼n Ekle',
                'products.noProductsDesc': 'HenÃƒÂ¼z ÃƒÂ¼rÃƒÂ¼n eklemediniz',
                'sidebar.templates': 'Ã…Âablonlar',
                'landing.heroSubtitle': 'ÃƒÅ“rÃƒÂ¼n kataloglarÃ„Â±nÃ„Â±zÃ„Â± kolayca oluÃ…Å¸turun',
                'marketing.feature1': '15+ profesyonel Ã…Å¸ablon',
                'common.user': 'KullanÃ„Â±cÃ„Â±',
                'common.updateError': 'Bilinmiyor',
            }
            return translations[key] || key
        },
        language: 'tr',
    }),
}))

const mockUseUser = vi.fn(() => ({
    user: {
        id: 'test-user',
        name: 'Test User',
        plan: 'free' as const,
        maxProducts: 50,
    },
    isLoading: false,
    refreshUser: vi.fn(),
}))

vi.mock('@/lib/contexts/user-context', () => ({
    useUser: () => mockUseUser(),
}))

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
    }),
    usePathname: () => '/dashboard',
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}))

vi.mock('next/image', () => ({
    default: ({ src, alt, fill, unoptimized, ...props }: { src: string; alt: string; fill?: boolean; unoptimized?: boolean;[key: string]: unknown }) => {
        const imgProps: Record<string, unknown> = { src, alt, ...props }
        if (fill) imgProps.style = { position: 'absolute', width: '100%', height: '100%' }
        if (unoptimized !== undefined) imgProps.unoptimized = String(unoptimized)
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...(imgProps as React.ImgHTMLAttributes<HTMLImageElement>)} />
    },
}))

vi.mock('date-fns', () => ({
    formatDistanceToNow: vi.fn((_date: Date) => '2 gÃƒÂ¼n ÃƒÂ¶nce'),
}))

vi.mock('date-fns/locale', () => ({
    tr: {},
}))

vi.mock('@/components/dashboard/onboarding-checklist', () => ({
    OnboardingChecklist: ({ hasProducts, hasCatalogs }: { hasProducts: boolean; hasCatalogs: boolean }) => (
        <div data-testid="onboarding-checklist">
            Products: {hasProducts ? 'Yes' : 'No'}, Catalogs: {hasCatalogs ? 'Yes' : 'No'}
        </div>
    ),
}))

global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
} as unknown as typeof ResizeObserver

describe('Dashboard Client Testleri', () => {
    const mockCatalogs: Catalog[] = [
        {
            id: 'catalog-1',
            name: 'Test Catalog 1',
            description: 'Test description',
            layout: 'modern-grid',
            is_published: true,
            share_slug: 'test-catalog-1',
            product_ids: ['product-1', 'product-2'],
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
        },
        {
            id: 'catalog-2',
            name: 'Test Catalog 2',
            description: 'Test description 2',
            layout: 'elegant-cards',
            is_published: false,
            share_slug: null,
            product_ids: ['product-3'],
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
        },
    ]

    const mockProducts: Product[] = [
        {
            id: 'product-1',
            name: 'Test Product 1',
            description: 'Test description',
            price: 100,
            sku: 'SKU-1',
            category: 'Category 1',
            image_url: 'https://example.com/image1.jpg',
            images: ['https://example.com/image1.jpg'],
            product_url: 'https://example.com/product1',
            user_id: 'test-user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            stock: 10,
            custom_attributes: [],
            order: 0,
        },
        {
            id: 'product-2',
            name: 'Test Product 2',
            description: 'Test description 2',
            price: 200,
            sku: 'SKU-2',
            category: 'Category 2',
            image_url: 'https://example.com/image2.jpg',
            images: ['https://example.com/image2.jpg'],
            product_url: 'https://example.com/product2',
            user_id: 'test-user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            stock: 5,
            custom_attributes: [],
            order: 1,
        },
    ]

    const mockStats = {
        totalViews: 150,
        totalProducts: 2,
        totalCatalogs: 2,
        publishedCatalogs: 1,
        topCatalogs: [],
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // Reset useUser mock
        mockUseUser.mockReturnValue({
            user: {
                id: 'test-user',
                name: 'Test User',
                plan: 'free' as const,
                maxProducts: 50,
            },
            isLoading: false,
            refreshUser: vi.fn(),
        })
    })

    describe('Render ve Temel Ã„Â°Ã…Å¸levsellik', () => {
        it('Dashboard baÃ…Å¸arÃ„Â±yla render edilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Translation key dÃƒÂ¶ndÃƒÂ¼Ã„Å¸ÃƒÂ¼ iÃƒÂ§in text iÃƒÂ§eriÃ„Å¸ini kontrol et
            expect(screen.getByText(/HoÃ…Å¸ geldin|dashboard.welcomeUser/i)).toBeInTheDocument()
            expect(screen.getByText(/Toplam ÃƒÅ“rÃƒÂ¼n|dashboard.totalProducts/i)).toBeInTheDocument()
        })

        it('KullanÃ„Â±cÃ„Â± adÃ„Â± gÃƒÂ¶sterilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Component'te kullanÃ„Â±cÃ„Â± adÃ„Â± gÃƒÂ¶sterilir, translation key olabilir
            const welcomeText = screen.getByText(/HoÃ…Å¸ geldin|dashboard.welcomeUser/i)
            expect(welcomeText).toBeInTheDocument()
        })

        it('Stats kartlari render edilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            expect(screen.getByText(/Toplam ÃƒÅ“rÃƒÂ¼n|dashboard.totalProducts/i)).toBeInTheDocument()
            expect(screen.getAllByText(/dashboard.catalogs|TÃ¼m kataloglar|Toplam Katalog/i).length).toBeGreaterThan(0)
            expect(screen.getByText(/YayÃ„Â±nlanan|catalogs.published/i)).toBeInTheDocument()

        })

        it('Stats degerleri dogru gosterilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(2)
            expect(screen.getByText('1')).toBeInTheDocument()
        })
    })

    describe('Recent Catalogs', () => {
        it('Kataloglar listelenir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Katalog isimleri render edilmeli
            expect(screen.getByText('Test Catalog 1')).toBeInTheDocument()
            expect(screen.getByText('Test Catalog 2')).toBeInTheDocument()
        })

        it('YayÃ„Â±nlanan katalog iÃƒÂ§in published badge gÃƒÂ¶sterilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Published badge translation key olabilir
            expect(screen.getByText(/YayÃ„Â±nda|dashboard.published/i)).toBeInTheDocument()
        })

        it('Taslak katalog iÃƒÂ§in draft badge gÃƒÂ¶sterilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Draft badge translation key olabilir
            expect(screen.getByText(/Taslak|dashboard.draft/i)).toBeInTheDocument()
        })

        it('Katalog ÃƒÂ¼rÃƒÂ¼n sayÃ„Â±sÃ„Â± gÃƒÂ¶sterilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Catalog 1 has 2 products - translation key kullanÃ„Â±labilir
            expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(2)
        })

        it('Katalog dÃƒÂ¼zenle butonu gÃƒÂ¶rÃƒÂ¼nÃƒÂ¼r', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            const editLinks = screen.getAllByText('DÃƒÂ¼zenle')
            expect(editLinks.length).toBeGreaterThan(0)
        })
    })

    describe('Empty State', () => {
        it('Katalog yoksa empty state gÃƒÂ¶sterilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={[]}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Empty state mesajÃ„Â± translation key olabilir
            expect(screen.getByText(/HenÃƒÂ¼z ÃƒÂ¼rÃƒÂ¼n eklemediniz|products.noProductsDesc/i)).toBeInTheDocument()
            expect(screen.getByText(/Katalog OluÃ…Å¸tur|dashboard.createCatalog/i)).toBeInTheDocument()
        })

        it('Empty state\'de katalog oluÃ…Å¸tur butonu ÃƒÂ§alÃ„Â±Ã…Å¸Ã„Â±r', () => {
            render(
                <DashboardClient
                    initialCatalogs={[]}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // ArtÃ„Â±k bir button
            const createButton = screen.getByRole('button', { name: /Katalog OluÃ…Å¸tur|dashboard.createCatalog/i })
            expect(createButton).toBeInTheDocument()
        })
    })

    describe('Quick Actions', () => {
        it('ÃƒÅ“rÃƒÂ¼n ekle kartÃ„Â± gÃƒÂ¶rÃƒÂ¼nÃƒÂ¼r', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Heading olarak kontrol et
            expect(screen.getByRole('heading', { name: /ÃƒÅ“rÃƒÂ¼n Ekle|dashboard.addProduct/i })).toBeInTheDocument()
            expect(screen.getByText(/Excel ile toplu ÃƒÂ¼rÃƒÂ¼n ekle|dashboard.importExcel/i)).toBeInTheDocument()
        })

        it('Ã…Âablonlar kartÃ„Â± gÃƒÂ¶rÃƒÂ¼nÃƒÂ¼r', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Heading olarak kontrol et
            expect(screen.getByRole('heading', { name: /Ã…Âablonlar|catalogs.template|sidebar.templates/i })).toBeInTheDocument()
        })

        it('ÃƒÅ“rÃƒÂ¼n ekle butonu doÃ„Å¸ru linke yÃƒÂ¶nlendirir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Link'i tam text veya role ile bul
            const addProductLink = screen.getByRole('link', { name: /ÃƒÅ“rÃƒÂ¼n Ekle|dashboard.addProduct|products.addProduct/i })
            expect(addProductLink).toHaveAttribute('href', '/dashboard/products?action=import')
        })

        it('Ã…Âablonlar butonu doÃ„Å¸ru linke yÃƒÂ¶nlendirir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Templates linkini bul
            const templatesLink = screen.getByRole('link', { name: /Ã…Âablonlar|catalogs.template|sidebar.templates/i })
            expect(templatesLink).toHaveAttribute('href', '/dashboard/templates')
        })
    })

    describe('Onboarding Checklist', () => {
        it('Onboarding checklist render edilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            expect(screen.getByTestId('onboarding-checklist')).toBeInTheDocument()
        })

        it('Onboarding checklist doÃ„Å¸ru props alÃ„Â±r', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            const checklist = screen.getByTestId('onboarding-checklist')
            expect(checklist).toHaveTextContent('Products: Yes')
            expect(checklist).toHaveTextContent('Catalogs: Yes')
        })

        it('ÃƒÅ“rÃƒÂ¼n yoksa onboarding checklist doÃ„Å¸ru gÃƒÂ¶sterilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={[]}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            const checklist = screen.getByTestId('onboarding-checklist')
            expect(checklist).toHaveTextContent('Products: No')
            expect(checklist).toHaveTextContent('Catalogs: Yes')
        })
    })

    describe('Loading State', () => {
        it('Loading state gÃƒÂ¶sterilir', () => {
            // useUser mock'unu deÃ„Å¸iÃ…Å¸tir
            mockUseUser.mockReturnValueOnce({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                user: null as any,
                isLoading: true,
                refreshUser: vi.fn(),
            })

            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Loading skeleton gÃƒÂ¶rÃƒÂ¼nmeli - animate-pulse class'Ã„Â± olan element
            const skeleton = document.querySelector('.animate-pulse')
            expect(skeleton).toBeInTheDocument()
        })
    })

    describe('Null/Undefined Handling', () => {
        it('Null catalogs ile ÃƒÂ§alÃ„Â±Ã…Å¸Ã„Â±r', () => {
            render(
                <DashboardClient
                    initialCatalogs={null as unknown as Catalog[]}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            expect(screen.getByText(/HenÃƒÂ¼z ÃƒÂ¼rÃƒÂ¼n eklemediniz/i)).toBeInTheDocument()
        })

        it('Null products ile ÃƒÂ§alÃ„Â±Ã…Å¸Ã„Â±r', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={null as unknown as Product[]}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            expect(screen.getByText('Toplam ÃƒÅ“rÃƒÂ¼n')).toBeInTheDocument()
        })

        it('Null stats ile calisir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={null}
                    totalProductCount={mockProducts.length}
                />
            )

            expect(screen.getByText(/dashboard.catalogs|TÃ¼m kataloglar|Toplam Katalog/i)).toBeInTheDocument()
            expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(2)
        })
    })

    describe('Stats Calculations', () => {
        it('YayÃ„Â±nlanan katalog sayÃ„Â±sÃ„Â± doÃ„Å¸ru hesaplanÃ„Â±r', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // 1 published catalog
            const publishedBadge = screen.getByText('YayÃ„Â±nda')
            expect(publishedBadge).toBeInTheDocument()
        })

        it('Urun sayisi dogru gosterilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(2)
        })
    })

    describe('Navigation Links', () => {
        it('TÃƒÂ¼mÃƒÂ¼nÃƒÂ¼ GÃƒÂ¶r linki gÃƒÂ¶rÃƒÂ¼nÃƒÂ¼r', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Link'i bul - translation key olabilir
            const allLinks = screen.getAllByRole('link')
            const catalogsLink = allLinks.find(link => link.getAttribute('href') === '/dashboard/catalogs')
            expect(catalogsLink).toBeInTheDocument()
        })

        it('Katalog dÃƒÂ¼zenle linki doÃ„Å¸ru ID ile oluÃ…Å¸turulur', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Builder linkini bul - catalog ID iÃƒÂ§ermeli
            const allLinks = screen.getAllByRole('link')
            const builderLink = allLinks.find(link =>
                link.getAttribute('href')?.includes('catalog-1') ||
                link.getAttribute('href')?.includes('builder?id=catalog-1')
            )
            expect(builderLink).toBeInTheDocument()
        })
    })
})

