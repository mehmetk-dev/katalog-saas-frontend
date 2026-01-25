'use client'

import { useEffect } from 'react'
import { ServerCrash, RefreshCw, Heart, LayoutDashboard } from 'lucide-react'
import * as Sentry from "@sentry/nextjs"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Dashboard Error Boundary
 * This ensures that local UI bugs don't crash the entire app (hiding the sidebar).
 * It uses the same 'heart-themed' design for brand consistency.
 */
export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Dashboard Local Error:', error)
        Sentry.captureException(error)
    }, [error])

    return (
        <div className="h-[calc(100vh-140px)] flex items-center justify-center p-6 bg-slate-50/20">
            <Card className="w-full max-w-lg shadow-2xl border-t-8 border-t-[#cf1414] rounded-2xl overflow-hidden bg-white animate-in fade-in zoom-in-95 duration-300">
                <CardHeader className="text-center pb-0 pt-10">
                    <div className="mx-auto w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mb-6 rotate-3">
                        <ServerCrash className="w-10 h-10 text-[#cf1414]" />
                    </div>
                    <CardTitle className="text-3xl font-montserrat font-black tracking-tighter text-slate-900 leading-none">
                        Bir Şeyler Ters Gitti
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 pt-6 pb-12">
                    <div className="text-center space-y-4 px-4">
                        <p className="text-slate-600 text-lg font-medium leading-relaxed">
                            Bu modülü yüklerken beklenmedik bir teknik aksaklık yaşandı. Teknik ekibimiz hemen ilgileniyor.
                        </p>

                        <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4 text-left shadow-sm">
                            <Heart className="w-6 h-6 text-[#cf1414] shrink-0 mt-0.5 animate-pulse" />
                            <div className="space-y-1">
                                <p className="text-sm text-[#cf1414] font-bold uppercase tracking-wider">Endişelenmeyin</p>
                                <p className="text-xs text-slate-600 leading-normal">
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
                            className="flex-1 h-12 border-2 border-slate-200 hover:border-[#cf1414] hover:text-[#cf1414] font-montserrat font-bold transition-all rounded-xl"
                        >
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            PANEL'E DÖN
                        </Button>
                        <Button
                            onClick={() => reset()}
                            className="flex-1 h-12 bg-[#cf1414] hover:bg-[#b01010] text-white font-montserrat font-bold shadow-xl shadow-red-500/20 transition-all rounded-xl"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            TEKRAR DENE
                        </Button>
                    </div>

                    <div className="text-center pt-8 border-t border-slate-50">
                        <span className="font-montserrat text-xl tracking-tighter">
                            <span className="font-black text-[#cf1414] uppercase">Fog</span>
                            <span className="font-light text-slate-900">Catalog</span>
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
