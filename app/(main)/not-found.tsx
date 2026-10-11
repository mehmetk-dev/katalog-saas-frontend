"use client"

import Link from "next/link"
import { FileQuestion } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { useTranslation } from "@/lib/contexts/i18n-provider"

/** Hata sayfalarıyla (ErrorView) aynı düzen; panel kabuğu dışında gösterildiği için logo içerir */
export default function NotFound() {
    const { t } = useTranslation()

    return (
        <main className="flex min-h-dvh items-center justify-center bg-background p-6">
            <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
                <Link href="/" className="mb-5 transition-opacity hover:opacity-80">
                    <Logo size="lg" />
                </Link>
                <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <FileQuestion className="size-6" aria-hidden />
                </span>
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground tabular-nums">404</p>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("notFound.title")}</h1>
                    <p className="text-sm leading-relaxed text-muted-foreground">{t("notFound.text")}</p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Button asChild>
                        <Link href="/">{t("notFound.home")}</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard">{t("notFound.dashboard")}</Link>
                    </Button>
                </div>
            </div>
        </main>
    )
}
