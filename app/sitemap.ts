import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fogcatalog.app'

    // Statik sayfalar
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/features`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/how-it-works`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/pricing`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/faq`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/auth`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        // Yasal Sayfalar
        {
            url: `${baseUrl}/legal/kvkk`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/legal/cookie-policy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/legal/cancellation-refund-policy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/legal/distance-sales-agreement`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ]

    // Blog Yazıları
    const blogPosts: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/blog/neden-dijital-katalog-kullanmalisiniz`,
            lastModified: new Date('2026-02-04'),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/blog/dijital-katalog-ile-satis-artirma`,
            lastModified: new Date('2026-02-08'),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/blog/why-digital-catalog`,
            lastModified: new Date('2026-02-04'),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
    ]

    // Örnek SEO Katalog (Showcase)
    const featuredCatalogs: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/catalog/modern-urun-katalogu-ornegi`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        }
    ]

    return [...staticPages, ...blogPosts, ...featuredCatalogs]
}
