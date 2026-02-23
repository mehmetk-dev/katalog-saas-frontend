"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n-provider"
import { type Catalog } from "@/lib/actions/catalogs"
import { useUser } from "@/lib/user-context"
import { usePdfExport } from "@/lib/hooks/use-pdf-export"
import { useCatalogActions } from "@/lib/hooks/use-catalog-actions"
import type { useBuilderState } from "@/lib/hooks/use-builder-state"

// ─── Types ──────────────────────────────────────────────────────────────────────

type BuilderState = ReturnType<typeof useBuilderState>

interface UseBuilderHandlersOptions {
    catalog: Catalog | null
    state: BuilderState
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export function useBuilderHandlers({ catalog, state }: UseBuilderHandlersOptions) {
    const router = useRouter()
    const { user, canExport, refreshUser } = useUser()
    const { t: baseT } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])

    // ─── Catalog CRUD Actions ──────────────────────────────────────────
    const {
        isPending,
        isUrlOutdated,
        handleSave,
        handlePushUpdates,
        handleUpdateSlug,
        handlePublish,
    } = useCatalogActions({
        currentCatalogId: state.currentCatalogId,
        catalog,
        isPublished: state.isPublished,
        user,
        getState: state.getState,
        catalogName: state.catalogName,
        hasUnsavedChanges: state.hasUnsavedChanges,
        isDirty: state.isDirty,
        setCatalogName: state.setCatalogName,
        setCurrentCatalogId: state.setCurrentCatalogId,
        setLastSavedState: state.setLastSavedState,
        setIsDirty: state.setIsDirty,
        setIsPublished: state.setIsPublished,
        setHasUnpushedChanges: state.setHasUnpushedChanges,
        refreshUser,
        t,
    })

    // ─── PDF Export ────────────────────────────────────────────────────
    const { isExporting, handleDownloadPDF, pdfProgress, cancelExport, closePdfModal } = usePdfExport({
        catalogName: state.catalogName,
        selectedProducts: state.selectedProducts,
        canExport,
        user,
        t,
        refreshUser,
        onShowUpgradeModal: () => state.setShowUpgradeModal(true),
    })

    // ─── UI Handlers ───────────────────────────────────────────────────
    const handleShare = useCallback(() => {
        if (!state.currentCatalogId || !catalog?.share_slug) {
            toast.error(t('toasts.saveCatalogFirst') as string)
            return
        }
        state.setShowShareModal(true)
    }, [state.currentCatalogId, catalog?.share_slug, t, state.setShowShareModal])

    const handleViewChange = useCallback((v: "split" | "editor" | "preview") => state.setView(v), [state.setView])

    const handleCatalogNameChange = useCallback((name: string) => state.setCatalogName(name), [state.setCatalogName])

    const handleExit = useCallback(() => {
        if (state.hasUnsavedChanges) {
            state.setShowExitDialog(true)
        } else {
            router.push('/dashboard')
        }
    }, [state.hasUnsavedChanges, state.setShowExitDialog, router])

    const handleExitWithoutSaving = useCallback(() => {
        state.setShowExitDialog(false)
        router.push('/dashboard')
    }, [state.setShowExitDialog, router])

    const handleSaveAndExit = useCallback(() => {
        handleSave()
        state.setShowExitDialog(false)
        setTimeout(() => router.push('/dashboard'), 1500)
    }, [handleSave, state.setShowExitDialog, router])

    return {
        // From useCatalogActions
        isPending,
        isUrlOutdated,
        handleSave,
        handlePushUpdates,
        handleUpdateSlug,
        handlePublish,

        // PDF
        isExporting,
        handleDownloadPDF,
        pdfProgress,
        cancelExport,
        closePdfModal,

        // UI
        handleShare,
        handleViewChange,
        handleCatalogNameChange,
        handleExit,
        handleExitWithoutSaving,
        handleSaveAndExit,

        // Translation helper
        t,
    }
}
