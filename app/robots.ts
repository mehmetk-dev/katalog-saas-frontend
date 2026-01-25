import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fogcatalog.com'

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/dashboard/',      // Kullanıcı paneli
                    '/api/',           // API endpoints
                    '/auth/callback',  // Auth callback
                    '/auth/reset-password', // Password reset
                    '/_next/',         // Next.js internal
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
