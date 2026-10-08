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
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-primary p-4 text-center text-primary-foreground">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-destructive">Something went wrong!</h2>
                <p className="text-muted-foreground">
                    Bu sayfayı yüklerken bir hata oluştu.
                </p>
                {process.env.NODE_ENV === "development" && (
                    <>
                        <p className="text-muted-foreground">
                            <span className="font-mono text-xs text-destructive">{error.message}</span>
                        </p>
                        {error.stack && (
                            <div className="mt-4 text-left max-w-2xl overflow-auto bg-primary p-4 rounded text-xs text-primary-foreground/70 font-mono">
                                {error.stack}
                            </div>
                        )}
                    </>
                )}
            </div>
            <Button
                onClick={() => reset()}
                variant="outline"
                className="bg-primary border-primary hover:bg-primary/90 text-primary-foreground"
            >
                Tekrar Dene
            </Button>
        </div>
    )
}
