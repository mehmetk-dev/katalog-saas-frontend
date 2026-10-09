'use client'

import { useEffect } from 'react'
import * as Sentry from "@sentry/nextjs"

/**
 * Kök layout'un da çöktüğü durum: bu sayfa layout'un yerine geçer, çeviri sağlayıcısı ve global
 * CSS'e güvenilemez. Bu yüzden iki dilli ve satır içi stillidir.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error('Global error:', error)
        Sentry.captureException(error)
    }, [error])

    return (
        <html lang="tr">
            <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif', background: '#fafafa', color: '#18181b' }}>
                <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <div style={{ maxWidth: 420, textAlign: 'center' }}>
                        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px' }}>Bir şeyler ters gitti</h1>
                        <p style={{ fontSize: 14, color: '#71717a', margin: '0 0 4px', lineHeight: 1.6 }}>
                            Sayfa yüklenirken beklenmedik bir hata oluştu. Lütfen tekrar deneyin.
                        </p>
                        <p style={{ fontSize: 13, color: '#a1a1aa', margin: '0 0 24px' }}>
                            Something went wrong. Please try again.
                        </p>
                        {error.digest ? (
                            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#a1a1aa', margin: '0 0 24px' }}>{error.digest}</p>
                        ) : null}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => reset()}
                                style={{ background: '#18181b', color: '#fff', border: 0, borderRadius: 8, padding: '10px 18px', fontSize: 14, cursor: 'pointer' }}
                            >
                                Tekrar dene / Try again
                            </button>
                            {/* Uygulama çöktüğü için istemci yönlendirmesi yerine tam sayfa yükleme */}
                            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                            <a href="/" style={{ border: '1px solid #e4e4e7', borderRadius: 8, padding: '10px 18px', fontSize: 14, color: '#18181b', textDecoration: 'none' }}>
                                Ana sayfa / Home
                            </a>
                        </div>
                    </div>
                </main>
            </body>
        </html>
    )
}
