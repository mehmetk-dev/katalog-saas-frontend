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
                <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#03040a] p-4 relative overflow-hidden">
                    {/* Decorative Background Effects */}
                    <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none hidden dark:block" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-violet-500/10 blur-[130px] rounded-full pointer-events-none hidden dark:block" />

                    <Card className="w-full max-w-lg shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border-0 rounded-3xl overflow-hidden bg-white/95 dark:bg-[#080a12]/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500 relative z-10">
                        <CardHeader className="text-center pb-2 pt-12">
                            <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-500/20 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-red-200/50 dark:shadow-red-900/20 rotate-3">
                                <AlertTriangle className="w-12 h-12 text-[#cf1414] dark:text-red-500" />
                            </div>
                            <CardTitle className="text-3xl font-montserrat font-black tracking-tighter text-slate-900 dark:text-white">Kritik Bir Hata!</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 pb-12">
                            <div className="text-center space-y-4 px-4">
                                <p className="text-slate-600 dark:text-slate-400 text-lg font-medium leading-relaxed">
                                    Beklenmedik bir şekilde uygulama genelinde bir sorun oluştu.
                                </p>

                                <div className="p-5 bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-indigo-500/20 rounded-2xl flex items-start gap-4 text-left shadow-sm">
                                    <Heart className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
                                    <p className="text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed font-semibold">
                                        Panik yapmayın! Teknik ekibimiz şu an hata bildirimini Sentry üzerinden aldı. Hemen müdahale ediyorum, en kısa sürede her şey yoluna girecek.
                                    </p>
                                </div>
                            </div>

                            {process.env.NODE_ENV === 'development' && (
                                <div className="mx-6 p-4 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-xl overflow-hidden">
                                    <p className="text-[10px] font-mono text-red-800 dark:text-red-400 break-all opacity-70">
                                        DEBUG: {error.message}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-3 px-6">
                                <Button
                                    onClick={() => reset()}
                                    className="w-full h-14 bg-slate-900 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-700 text-white font-montserrat font-bold shadow-xl transition-all rounded-2xl text-base"
                                >
                                    <RefreshCw className="w-5 h-5 mr-3" />
                                    SAYFAYI YENİLE
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => window.location.href = '/'}
                                    className="w-full h-12 text-slate-500 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
                                >
                                    <Home className="w-4 h-4 mr-2" />
                                    Ana Sayfaya Dön
                                </Button>
                            </div>

                            <div className="text-center pt-8 border-t border-slate-100 dark:border-white/5">
                                <span className="font-montserrat text-2xl tracking-tighter">
                                    <span className="font-black text-[#cf1414] uppercase">Fog</span>
                                    <span className="font-light text-slate-900 dark:text-white">Catalog</span>
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </body>
        </html>
    )
}
