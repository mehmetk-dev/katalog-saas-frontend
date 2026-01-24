'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home, Heart } from 'lucide-react'
import * as Sentry from "@sentry/nextjs"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Enforce reporting to Sentry
        console.error('Dashboard error:', error)
        Sentry.captureException(error)
    }, [error])

    return (
        <div className="flex-1 flex items-center justify-center p-6">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-red-500 overflow-hidden">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4 rotate-3 hover:rotate-0 transition-transform duration-300">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Bir Hata Oluştu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                    <div className="text-center space-y-3">
                        <p className="text-gray-600 leading-relaxed font-medium">
                            Dashboard yüklenirken beklenmedik bir sorun oluştu.
                        </p>
                        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3 text-left">
                            <Heart className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-800 leading-snug">
                                <strong>Merak etmeyin;</strong> teknik ekibimiz (yani ben) az önce durumdan haberdar oldu. Sorunu çözmek için hemen incelemeye başlıyorum.
                            </p>
                        </div>
                    </div>

                    {process.env.NODE_ENV === 'development' && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-[10px] font-mono text-red-800 break-all opacity-70">
                                DEBUG: {error.message}
                            </p>
                            {error.digest && (
                                <p className="text-[10px] text-red-600 mt-1 font-mono">
                                    ID: {error.digest}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            onClick={() => window.location.href = '/dashboard'}
                            className="h-11 font-semibold border-2 hover:bg-gray-50"
                        >
                            <Home className="w-4 h-4 mr-2" />
                            Dashboard
                        </Button>
                        <Button
                            onClick={() => reset()}
                            className="h-11 font-semibold shadow-md bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 border-0"
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
