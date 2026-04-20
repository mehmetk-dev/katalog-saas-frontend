"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useUser } from "@/lib/contexts/user-context"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { getPlanLimits } from "@/lib/constants"

/** Ham hata objesinin API 403 "Limit Reached" olup olmadığını tespit et. */
function isCatalogLimitError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false
    const e = error as { status?: number; message?: string }
    if (e.status === 403) return true
    if (typeof e.message === "string" && /limit reached/i.test(e.message)) return true
    return false
}

/**
 * Shared hook for catalog creation logic.
 * Used by DashboardHeader and DashboardClient to avoid duplication.
 *
 * Plan limit davranışı:
 *  - Optimistic pre-check: Client'taki `catalogsCount >= maxCatalogs` ise
 *    sunucuya hiç gitmeden `/dashboard/catalogs?limit_reached=true`'a yönlendirir
 *    (CatalogsPageClient bu query param'ını görünce upgrade modal'ını açar).
 *  - Sunucu yine de 403 dönerse (client state stale olabilir) aynı akışa düş.
 */
export function useCreateCatalog() {
    const [isCreating, setIsCreating] = useState(false)
    const router = useRouter()
    const { user, adjustCatalogsCount } = useUser()
    const { t: baseT, language } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])

    const handleLimitReached = useCallback(() => {
        toast.error(t("catalogs.limitReached"))
        router.push("/dashboard/catalogs?limit_reached=true")
    }, [router, t])

    const createNewCatalog = useCallback(async () => {
        if (isCreating) return

        // Client-side pre-check — gereksiz sunucu çağrısını engelle.
        if (user) {
            const { maxCatalogs } = getPlanLimits(user.plan)
            if (Number.isFinite(maxCatalogs) && (user.catalogsCount ?? 0) >= maxCatalogs) {
                handleLimitReached()
                return
            }
        }

        setIsCreating(true)
        const toastId = toast.loading(t("toasts.creatingCatalog"))

        try {
            const { createCatalog } = await import("@/lib/actions/catalogs")
            const currentDate = new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')
            const baseName = t("catalogs.newCatalog")

            const newCatalog = await createCatalog({
                name: `${baseName} - ${currentDate}`,
                layout: "modern-grid"
            })

            adjustCatalogsCount(1)
            toast.success(t("toasts.catalogCreated"), { id: toastId })
            router.push(`/dashboard/builder?id=${newCatalog.id}`)
        } catch (error: unknown) {
            // Sunucu limit hatası — güzel akış: toast + redirect.
            if (isCatalogLimitError(error)) {
                toast.dismiss(toastId)
                handleLimitReached()
                setIsCreating(false)
                return
            }

            console.error("Catalog creation error:", error)
            toast.error(error instanceof Error ? error.message : t("toasts.errorOccurred"), { id: toastId })
            setIsCreating(false)
        }
    }, [isCreating, user, t, adjustCatalogsCount, router, language, handleLimitReached])

    return { createNewCatalog, isCreating }
}
