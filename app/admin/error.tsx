"use client" // Error components must be Client Components

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Admin route error:", error)
    }, [error])

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-950 p-4 text-center text-white">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-red-500">Something went wrong!</h2>
                <p className="text-slate-400">
                    Bu sayfayı yüklerken bir hata oluştu:
                    <br />
                    <span className="font-mono text-xs text-red-400">{error.message}</span>
                </p>
                {error.stack && (
                    <div className="mt-4 text-left max-w-2xl overflow-auto bg-slate-900 p-4 rounded text-xs text-slate-300 font-mono">
                        {error.stack}
                    </div>
                )}
            </div>
            <Button
                onClick={() => reset()}
                variant="outline"
                className="bg-slate-900 border-slate-800 hover:bg-slate-800 text-white"
            >
                Tekrar Dene
            </Button>
        </div>
    )
}
