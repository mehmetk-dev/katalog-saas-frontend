import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = SITE_URL

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
