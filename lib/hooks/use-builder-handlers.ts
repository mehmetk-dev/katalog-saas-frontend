"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { type Catalog } from "@/lib/actions/catalogs"
import { useUser } from "@/lib/contexts/user-context"
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
    const {
        currentCatalogId,
        hasUnsavedChanges,
        setCatalogName,
        setShowExitDialog,
        setShowShareModal,
        setShowUpgradeModal,
        setView,
    } = state
    const showUpgradeModal = useCallback(() => setShowUpgradeModal(true), [setShowUpgradeModal])

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
        catalogId: state.currentCatalogId,
        catalogName: state.catalogName,
        hasUnsavedChanges: state.hasUnsavedChanges,
        canExport,
        refreshUser,
        onSaveCatalog: handleSave,
        onShowUpgradeModal: showUpgradeModal,
    })

    // ─── UI Handlers ───────────────────────────────────────────────────
    const handleShare = useCallback(() => {
        if (!currentCatalogId || !catalog?.share_slug) {
            toast.error(t('toasts.saveCatalogFirst') as string)
            return
        }
        setShowShareModal(true)
    }, [currentCatalogId, catalog?.share_slug, setShowShareModal, t])

    const handleViewChange = useCallback((v: "split" | "editor" | "preview") => setView(v), [setView])

    const handleCatalogNameChange = useCallback((name: string) => setCatalogName(name), [setCatalogName])

    const handleExit = useCallback(() => {
        if (hasUnsavedChanges) {
            setShowExitDialog(true)
        } else {
            router.push('/dashboard')
        }
    }, [hasUnsavedChanges, setShowExitDialog, router])

    const handleExitWithoutSaving = useCallback(() => {
        setShowExitDialog(false)
        router.push('/dashboard')
    }, [setShowExitDialog, router])

    const handleSaveAndExit = useCallback(async () => {
        try {
            await handleSave()
            setShowExitDialog(false)
            router.push('/dashboard')
        } catch {
            // Save failed — user stays on page, toast already shown by handleSave
        }
    }, [handleSave, setShowExitDialog, router])

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
