import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Montserrat } from "next/font/google"
import Script from "next/script"

import "./globals.css"
import { I18nProvider } from "@/lib/contexts/i18n-provider"
import { SessionWatcher } from "@/components/auth/session-watcher"
import { SITE_URL } from "@/lib/constants"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
  preload: true,
})

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-montserrat",
  display: "swap",
  preload: true,
  weight: ["300", "700", "900"],
});

const siteUrl = SITE_URL
const gaId = process.env.NEXT_PUBLIC_GA_ID

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dijital Ürün Kataloğu Oluşturucu | FogCatalog",
    template: "%s | FogCatalog",
  },
  description: "FogCatalog ile dakikalar içinde dijital ürün kataloğu oluşturun. PDF dışa aktarma, QR kod, online paylaşım ve 15+ profesyonel katalog şablonu kullanın.",
  keywords: [
    "katalog", "ürün kataloğu", "PDF katalog", "dijital katalog", "katalog oluşturma",
    "catalog builder", "digital catalog", "product catalog", "online catalog", "PDF catalog creator",
    "B2B catalog", "wholesale catalog builder", "whatsapp order catalog"
  ],
  authors: [{ name: "FogCatalog", url: siteUrl }],
  creator: "FogCatalog",
  publisher: "FogCatalog",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    alternateLocale: ["en_US"],
    url: siteUrl,
    siteName: "FogCatalog",
    title: "Dijital Ürün Kataloğu Oluşturucu | FogCatalog",
    description: "FogCatalog ile dakikalar içinde dijital ürün kataloğu oluşturun. PDF dışa aktarma, QR kod, online paylaşım ve 15+ profesyonel katalog şablonu kullanın.",
    images: [
      {
        url: "/og-image.webp",
        width: 1200,
        height: 630,
        type: "image/webp",
        alt: "FogCatalog - Digital Catalog Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dijital Ürün Kataloğu Oluşturucu | FogCatalog",
    description: "PDF, QR kod ve online paylaşım özellikli dijital ürün katalogları oluşturun.",
    images: ["/og-image.webp"],
    creator: "@fogcatalog",
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: '/favicon_io/favicon.ico' },
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/favicon_io/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: "/manifest.json",
  verification: {
    // Google Search Console doğrulama kodu eklenebilir
    // google: 'your-google-verification-code',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#7c3aed' },
    { media: '(prefers-color-scheme: dark)', color: '#5b21b6' },
  ],
}

// JSON-LD Structured Data - Software Application
const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FogCatalog',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Dakikalar içinde profesyonel dijital ürün katalogları oluşturun.',
  url: siteUrl,
  author: {
    '@type': 'Organization',
    name: 'FogCatalog',
    url: siteUrl,
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'TRY',
    description: 'Ücretsiz plan ile başlayın',
  },
}

// JSON-LD Structured Data - Organization (for brand recognition & Knowledge Graph)
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FogCatalog',
  url: siteUrl,
  logo: `${siteUrl}/icon.png`,
  description: 'Professional digital product catalog builder for businesses. Create stunning catalogs in minutes.',
  foundingDate: '2025',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    email: 'support@fogcatalog.com',
    availableLanguage: ['Turkish', 'English']
  },
  sameAs: [
    'https://twitter.com/fogcatalog',
    // Add other social media profiles when available
  ]
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data - Software Application */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
        />
        {/* JSON-LD Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
              }}
            />
          </>
        )}
        {/* Preconnect to the first-viewport demo image CDN. */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        {/* PWA */}
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon_io/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FogCatalog" />

      </head>
      <body
        className={`${inter.variable} ${montserrat.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <SessionWatcher />
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}




