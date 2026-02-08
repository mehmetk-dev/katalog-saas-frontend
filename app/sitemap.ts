import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fogcatalog.app'

    // Statik sayfalar
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/pricing`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/how-it-works`,
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
        {
            url: `${baseUrl}/auth`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
    ]

    // Blog Yazıları (Manuel Listeden)
    const blogPosts: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/blog/neden-dijital-katalog-kullanmalisiniz`,
            lastModified: new Date('2026-02-04'),
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

    // Dinamik Kataloglar (Sadece yayınlanmış ve kaliteli olanlar)
    let catalogEntries: MetadataRoute.Sitemap = []

    try {
        const { getCatalogs } = await import('@/lib/actions/catalogs')
        const allCatalogs = await getCatalogs()

        if (allCatalogs && Array.isArray(allCatalogs)) {
            catalogEntries = allCatalogs
                .filter(c =>
                    c.is_published &&
                    c.share_slug &&
                    c.show_in_search !== false &&
                    c.product_ids &&
                    c.product_ids.length >= 5 // Sadece 5 ve üzeri ürünü olan "kaliteli" kataloglar
                )
                .map(c => ({
                    url: `${baseUrl}/catalog/${c.share_slug}`,
                    lastModified: new Date(c.updated_at),
                    changeFrequency: 'weekly',
                    priority: 0.6,
                }))
        }
    } catch (error) {
        console.error('Sitemap catalog fetch error:', error)
    }

    return [...staticPages, ...blogPosts, ...catalogEntries]
}
