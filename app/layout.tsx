import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Montserrat } from "next/font/google"

import "./globals.css"
import { I18nProvider } from "@/lib/i18n-provider"

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
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fogcatalog.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FogCatalog - Profesyonel Ürün Katalog Oluşturucu",
    template: "%s | FogCatalog",
  },
  description: "Dakikalar içinde profesyonel dijital ürün katalogları oluşturun. PDF indirme, QR kod, şablonlar ve daha fazlası. Ücretsiz başlayın!",
  keywords: [
    "katalog",
    "ürün kataloğu",
    "PDF katalog",
    "e-ticaret",
    "dijital katalog",
    "online katalog",
    "ürün listesi",
    "katalog oluşturucu",
    "B2B katalog",
    "toptan katalog"
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
    alternateLocale: "en_US",
    url: siteUrl,
    siteName: "FogCatalog",
    title: "FogCatalog - Profesyonel Ürün Katalog Oluşturucu",
    description: "Dakikalar içinde profesyonel dijital ürün katalogları oluşturun. PDF indirme, QR kod, şablonlar ve daha fazlası.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FogCatalog - Dijital Katalog Platformu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FogCatalog - Profesyonel Ürün Katalog Oluşturucu",
    description: "Dakikalar içinde profesyonel dijital ürün katalogları oluşturun.",
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

// JSON-LD Structured Data
const jsonLd = {
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}

