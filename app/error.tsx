'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, ArrowLeft, Heart } from 'lucide-react'
import * as Sentry from "@sentry/nextjs"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to Sentry
        console.error('Page error:', error)
        Sentry.captureException(error)
    }, [error])

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl border-b-4 border-b-orange-500 rounded-2xl overflow-hidden">
                <CardHeader className="text-center pb-0">
                    <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                        <AlertCircle className="w-8 h-8 text-orange-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Bir Şeyler Ters Gitti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                    <div className="text-center space-y-4">
                        <p className="text-gray-600">
                            Bu sayfayı yüklerken beklenmedik bir hata ile karşılaştık.
                        </p>

                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3 text-left">
                            <Heart className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-orange-900 leading-snug">
                                <strong>Endişelenmeyin;</strong> teknik ekibimiz (yani ben) şu an hata hakkında bilgilendirildi. En kısa sürede düzelteceğimden emin olabilirsiniz.
                            </p>
                        </div>
                    </div>

                    {process.env.NODE_ENV === 'development' && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-[10px] font-mono text-gray-500 break-all leading-tight">
                                {error.message}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => window.history.back()}
                            className="flex-1 h-11 border-2 font-semibold"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Geri Dön
                        </Button>
                        <Button
                            onClick={() => reset()}
                            className="flex-1 h-11 bg-orange-600 hover:bg-orange-700 font-semibold shadow-lg shadow-orange-200"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Tekrar Dene
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
