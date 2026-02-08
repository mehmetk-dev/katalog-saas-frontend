import { Metadata } from 'next'

interface SEOProps {
    title?: string
    description?: string
    keywords?: string[]
    image?: string
    url?: string
    type?: 'website' | 'article'
    noIndex?: boolean
}

const DEFAULT_TITLE = 'FogCatalog - Professional Digital Product Catalog Builder'
const DEFAULT_DESCRIPTION = 'Create stunning, professional digital product catalogs in minutes. 15+ premium templates, PDF export, QR codes, and interactive sharing. Start for free!'
const DEFAULT_IMAGE = '/hero-dashboard.webp'

export function generateSEO({
    title,
    description = DEFAULT_DESCRIPTION,
    keywords = [
        'katalog', 'ürün kataloğu', 'PDF katalog', 'dijital katalog', 'katalog oluşturma',
        'catalog builder', 'digital catalog', 'product catalog', 'online catalog', 'PDF catalog creator',
        'B2B catalog', 'wholesale catalog builder', 'whatsapp order catalog'
    ],
    image = DEFAULT_IMAGE,
    url,
    type = 'website',
    noIndex = false,
}: SEOProps): Metadata {
    const fullTitle = title ? `${title} | FogCatalog` : DEFAULT_TITLE
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fogcatalog.app'
    const fullUrl = url ? `${baseUrl}${url}` : baseUrl
    const fullImage = image.startsWith('http') ? image : `${baseUrl}${image}`

    return {
        // If title is provided, return it so layout template "%s | FogCatalog" applies.
        // If title is undefined, return undefined so layout "default" applies.
        // This prevents "Default Title | FogCatalog" duplication.
        title: title,
        description,
        keywords,
        authors: [{ name: 'FogCatalog' }],
        robots: noIndex ? 'noindex, nofollow' : 'index, follow',
        openGraph: {
            // OpenGraph needs the full title as templates don't apply here automatically
            title: fullTitle,
            description,
            url: fullUrl,
            siteName: 'FogCatalog',
            images: [
                {
                    url: fullImage,
                    width: 1200,
                    height: 630,
                    alt: fullTitle,
                },
            ],
            locale: 'tr_TR',
            alternateLocale: ['en_US'],
            type,
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description,
            images: [fullImage],
        },
        alternates: {
            canonical: fullUrl,
        },
    }
}

// Pre-defined SEO configs for common pages
export const SEO_CONFIG = {
    home: generateSEO({
        title: 'Profesyonel Ürün Kataloğu Oluşturucu',
        description: 'Dakikalar içinde profesyonel dijital ürün katalogları oluşturun, paylaşın ve yayınlayın. WhatsApp entegrasyonu ile toptan ve perakende satışlarınızı artırın.',
        url: '/',
        keywords: [
            'katalog', 'ürün kataloğu', 'PDF katalog', 'dijital katalog',
            'catalog builder', 'product catalog maker', 'digital brochure', 'wholesale catalog'
        ]
    }),
    pricing: generateSEO({
        title: 'Fiyatlandırma',
        description: 'İşletmeniz için en uygun planı seçin. Ücretsiz başlayın veya Plus ve Pro planlarıyla sınırsız katalog ve ürün özelliklerinin kilidini açın.',
        url: '/pricing',
        keywords: [
            'katalog fiyatları', 'fiyatlandırma', 'katalog oluşturma fiyat', 'dijital katalog paketleri',
            'catalog pricing', 'catalog builder cost', 'digital catalog plans', 'free catalog maker'
        ]
    }),
    howItWorks: generateSEO({
        title: 'Nasıl Çalışır',
        description: '3 kolay adımda profesyonel dijital kataloğunuzu oluşturun: Ürünleri ekleyin, şablon seçin ve QR veya Link ile paylaşın.',
        url: '/how-it-works',
        keywords: ['katalog nasıl yapılır', 'how to create catalog', 'catalog tutorial']
    }),
    features: generateSEO({
        title: 'Özellikler',
        description: 'FogCatalog\'un gücünü keşfedin: Toplu yükleme, Yapay Zeka destekli isimlendirme, PDF dışa aktarma, Dinamik QR kodlar ve Gelişmiş Analitik.',
        url: '/features',
        keywords: [
            'katalog özellikleri', 'toplu ürün yükleme', 'pdf katalog',
            'catalog features', 'bulk product upload', 'pdf export', 'catalog analytics'
        ]
    }),
    contact: generateSEO({
        title: 'İletişim',
        description: 'Yardıma mı ihtiyacınız var? FogCatalog destek ekibiyle iletişime geçin. İşinizi büyütmenize yardımcı olmak için buradayız.',
        url: '/contact',
    }),
    faq: generateSEO({
        title: 'Sıkça Sorulan Sorular',
        description: 'Katalog oluşturma, fiyatlandırma, WhatsApp siparişleri ve teknik destek hakkındaki sorularınızın yanıtlarını bulun.',
        url: '/faq',
    }),
    auth: generateSEO({
        title: 'Giriş Yap',
        description: 'FogCatalog\'a giriş yapın veya profesyonel kataloglarınızı oluşturmaya başlamak için yeni bir hesap oluşturun.',
        url: '/auth',
        noIndex: true,
    }),
    dashboard: generateSEO({
        title: 'Panel',
        description: 'Kataloglarınızı, ürünlerinizi yönetin ve performans istatistiklerinizi tek bir yerden görüntüleyin.',
        url: '/dashboard',
        noIndex: true,
    }),
    blog: generateSEO({
        title: 'Blog | İpuçları ve Rehberler',
        description: 'Dijital katalog trendleri, e-ticaret büyüme stratejileri ve satış ipuçları hakkında en son yazıları keşfedin.',
        url: '/blog',
        keywords: [
            'blog', 'dijital katalog ipuçları', 'e-ticaret rehberleri', 'satış stratejileri',
            'digital catalog tips', 'e-commerce guides', 'sales strategy', 'catalog marketing'
        ]
    }),
}
