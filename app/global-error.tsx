'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Global error:', error)
    }, [error])

    return (
        <html lang="tr">
            <body>
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
                    <Card className="w-full max-w-md shadow-lg">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <CardTitle className="text-2xl">Kritik Hata</CardTitle>
                            <CardDescription className="text-base">
                                Üzgünüz, uygulamada kritik bir hata oluştu.
                                Lütfen sayfayı yenilemeyi deneyin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {process.env.NODE_ENV === 'development' && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm font-mono text-red-800 break-all">
                                        {error.message}
                                    </p>
                                    {error.digest && (
                                        <p className="text-xs text-red-600 mt-2">
                                            Digest: {error.digest}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <Button
                                    onClick={() => reset()}
                                    className="w-full"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Tekrar Dene
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.href = '/'}
                                    className="w-full"
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
