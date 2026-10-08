'use client'

import { useEffect } from 'react'
import { ServerCrash, RefreshCw, ArrowLeft, Heart, WifiOff } from 'lucide-react'
import * as Sentry from "@sentry/nextjs"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/ui/logo'

function isConnectionErrorMessage(message?: string): boolean {
    const normalized = message?.toLowerCase() || ''
    return normalized.includes('backend') ||
        normalized.includes('fetch failed') ||
        normalized.includes('econnrefused')
}

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        Sentry.captureException(error)
    }, [error])

    const isConnectionError = isConnectionErrorMessage(error.message)

    const handleGoHome = () => {
        window.location.href = '/'
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 bg-muted/50">
            <Card className="w-full max-w-lg shadow-2xl border-t-8 border-t-brand rounded-2xl overflow-hidden bg-card">
                <CardHeader className="text-center pb-0 pt-10">
                    <div className="mx-auto w-20 h-20 bg-brand-soft rounded-2xl flex items-center justify-center mb-6 rotate-3">
                        {isConnectionError ? (
                            <WifiOff className="w-10 h-10 text-brand" />
                        ) : (
                            <ServerCrash className="w-10 h-10 text-brand" />
                        )}
                    </div>
                    <CardTitle className="text-3xl font-montserrat font-black tracking-tighter text-foreground leading-none">
                        Bir Şeyler Ters Gitti
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 pt-6 pb-12">
                    <div className="text-center space-y-4 px-4">
                        <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                            {isConnectionError
                                ? "Şu an sunucularımıza ulaşılamıyor. Teknik ekibimiz hemen ilgileniyor."
                                : "Sayfayı yüklerken beklenmedik bir teknik aksaklık yaşandı."
                            }
                        </p>

                        <div className="p-5 bg-brand-soft border border-brand/20 rounded-2xl flex items-start gap-4 text-left shadow-sm">
                            <Heart className="w-6 h-6 text-brand shrink-0 mt-0.5 animate-pulse" />
                            <div className="space-y-1">
                                <p className="text-sm text-brand font-bold uppercase tracking-wider">Endişelenmeyin</p>
                                <p className="text-xs text-muted-foreground leading-normal">
                                    Teknik ekibimiz (biziz o) şu an hata hakkında bilgilendirildi.
                                    FogCatalog ekibi olarak en kısa sürede sistemi normale döndüreceğiz.
                                </p>
                            </div>
                        </div>
                    </div>

                    {process.env.NODE_ENV === 'development' && error.digest && (
                        <div className="mx-6 p-3 bg-muted/50 border border-border rounded-lg">
                            <p className="text-[10px] font-mono text-muted-foreground break-all leading-tight">
                                Hata Kodu: {error.digest}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 px-6 pt-4">
                        <Button
                            variant="outline"
                            onClick={handleGoHome}
                            className="flex-1 h-12 border-2 border-border hover:border-brand hover:text-brand font-montserrat font-bold transition-all rounded-xl"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            VAZGEÇ
                        </Button>
                        <Button
                            onClick={() => reset()}
                            className="flex-1 h-12 bg-brand hover:bg-brand/90 text-brand-foreground font-montserrat font-bold shadow-xl shadow-brand/20 transition-all rounded-xl"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            TEKRAR DENE
                        </Button>
                    </div>

                    <div className="text-center pt-8 border-t border-border">
                        <Logo />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

