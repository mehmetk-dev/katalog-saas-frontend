'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, Heart } from 'lucide-react'
import * as Sentry from "@sentry/nextjs"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to Sentry
        console.error('Global error:', error)
        Sentry.captureException(error)
    }, [error])

    return (
        <html lang="tr">
            <body>
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
                    <Card className="w-full max-w-md shadow-2xl border-2 border-red-100 overflow-hidden">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-10 h-10 text-red-600 animate-bounce" />
                            </div>
                            <CardTitle className="text-2xl font-black text-gray-900">Kritik Bir Durum!</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-center space-y-4">
                                <p className="text-gray-600 font-medium leading-relaxed">
                                    Beklenmedik bir şekilde uygulama genelinde bir sorun oluştu.
                                </p>

                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3 text-left shadow-sm">
                                    <Heart className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-900 leading-relaxed font-semibold">
                                        Panik yapmayın! Teknik ekibimiz (yani ben) şu an hata bildirimini Sentry üzerinden aldı. Hemen müdahale ediyorum, en kısa sürede her şey yoluna girecek.
                                    </p>
                                </div>
                            </div>

                            {process.env.NODE_ENV === 'development' && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                    <p className="text-[10px] font-mono text-red-800 break-all opacity-60">
                                        DEBUG: {error.message}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={() => reset()}
                                    className="w-full h-12 text-base font-bold bg-gray-900 hover:bg-black shadow-lg"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Sayfayı Yenile
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => window.location.href = '/'}
                                    className="w-full text-gray-500 font-semibold"
                                >
                                    <Home className="w-4 h-4 mr-2" />
                                    Ana Sayfaya Dön
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </body>
        </html>
    )
}
