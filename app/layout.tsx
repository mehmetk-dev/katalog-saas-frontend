import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { I18nProvider } from "@/lib/i18n-provider"

const inter = Inter({
  subsets: ["latin"],
  display: 'swap', // Font swap for better performance
  preload: true,
})

export const metadata: Metadata = {
  title: "CatalogPro - Ürün Katalog Oluşturucu",
  description: "Dakikalar içinde profesyonel ürün katalogları oluşturun",
  keywords: ["katalog", "ürün kataloğu", "PDF katalog", "e-ticaret"],
  authors: [{ name: "CatalogPro" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "CatalogPro",
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#7c3aed',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* DNS Prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <I18nProvider>
          {children}
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  )
}
