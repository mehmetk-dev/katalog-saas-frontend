'use client'

import { useEffect, useMemo } from 'react'
import { ServerCrash, RefreshCw, Heart, LayoutDashboard, WifiOff, AlertTriangle } from 'lucide-react'
import * as Sentry from "@sentry/nextjs"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Dashboard Error Boundary
 * - Backend/Network hatalarında: Tam sayfa hata (sidebar yok)
 * - Sayfa bazlı hatalarda: Sadece içerik alanında hata (sidebar korunur)
 */
export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Dashboard Error:', error)
        Sentry.captureException(error)
    }, [error])

    // Backend/Network hatası mı kontrol et
    const isSystemError = useMemo(() => {
        const message = error.message?.toLowerCase() || ''
        const name = error.name?.toLowerCase() || ''

        // Network ve Backend hata pattern'leri
        const systemErrorPatterns = [
            'fetch failed',
            'network',
            'econnrefused',
            'enotfound',
            'timeout',
            'backend',
            'api',
            'connection',
            '500',
            '502',
            '503',
            '504',
            'service unavailable',
            'internal server error',
        ]

        return systemErrorPatterns.some(pattern =>
            message.includes(pattern) || name.includes(pattern)
        )
    }, [error])

    // Sistem hatası: Tam sayfa göster (sidebar olmadan)
    if (isSystemError) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-100 dark:bg-[#03040a] p-4 overflow-hidden">
                {/* Decorative Background Effects */}
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none hidden dark:block" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/10 blur-[120px] rounded-full pointer-events-none hidden dark:block" />

                <Card className="w-full max-w-lg shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border-0 rounded-3xl overflow-hidden bg-white/95 dark:bg-[#080a12]/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500 relative z-10">
                    <CardHeader className="text-center pb-0 pt-10 bg-gradient-to-b from-red-50/50 dark:from-red-500/10 to-transparent">
                        <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-500/20 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-red-200/50 dark:shadow-red-900/20 rotate-3">
                            <WifiOff className="w-12 h-12 text-[#cf1414] dark:text-red-500" />
                        </div>
                        <CardTitle className="text-3xl font-montserrat font-black tracking-tighter text-slate-900 dark:text-white leading-none">
                            Sunuculara Ulaşılamıyor
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6 pb-10">
                        <div className="text-center space-y-4 px-4">
                            <p className="text-slate-600 dark:text-slate-400 text-lg font-medium leading-relaxed">
                                Backend sunucularına bağlanılamıyor. Bu geçici bir sorun olabilir.
                            </p>

                            <div className="p-5 bg-amber-50/50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 rounded-2xl flex items-start gap-4 text-left">
                                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                                <div className="space-y-2">
                                    <p className="text-sm text-amber-800 dark:text-amber-400 font-bold">Olası Nedenler:</p>
                                    <ul className="text-xs text-amber-700 dark:text-amber-500/80 space-y-1 list-disc list-inside">
                                        <li>Backend sunucusu çalışmıyor olabilir</li>
                                        <li>İnternet bağlantınızda sorun olabilir</li>
                                        <li>Sunucu bakımda olabilir</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-indigo-500/20 rounded-2xl flex items-start gap-3 text-left">
                                <Heart className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
                                <p className="text-xs text-indigo-800 dark:text-indigo-400">
                                    Sentry üzerinden hata bildirimi aldık. Teknik ekip sorunu en kısa sürede çözecek.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 px-4">
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full h-14 bg-[#cf1414] hover:bg-[#b01010] text-white font-montserrat font-bold shadow-xl shadow-red-500/30 transition-all rounded-2xl text-base"
                            >
                                <RefreshCw className="w-5 h-5 mr-2" />
                                SAYFAYI YENİLE
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => window.location.href = '/'}
                                className="w-full text-slate-500 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl h-12"
                            >
                                Ana Sayfaya Dön
                            </Button>
                        </div>

                        <div className="text-center pt-6 border-t border-slate-100 dark:border-white/5">
                            <span className="font-montserrat text-xl tracking-tighter">
                                <span className="font-black text-[#cf1414] uppercase">Fog</span>
                                <span className="font-light text-slate-900 dark:text-white">Catalog</span>
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Sayfa bazlı hata: Sidebar korunur
    return (
        <div className="h-[calc(100vh-140px)] flex items-center justify-center p-6 bg-transparent relative overflow-hidden">
            {/* Decorative Background for Inner Area */}
            <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none hidden dark:block" />

            <Card className="w-full max-w-lg shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border-0 rounded-3xl overflow-hidden bg-white/95 dark:bg-[#080a12]/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 relative z-10">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#cf1414]" />

                <CardHeader className="text-center pb-0 pt-10">
                    <div className="mx-auto w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 rotate-3 shadow-sm border border-red-100 dark:border-red-500/20">
                        <ServerCrash className="w-12 h-12 text-[#cf1414]" />
                    </div>
                    <CardTitle className="text-3xl font-montserrat font-black tracking-tighter text-slate-900 dark:text-white leading-none">
                        Bir Şeyler Ters Gitti
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 pt-6 pb-12">
                    <div className="text-center space-y-4 px-4">
                        <p className="text-slate-600 dark:text-slate-400 text-lg font-medium leading-relaxed">
                            Bu modülü yüklerken beklenmedik bir teknik aksaklık yaşandı. Teknik ekibimiz hemen ilgileniyor.
                        </p>

                        <div className="p-5 bg-red-50/50 dark:bg-red-500/5 border border-red-100/50 dark:border-red-500/10 rounded-2xl flex items-start gap-4 text-left shadow-sm">
                            <Heart className="w-6 h-6 text-[#cf1414] shrink-0 mt-0.5 animate-pulse" />
                            <div className="space-y-1">
                                <p className="text-sm text-[#cf1414] font-bold uppercase tracking-wider">Endişelenmeyin</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                                    Teknik ekibimiz şu an hata hakkında bilgilendirildi.
                                    FogCatalog ekibi olarak en kısa sürede sistemi normale döndüreceğiz.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 px-6 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => window.location.href = '/dashboard'}
                            className="flex-1 h-12 border-2 border-slate-100 dark:border-white/5 hover:border-[#cf1414] hover:text-[#cf1414] dark:bg-white/5 hover:dark:bg-white/10 font-montserrat font-bold transition-all rounded-2xl"
                        >
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            PANEL'E DÖN
                        </Button>
                        <Button
                            onClick={() => reset()}
                            className="flex-1 h-12 bg-[#cf1414] hover:bg-[#b01010] text-white font-montserrat font-bold shadow-xl shadow-red-500/20 transition-all rounded-2xl"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            TEKRAR DENE
                        </Button>
                    </div>

                    <div className="text-center pt-8 border-t border-slate-100 dark:border-white/5">
                        <span className="font-montserrat text-xl tracking-tighter">
                            <span className="font-black text-[#cf1414] uppercase">Fog</span>
                            <span className="font-light text-slate-900 dark:text-white">Catalog</span>
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

