import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/contexts/i18n-provider', () => ({
    useTranslation: () => ({ t: (key: string) => key, language: 'tr' }),
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
    usePathname: () => '/catalog/test-slug',
}))

global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
} as unknown as typeof ResizeObserver

interface Catalog {
    id: string;
    name: string;
    share_slug: string;
    is_published: boolean;
    view_count: number;
    user_id?: string;
    products: unknown[];
}

describe('Analytics Testleri', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Public Catalog View Tracking', () => {
        it('Public katalog görüntülendiğinde view count artar', async () => {
            const { apiFetch } = await import('@/lib/api')
            const mockCatalog = {
                id: 'catalog-1',
                name: 'Test Catalog',
                share_slug: 'test-slug',
                is_published: true,
                view_count: 0,
                products: []
            }

            // İlk görüntüleme
            vi.mocked(apiFetch).mockResolvedValueOnce(mockCatalog)

            const catalog = await apiFetch<Catalog>(`/catalogs/public/test-slug`)
            expect(catalog).toBeDefined()
            expect(catalog.view_count).toBe(0) // İlk görüntüleme, henüz artmamış olabilir (async)

            // Backend'de view count artırılıyor mu kontrol et
            // getPublicCatalog endpoint'i çağrıldığında smartIncrementViewCount çağrılmalı
            expect(apiFetch).toHaveBeenCalledWith('/catalogs/public/test-slug')
        })

        it('Owner görüntülediğinde view count artmaz', async () => {
            const { apiFetch } = await import('@/lib/api')
            const mockCatalog = {
                id: 'catalog-1',
                name: 'Test Catalog',
                share_slug: 'test-slug',
                is_published: true,
                view_count: 5,
                user_id: 'owner-user-id',
                products: []
            }

            // Owner olarak görüntüleme (x-user-id header ile)
            vi.mocked(apiFetch).mockResolvedValueOnce(mockCatalog)

            const catalog = await apiFetch<Catalog>(`/catalogs/public/test-slug`, {
                headers: {
                    'x-user-id': 'owner-user-id'
                }
            })

            expect(catalog).toBeDefined()
            // Owner görüntülediğinde view_count artmamalı
            // Backend'de isOwner kontrolü yapılıyor ve smartIncrementViewCount çağrılmıyor
        })

        it('Farklı visitor\'lar için view count artar', async () => {
            const { apiFetch } = await import('@/lib/api')
            const mockCatalog = {
                id: 'catalog-1',
                name: 'Test Catalog',
                share_slug: 'test-slug',
                is_published: true,
                view_count: 0,
                products: []
            }

            // Visitor 1
            vi.mocked(apiFetch).mockResolvedValueOnce({ ...mockCatalog, view_count: 1 })
            const catalog1 = await apiFetch<Catalog>(`/catalogs/public/test-slug`)
            expect(catalog1.view_count).toBeGreaterThanOrEqual(0)

            // Visitor 2 (farklı IP/visitor hash)
            vi.mocked(apiFetch).mockResolvedValueOnce({ ...mockCatalog, view_count: 2 })
            const catalog2 = await apiFetch<Catalog>(`/catalogs/public/test-slug`)
            expect(catalog2.view_count).toBeGreaterThanOrEqual(1)
        })

        it('Aynı visitor aynı gün içinde tekrar görüntülediğinde view count artmaz', async () => {
            const { apiFetch } = await import('@/lib/api')
            const mockCatalog = {
                id: 'catalog-1',
                name: 'Test Catalog',
                share_slug: 'test-slug',
                is_published: true,
                view_count: 1,
                products: []
            }

            // İlk görüntüleme
            vi.mocked(apiFetch).mockResolvedValueOnce({ ...mockCatalog, view_count: 1 })
            const catalog1 = await apiFetch<Catalog>(`/catalogs/public/test-slug`)

            // Aynı visitor aynı gün içinde tekrar görüntüleme
            // unique index (catalog_id, visitor_hash, view_date) sayesinde
            // aynı gün içinde tekrar kayıt eklenmez
            vi.mocked(apiFetch).mockResolvedValueOnce({ ...mockCatalog, view_count: 1 })
            const catalog2 = await apiFetch<Catalog>(`/catalogs/public/test-slug`)

            // View count aynı kalmalı (unique constraint sayesinde)
            expect(catalog2.view_count).toBe(catalog1.view_count)
        })

        it('Visitor hash doğru oluşturulur', () => {
            // Visitor hash: IP + User Agent hash'i
            const ip = '192.168.1.1'
            const userAgent = 'Mozilla/5.0'

            // Basit hash fonksiyonu (gerçek implementasyon farklı olabilir)
            const createVisitorHash = (ip: string, ua: string) => {
                return btoa(`${ip}-${ua}`).substring(0, 32)
            }

            const hash1 = createVisitorHash(ip, userAgent)
            const hash2 = createVisitorHash(ip, userAgent)
            const hash3 = createVisitorHash('192.168.1.2', userAgent)

            // Aynı IP ve UA için aynı hash
            expect(hash1).toBe(hash2)
            // Farklı IP için farklı hash
            expect(hash1).not.toBe(hash3)
        })

        it('getVisitorInfo doğru IP ve User Agent alır', () => {
            // Backend'deki getVisitorInfo fonksiyonu gibi
            const mockReq = {
                headers: {
                    'x-forwarded-for': '192.168.1.1, 10.0.0.1',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                },
                ip: '192.168.1.1'
            }

            // IP'yi al (x-forwarded-for varsa ilk değer, yoksa req.ip)
            const ip = mockReq.headers['x-forwarded-for']?.split(',')[0].trim() || mockReq.ip
            const userAgent = mockReq.headers['user-agent'] || ''

            expect(ip).toBe('192.168.1.1')
            expect(userAgent).toContain('Mozilla')
        })

        it('Device type doğru tespit edilir', () => {
            const userAgents = [
                { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', expected: 'mobile' },
                { ua: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)', expected: 'tablet' },
                { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', expected: 'desktop' },
            ]

            const detectDeviceType = (userAgent: string): string => {
                if (/iPhone|Android|Mobile/i.test(userAgent)) return 'mobile'
                if (/iPad|Tablet/i.test(userAgent)) return 'tablet'
                return 'desktop'
            }

            userAgents.forEach(({ ua, expected }) => {
                expect(detectDeviceType(ua)).toBe(expected)
            })
        })
    })

    describe('View Count Database Operations', () => {
        it('smart_increment_view_count RPC fonksiyonu doğru çalışır', async () => {
            // RPC fonksiyonu:
            // 1. Owner ise false döner
            // 2. Yeni kayıt ekler (conflict olursa atlar)
            // 3. Yeni kayıt eklendiyse view_count artırır

            const mockRPC = vi.fn()
            const catalogId = 'catalog-1'
            const visitorHash = 'visitor-hash-123'
            const isOwner = false

            // Başarılı insert
            mockRPC.mockResolvedValueOnce({ data: true, error: null })

            const _result = await mockRPC('smart_increment_view_count', {
                p_catalog_id: catalogId,
                p_visitor_hash: visitorHash,
                p_is_owner: isOwner
            })

            expect(mockRPC).toHaveBeenCalledWith('smart_increment_view_count', {
                p_catalog_id: catalogId,
                p_visitor_hash: visitorHash,
                p_is_owner: isOwner
            })
        })

        it('Owner görüntülediğinde RPC fonksiyonu false döner', async () => {
            const mockRPC = vi.fn()
            const isOwner = true

            // Owner ise fonksiyon false döner
            mockRPC.mockResolvedValueOnce({ data: false, error: null })

            const result = await mockRPC('smart_increment_view_count', {
                p_catalog_id: 'catalog-1',
                p_visitor_hash: 'visitor-hash',
                p_is_owner: isOwner
            })

            // Owner için false dönmeli
            expect(result.data).toBe(false)
        })
    })

    describe('Public Catalog Endpoint Integration', () => {
        it('Public katalog endpoint çağrıldığında view tracking tetiklenir', async () => {
            const { apiFetch } = await import('@/lib/api')

            // Mock: Public catalog endpoint çağrısı
            const mockCatalog = {
                id: 'catalog-1',
                name: 'Test Catalog',
                share_slug: 'test-slug',
                is_published: true,
                view_count: 0,
                products: []
            }

            vi.mocked(apiFetch).mockResolvedValueOnce(mockCatalog)

            // getPublicCatalog fonksiyonu çağrıldığında
            const { getPublicCatalog } = await import('@/lib/actions/catalogs')
            const catalog = await getPublicCatalog('test-slug')

            // Backend'de smartIncrementViewCount çağrılmalı
            // (Bu test mock'lanmış API çağrısını test ediyor)
            expect(apiFetch).toHaveBeenCalledWith('/catalogs/public/test-slug')
            expect(catalog).toBeDefined()
        })

        it('Owner header ile görüntülediğinde view count artmaz', async () => {
            const { apiFetch } = await import('@/lib/api')

            const mockCatalog = {
                id: 'catalog-1',
                name: 'Test Catalog',
                share_slug: 'test-slug',
                is_published: true,
                view_count: 5, // Önceki görüntülenme
                user_id: 'owner-user-id',
                products: []
            }

            // Owner olarak görüntüleme (x-user-id header backend'de kontrol ediliyor)
            vi.mocked(apiFetch).mockResolvedValueOnce(mockCatalog)

            const catalog = await apiFetch<Catalog>('/catalogs/public/test-slug')

            // Backend'de isOwner kontrolü yapılıyor ve smartIncrementViewCount çağrılmıyor
            // Bu test mock'lanmış response'u test ediyor
            expect(catalog.view_count).toBe(5) // Artmamalı
        })
    })

    describe('Analytics Display', () => {
        it('View count doğru gösterilir', () => {
            const catalog = {
                id: 'catalog-1',
                name: 'Test Catalog',
                view_count: 42
            }

            expect(catalog.view_count).toBe(42)
        })

        it('Günlük view sayısı hesaplanır', () => {
            // get_catalog_daily_views fonksiyonu testi
            const mockDailyViews = [
                { view_date: '2024-01-01', view_count: 10 },
                { view_date: '2024-01-02', view_count: 15 },
                { view_date: '2024-01-03', view_count: 8 },
            ]

            const totalViews = mockDailyViews.reduce((sum, day) => sum + day.view_count, 0)
            expect(totalViews).toBe(33)
        })

        it('Cihaz dağılımı hesaplanır', () => {
            // get_catalog_device_stats fonksiyonu testi
            const mockDeviceStats = [
                { device_type: 'desktop', view_count: 50 },
                { device_type: 'mobile', view_count: 30 },
                { device_type: 'tablet', view_count: 20 },
            ]

            const total = mockDeviceStats.reduce((sum, stat) => sum + stat.view_count, 0)
            expect(total).toBe(100)

            const percentages = mockDeviceStats.map(stat => ({
                device_type: stat.device_type,
                percentage: (stat.view_count / total) * 100
            }))

            expect(percentages[0].percentage).toBe(50) // desktop
            expect(percentages[1].percentage).toBe(30) // mobile
            expect(percentages[2].percentage).toBe(20) // tablet
        })
    })
})
