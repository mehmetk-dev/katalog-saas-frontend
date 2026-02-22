import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { type Catalog } from '@/lib/actions/catalogs'
import { type Product } from '@/lib/actions/products'
import { type User } from '@/lib/user-context'

// Mock dependencies
vi.mock('@/lib/i18n-provider', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'dashboard.welcomeUser': 'Hoş geldin, {name}',
                'dashboard.totalProducts': 'Toplam Ürün',
                'dashboard.totalViews': 'Toplam Görüntülenme',
                'dashboard.recentActivity': 'Son Aktiviteler',
                'dashboard.createCatalog': 'Katalog Oluştur',
                'dashboard.addProduct': 'Ürün Ekle',
                'dashboard.importExcel': 'Excel ile toplu ürün ekle',
                'dashboard.published': 'Yayında',
                'dashboard.draft': 'Taslak',
                'dashboard.edit': 'Düzenle',
                'dashboard.used': '{current}/{max} kullanıldı',
                'dashboard.unlimited': 'Sınırsız',
                'dashboard.allCatalogs': 'Tüm kataloglar',
                'dashboard.activeCatalogs': 'Aktif kataloglar',
                'catalogs.title': 'Kataloglar',
                'catalogs.view': 'Tümünü Gör',
                'catalogs.published': 'Yayınlanan',
                'catalogs.template': 'Şablonlar',
                'products.product': 'Ürün',
                'products.addProduct': 'Ürün Ekle',
                'products.noProductsDesc': 'Henüz ürün eklemediniz',
                'sidebar.templates': 'Şablonlar',
                'landing.heroSubtitle': 'Ürün kataloglarınızı kolayca oluşturun',
                'marketing.feature1': '15+ profesyonel şablon',
                'common.user': 'Kullanıcı',
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

vi.mock('@/lib/user-context', () => ({
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
    formatDistanceToNow: vi.fn((_date: Date) => '2 gün önce'),
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

    describe('Render ve Temel İşlevsellik', () => {
        it('Dashboard başarıyla render edilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Translation key döndüğü için text içeriğini kontrol et
            expect(screen.getByText(/Hoş geldin|dashboard.welcomeUser/i)).toBeInTheDocument()
            expect(screen.getByText(/Toplam Ürün|dashboard.totalProducts/i)).toBeInTheDocument()
        })

        it('Kullanıcı adı gösterilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Component'te kullanıcı adı gösterilir, translation key olabilir
            const welcomeText = screen.getByText(/Hoş geldin|dashboard.welcomeUser/i)
            expect(welcomeText).toBeInTheDocument()
        })

        it('Stats kartları render edilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Translation key'leri kontrol et
            expect(screen.getByText(/Toplam Ürün|dashboard.totalProducts/i)).toBeInTheDocument()
            expect(screen.getByText(/Toplam Görüntülenme|dashboard.totalViews/i)).toBeInTheDocument()
            expect(screen.getByText(/Yayınlanan|catalogs.published/i)).toBeInTheDocument()
        })

        it('Stats değerleri doğru gösterilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Product count (2 products)
            expect(screen.getByText('2')).toBeInTheDocument()
            // Views count (150 views)
            expect(screen.getByText('150')).toBeInTheDocument()
            // Published count (1 published catalog)
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

        it('Yayınlanan katalog için published badge gösterilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Published badge translation key olabilir
            expect(screen.getByText(/Yayında|dashboard.published/i)).toBeInTheDocument()
        })

        it('Taslak katalog için draft badge gösterilir', () => {
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

        it('Katalog ürün sayısı gösterilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Catalog 1 has 2 products - translation key kullanılabilir
            expect(screen.getByText(/2.*ürün|2.*product/i)).toBeInTheDocument()
        })

        it('Katalog düzenle butonu görünür', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            const editLinks = screen.getAllByText('Düzenle')
            expect(editLinks.length).toBeGreaterThan(0)
        })
    })

    describe('Empty State', () => {
        it('Katalog yoksa empty state gösterilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={[]}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Empty state mesajı translation key olabilir
            expect(screen.getByText(/Henüz ürün eklemediniz|products.noProductsDesc/i)).toBeInTheDocument()
            expect(screen.getByText(/Katalog Oluştur|dashboard.createCatalog/i)).toBeInTheDocument()
        })

        it('Empty state\'de katalog oluştur butonu çalışır', () => {
            render(
                <DashboardClient
                    initialCatalogs={[]}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Artık bir button
            const createButton = screen.getByRole('button', { name: /Katalog Oluştur|dashboard.createCatalog/i })
            expect(createButton).toBeInTheDocument()
        })
    })

    describe('Quick Actions', () => {
        it('Ürün ekle kartı görünür', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Heading olarak kontrol et
            expect(screen.getByRole('heading', { name: /Ürün Ekle|dashboard.addProduct/i })).toBeInTheDocument()
            expect(screen.getByText(/Excel ile toplu ürün ekle|dashboard.importExcel/i)).toBeInTheDocument()
        })

        it('Şablonlar kartı görünür', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Heading olarak kontrol et
            expect(screen.getByRole('heading', { name: /Şablonlar|catalogs.template|sidebar.templates/i })).toBeInTheDocument()
        })

        it('Ürün ekle butonu doğru linke yönlendirir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Link'i tam text veya role ile bul
            const addProductLink = screen.getByRole('link', { name: /Ürün Ekle|dashboard.addProduct|products.addProduct/i })
            expect(addProductLink).toHaveAttribute('href', '/dashboard/products?action=import')
        })

        it('Şablonlar butonu doğru linke yönlendirir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Templates linkini bul
            const templatesLink = screen.getByRole('link', { name: /Şablonlar|catalogs.template|sidebar.templates/i })
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

        it('Onboarding checklist doğru props alır', () => {
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

        it('Ürün yoksa onboarding checklist doğru gösterilir', () => {
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
        it('Loading state gösterilir', () => {
            // useUser mock'unu değiştir
            mockUseUser.mockReturnValueOnce({
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

            // Loading skeleton görünmeli - animate-pulse class'ı olan element
            const skeleton = document.querySelector('.animate-pulse')
            expect(skeleton).toBeInTheDocument()
        })
    })

    describe('Null/Undefined Handling', () => {
        it('Null catalogs ile çalışır', () => {
            render(
                <DashboardClient
                    initialCatalogs={null as unknown as Catalog[]}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            expect(screen.getByText(/Henüz ürün eklemediniz/i)).toBeInTheDocument()
        })

        it('Null products ile çalışır', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={null as unknown as Product[]}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            expect(screen.getByText('Toplam Ürün')).toBeInTheDocument()
        })

        it('Null stats ile çalışır', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={null}
                    totalProductCount={mockProducts.length}
                />
            )

            expect(screen.getByText('Toplam Görüntülenme')).toBeInTheDocument()
            expect(screen.getByText('0')).toBeInTheDocument()
        })
    })

    describe('Stats Calculations', () => {
        it('Yayınlanan katalog sayısı doğru hesaplanır', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // 1 published catalog
            const publishedBadge = screen.getByText('Yayında')
            expect(publishedBadge).toBeInTheDocument()
        })

        it('Ürün sayısı doğru gösterilir', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Should show product count
            expect(screen.getByText('2')).toBeInTheDocument()
        })
    })

    describe('Navigation Links', () => {
        it('Tümünü Gör linki görünür', () => {
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

        it('Katalog düzenle linki doğru ID ile oluşturulur', () => {
            render(
                <DashboardClient
                    initialCatalogs={mockCatalogs}
                    initialProducts={mockProducts}
                    initialStats={mockStats}
                    totalProductCount={mockProducts.length}
                />
            )

            // Builder linkini bul - catalog ID içermeli
            const allLinks = screen.getAllByRole('link')
            const builderLink = allLinks.find(link =>
                link.getAttribute('href')?.includes('catalog-1') ||
                link.getAttribute('href')?.includes('builder?id=catalog-1')
            )
            expect(builderLink).toBeInTheDocument()
        })
    })
})
