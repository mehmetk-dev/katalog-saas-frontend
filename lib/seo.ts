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

const DEFAULT_TITLE = 'CatalogPro - Ürün Katalog Oluşturucu'
const DEFAULT_DESCRIPTION = 'Dakikalar içinde profesyonel ürün katalogları oluşturun. 15+ şablon, PDF export ve paylaşılabilir linkler.'
const DEFAULT_IMAGE = '/hero-dashboard.webp'

export function generateSEO({
    title,
    description = DEFAULT_DESCRIPTION,
    keywords = ['katalog', 'ürün kataloğu', 'PDF katalog', 'e-ticaret', 'ürün listesi'],
    image = DEFAULT_IMAGE,
    url,
    type = 'website',
    noIndex = false,
}: SEOProps): Metadata {
    const fullTitle = title ? `${title} | CatalogPro` : DEFAULT_TITLE
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://catalogpro.app'
    const fullUrl = url ? `${baseUrl}${url}` : baseUrl
    const fullImage = image.startsWith('http') ? image : `${baseUrl}${image}`

    return {
        title: fullTitle,
        description,
        keywords,
        authors: [{ name: 'CatalogPro' }],
        robots: noIndex ? 'noindex, nofollow' : 'index, follow',
        openGraph: {
            title: fullTitle,
            description,
            url: fullUrl,
            siteName: 'CatalogPro',
            images: [
                {
                    url: fullImage,
                    width: 1200,
                    height: 630,
                    alt: fullTitle,
                },
            ],
            locale: 'tr_TR',
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
        title: undefined, // Uses default
        description: 'Dakikalar içinde profesyonel ürün katalogları oluşturun. 15+ şablon, PDF export ve paylaşılabilir linkler.',
        url: '/',
    }),
    pricing: generateSEO({
        title: 'Fiyatlandırma',
        description: 'CatalogPro fiyatlandırma planları. Ücretsiz başlayın, işletmeniz büyüdükçe yükseltin.',
        url: '/pricing',
    }),
    howItWorks: generateSEO({
        title: 'Nasıl Çalışır',
        description: 'CatalogPro ile profesyonel katalog oluşturmanın 4 kolay adımı.',
        url: '/how-it-works',
    }),
    contact: generateSEO({
        title: 'İletişim',
        description: 'CatalogPro destek ekibiyle iletişime geçin.',
        url: '/contact',
    }),
    auth: generateSEO({
        title: 'Giriş Yap',
        description: 'CatalogPro hesabınıza giriş yapın veya yeni hesap oluşturun.',
        url: '/auth',
        noIndex: true,
    }),
    dashboard: generateSEO({
        title: 'Dashboard',
        description: 'CatalogPro kontrol paneli',
        url: '/dashboard',
        noIndex: true,
    }),
}
