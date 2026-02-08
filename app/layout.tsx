import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Montserrat } from "next/font/google"

import "./globals.css"
import { I18nProvider } from "@/lib/i18n-provider"
import { SessionWatcher } from "@/components/auth/session-watcher"

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
  weight: ["400", "500", "700", "900"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fogcatalog.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FogCatalog - Professional Product Catalog Builder | Katalog Oluşturucu",
    template: "%s | FogCatalog",
  },
  description: "Create stunning, professional digital product catalogs in minutes. 15+ premium templates, PDF export, QR codes, and interactive sharing. Start for free!",
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
    title: "FogCatalog - Professional Product Catalog Builder",
    description: "Create stunning, professional digital product catalogs in minutes. 15+ premium templates, PDF export, QR codes, and interactive sharing.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FogCatalog - Digital Catalog Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FogCatalog - Professional Product Catalog Builder",
    description: "Create stunning, professional digital product catalogs in minutes.",
    images: ["/og-image.png"],
    creator: "@fogcatalog",
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: '/icon.png' },
    ],
    apple: [
      { url: '/apple-icon.png' },
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
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '200',
    bestRating: '5',
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
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FogCatalog" />
        {/* DNS Prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preconnect to Supabase */}
        <link rel="preconnect" href="https://supabase.co" />
      </head>
      <body className={`${inter.variable} ${montserrat.variable} font-sans antialiased`}>
        <SessionWatcher />
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}

