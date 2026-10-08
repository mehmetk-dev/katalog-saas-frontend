"use client"

import Link from "next/link"
import { AlertTriangle, CheckCircle2, Mail } from "lucide-react"

import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/contexts/i18n-provider"

function useT() {
    const { t } = useTranslation()
    return (key: string, params?: Record<string, unknown>) => t(key, params) as string
}

export function VerifyEmailView() {
    const t = useT()
    return (
        <AuthShell
            icon={<Mail />}
            title={t("auth.verifyTitle")}
            description={t("auth.verifyDesc")}
            back={{ href: "/auth", label: t("auth.backToLogin") }}
        >
            <div className="space-y-2 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                <p>{t("auth.verifyStep")}</p>
                <p>{t("auth.checkSpam")}</p>
            </div>
            <Button asChild variant="outline" size="lg" className="mt-6 h-11 w-full bg-card">
                <Link href="/auth">{t("auth.backToLogin")}</Link>
            </Button>
        </AuthShell>
    )
}

export function EmailConfirmedView() {
    const t = useT()
    return (
        <AuthShell icon={<CheckCircle2 />} iconTone="success" title={t("auth.confirmedTitle")} description={t("auth.confirmedDesc")}>
            <Button asChild size="lg" className="h-11 w-full">
                <Link href="/dashboard">{t("auth.goToDashboard")}</Link>
            </Button>
        </AuthShell>
    )
}

export function AuthErrorView({ code }: { code?: string }) {
    const t = useT()
    return (
        <AuthShell
            icon={<AlertTriangle />}
            iconTone="brand"
            title={t("auth.errorPageTitle")}
            description={t("auth.errorPageDesc")}
        >
            {code && (
                <p className="mb-4 text-center font-mono text-xs text-muted-foreground">{t("auth.errorCode", { code })}</p>
            )}
            <Button asChild size="lg" className="h-11 w-full">
                <Link href="/auth">{t("auth.retry")}</Link>
            </Button>
        </AuthShell>
    )
}
