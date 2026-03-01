"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useUser } from "@/lib/contexts/user-context"
import { useTranslation } from "@/lib/contexts/i18n-provider"

/**
 * Shared hook for catalog creation logic.
 * Used by DashboardHeader and DashboardClient to avoid duplication.
 */
export function useCreateCatalog() {
    const [isCreating, setIsCreating] = useState(false)
    const router = useRouter()
    const { adjustCatalogsCount } = useUser()
    const { t: baseT, language } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])

    const createNewCatalog = useCallback(async () => {
        if (isCreating) return

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
            console.error("Catalog creation error:", error)
            toast.error(error instanceof Error ? error.message : t("toasts.errorOccurred"), { id: toastId })
            setIsCreating(false)
        }
    }, [isCreating, t, adjustCatalogsCount, router, language])

    return { createNewCatalog, isCreating }
}
