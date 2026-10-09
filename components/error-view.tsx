"use client"

import { useEffect } from "react"
import Link from "next/link"
import { RefreshCw, ServerCrash, WifiOff } from "lucide-react"
import * as Sentry from "@sentry/nextjs"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"

/**
 * Sunucuya ulaşılamadığını gösteren hata mesajları. Önceden dashboard hata sayfası mesajda "api"
 * geçen her hatayı (ör. api.error.notFound) "sunuculara ulaşılamıyor" sayıyordu.
 */
const CONNECTION_PATTERNS = ["fetch failed", "failed to fetch", "econnrefused", "enotfound", "network", "api.error.serviceunavailable", "api.error.serverunavailable", "api.error.gatewaytimeout"]

export function isConnectionError(error: Error): boolean {
    const text = `${error.name} ${error.message}`.toLowerCase()
    return CONNECTION_PATTERNS.some((pattern) => text.includes(pattern))
}

interface ErrorViewProps {
    error: Error & { digest?: string }
    reset: () => void
    /** Hatadan çıkış bağlantısı */
    home: { href: string; labelKey: string }
    className?: string
}

/** Public site, panel ve admin hata sayfalarının ortak görünümü */
export function ErrorView({ error, reset, home, className }: ErrorViewProps) {
    const { t } = useTranslation()
    const connection = isConnectionError(error)

    useEffect(() => {
        Sentry.captureException(error)
    }, [error])

    const Icon = connection ? WifiOff : ServerCrash

    return (
        <div className={cn("flex min-h-[70vh] items-center justify-center p-6", className)}>
            <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-destructive-soft text-destructive">
                    <Icon className="size-6" aria-hidden />
                </span>
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        {connection ? t("errorPage.connectionTitle") : t("errorPage.title")}
                    </h1>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        {connection ? t("errorPage.connectionDesc") : t("errorPage.desc")}
                    </p>
                </div>
                {error.digest ? (
                    <p className="font-mono text-xs text-muted-foreground">
                        {t("errorPage.code")}: {error.digest}
                    </p>
                ) : null}
                {process.env.NODE_ENV === "development" ? (
                    <pre className="max-h-40 w-full overflow-auto rounded-lg border bg-muted p-3 text-left text-xs text-muted-foreground">
                        {error.message}
                    </pre>
                ) : null}
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Button onClick={() => (connection ? window.location.reload() : reset())}>
                        <RefreshCw className="size-4" aria-hidden />
                        {t("errorPage.retry")}
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={home.href}>{t(home.labelKey)}</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
