'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
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
        console.error('Dashboard error:', error)
    }, [error])

    return (
        <div className="flex-1 flex items-center justify-center p-6">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-7 h-7 text-red-600" />
                    </div>
                    <CardTitle className="text-xl">Bir Hata Oluştu</CardTitle>
                    <CardDescription>
                        Dashboard yüklenirken bir sorun oluştu.
                        Lütfen tekrar deneyin.
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
                                    Error ID: {error.digest}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            onClick={() => window.location.href = '/dashboard'}
                        >
                            <Home className="w-4 h-4 mr-2" />
                            Dashboard
                        </Button>
                        <Button
                            onClick={() => reset()}
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
