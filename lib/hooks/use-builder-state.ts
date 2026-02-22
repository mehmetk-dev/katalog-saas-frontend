"use client"

import { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue, useTransition } from "react"
import { type Catalog } from "@/lib/actions/catalogs"
import { type Product } from "@/lib/actions/products"
import { useUser } from "@/lib/user-context"
import { type SavedState } from "@/lib/hooks/use-catalog-actions"
import {
    type BuilderCatalogData,
    buildSavedStateSnapshot,
    buildInitialCatalogState,
    resolveInitialPrimaryColor,
    normalizeLogoPosition,
    arrayFingerprint,
    SPLIT_PREVIEW_SOFT_LIMIT,
} from "@/components/builder/builder-utils"

// ─── Types ──────────────────────────────────────────────────────────────────────

export type BuilderView = "split" | "editor" | "preview"

interface UseBuilderStateOptions {
    catalog: Catalog | null
    products: Product[]
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export function useBuilderState({ catalog, products }: UseBuilderStateOptions) {
    const { user } = useUser()

    // ─── UI State ──────────────────────────────────────────────────────
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showExitDialog, setShowExitDialog] = useState(false)
    const [view, setView] = useState<BuilderView>("split")
    const [isMobile, setIsMobile] = useState(false)
    const [isSelectionUpdatePending, startSelectionTransition] = useTransition()

    // ─── Catalog Identity ──────────────────────────────────────────────
    const [currentCatalogId, setCurrentCatalogId] = useState(catalog?.id || null)
    const [isPublished, setIsPublished] = useState(catalog?.is_published || false)
    const [hasUnpushedChanges, setHasUnpushedChanges] = useState(false)

    // ─── Content State ─────────────────────────────────────────────────
    const [catalogName, setCatalogName] = useState(catalog?.name || "")
    const [catalogDescription, setCatalogDescription] = useState(catalog?.description || "")
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>(catalog?.product_ids || [])
    const [layout, setLayout] = useState(catalog?.layout || "grid")

    // ─── Design State ──────────────────────────────────────────────────
    const initialState = buildInitialCatalogState(catalog, user?.logo_url)

    const [primaryColor, setPrimaryColor] = useState(initialState.primaryColor)
    const [headerTextColor, setHeaderTextColor] = useState(initialState.headerTextColor)
    const [showPrices, setShowPrices] = useState(initialState.showPrices)
    const [showDescriptions, setShowDescriptions] = useState(initialState.showDescriptions)
    const [showAttributes, setShowAttributes] = useState(initialState.showAttributes)
    const [showSku, setShowSku] = useState(initialState.showSku)
    const [showUrls, setShowUrls] = useState(initialState.showUrls)
    const [showInSearch, setShowInSearch] = useState(initialState.showInSearch)
    const [columnsPerRow, setColumnsPerRow] = useState(initialState.columnsPerRow)
    const [backgroundColor, setBackgroundColor] = useState(initialState.backgroundColor)
    const [backgroundImage, setBackgroundImage] = useState<string | null>(initialState.backgroundImage)
    const [backgroundImageFit, setBackgroundImageFit] = useState(initialState.backgroundImageFit)
    const [backgroundGradient, setBackgroundGradient] = useState<string | null>(initialState.backgroundGradient)
    const [logoUrl, setLogoUrl] = useState<string | null>(initialState.logoUrl)
    const [logoPosition, setLogoPosition] = useState(initialState.logoPosition)
    const [logoSize, setLogoSize] = useState(initialState.logoSize)
    const [titlePosition, setTitlePosition] = useState(initialState.titlePosition)
    const [productImageFit, setProductImageFit] = useState(initialState.productImageFit)

    // ─── Storytelling State ────────────────────────────────────────────
    const [enableCoverPage, setEnableCoverPage] = useState(initialState.enableCoverPage)
    const [coverImageUrl, setCoverImageUrl] = useState<string | null>(initialState.coverImageUrl)
    const [coverDescription, setCoverDescription] = useState<string | null>(initialState.coverDescription)
    const [enableCategoryDividers, setEnableCategoryDividers] = useState(initialState.enableCategoryDividers)
    const [coverTheme, setCoverTheme] = useState(initialState.coverTheme)

    // ─── Dirty Tracking ────────────────────────────────────────────────
    const [isDirty, setIsDirty] = useState(false)
    const [lastSavedState, setLastSavedState] = useState<SavedState>(() =>
        buildSavedStateSnapshot(initialState)
    )

    // PERFORMANCE: O(1) fingerprint instead of O(n) comparison
    const selectedIdsFingerprint = useMemo(
        () => arrayFingerprint(selectedProductIds),
        [selectedProductIds]
    )
    const savedIdsFingerprint = useMemo(
        () => arrayFingerprint(lastSavedState.productIds),
        [lastSavedState.productIds]
    )

    const hasUnsavedChanges = useMemo(() => {
        return (
            catalogName !== lastSavedState.name ||
            catalogDescription !== lastSavedState.description ||
            selectedIdsFingerprint !== savedIdsFingerprint ||
            layout !== lastSavedState.layout ||
            coverTheme !== lastSavedState.coverTheme ||
            primaryColor !== lastSavedState.primaryColor ||
            showPrices !== lastSavedState.showPrices ||
            showDescriptions !== lastSavedState.showDescriptions ||
            showAttributes !== lastSavedState.showAttributes ||
            showSku !== lastSavedState.showSku ||
            showUrls !== lastSavedState.showUrls ||
            columnsPerRow !== lastSavedState.columnsPerRow ||
            backgroundColor !== lastSavedState.backgroundColor ||
            backgroundImage !== lastSavedState.backgroundImage ||
            logoUrl !== lastSavedState.logoUrl ||
            enableCoverPage !== lastSavedState.enableCoverPage ||
            enableCategoryDividers !== lastSavedState.enableCategoryDividers ||
            showInSearch !== lastSavedState.showInSearch ||
            backgroundGradient !== lastSavedState.backgroundGradient
        )
    }, [
        catalogName, catalogDescription, selectedIdsFingerprint, savedIdsFingerprint,
        layout, coverTheme, primaryColor, showPrices, showDescriptions,
        showAttributes, showSku, showUrls, columnsPerRow, backgroundColor,
        backgroundImage, logoUrl, enableCoverPage, enableCategoryDividers,
        showInSearch, lastSavedState, backgroundGradient
    ])

    // ─── State Ref (for hooks to read fresh data without re-render) ────
    const stateRef = useRef<BuilderCatalogData>(null!)
    stateRef.current = {
        catalogName, catalogDescription, selectedProductIds, layout, primaryColor,
        showPrices, showDescriptions, showAttributes, showSku, showUrls,
        columnsPerRow, backgroundColor, backgroundImage, backgroundImageFit,
        backgroundGradient, logoUrl, logoPosition, logoSize, titlePosition,
        productImageFit, headerTextColor, enableCoverPage, coverImageUrl,
        coverDescription, enableCategoryDividers, coverTheme, isPublished,
        showInSearch,
    }
    const getState = useCallback(() => stateRef.current, [])

    // ─── Product Derivations ───────────────────────────────────────────
    const productMap = useMemo(() => {
        const map = new Map<string, Product>()
        for (const p of products) map.set(p.id, p)
        return map
    }, [products])

    const selectedProducts = useMemo(() =>
        selectedProductIds
            .map((id) => productMap.get(id))
            .filter((p): p is Product => p !== undefined),
        [selectedProductIds, productMap]
    )
    const deferredSelectedProducts = useDeferredValue(selectedProducts)

    // ─── Beforeunload Warning ──────────────────────────────────────────
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                const message = 'Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmak istediğinizden emin misiniz?'
                e.preventDefault()
                e.returnValue = message
                return message
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [hasUnsavedChanges])

    // ─── Sync State on Catalog Change ──────────────────────────────────
    useEffect(() => {
        if (catalog) {
            const nextState = buildInitialCatalogState(catalog, user?.logo_url)

            setCatalogName(nextState.catalogName)
            setCatalogDescription(nextState.catalogDescription)
            setSelectedProductIds(nextState.selectedProductIds)
            setLayout(nextState.layout)
            setPrimaryColor(nextState.primaryColor)
            setHeaderTextColor(nextState.headerTextColor)
            setShowPrices(nextState.showPrices)
            setShowDescriptions(nextState.showDescriptions)
            setShowAttributes(nextState.showAttributes)
            setShowSku(nextState.showSku)
            setShowUrls(nextState.showUrls)
            setShowInSearch(nextState.showInSearch)
            setColumnsPerRow(nextState.columnsPerRow)
            setBackgroundColor(nextState.backgroundColor)
            setBackgroundImage(nextState.backgroundImage)
            setBackgroundImageFit(nextState.backgroundImageFit)
            setBackgroundGradient(nextState.backgroundGradient)
            setLogoUrl(nextState.logoUrl)
            setLogoPosition(nextState.logoPosition)
            setLogoSize(nextState.logoSize)
            setTitlePosition(nextState.titlePosition)
            setProductImageFit(nextState.productImageFit)
            setIsPublished(nextState.isPublished)
            setCurrentCatalogId(catalog.id || null)
            setEnableCoverPage(nextState.enableCoverPage)
            setCoverImageUrl(nextState.coverImageUrl)
            setCoverDescription(nextState.coverDescription)
            setEnableCategoryDividers(nextState.enableCategoryDividers)

            setLastSavedState(buildSavedStateSnapshot(nextState))
            setIsDirty(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [catalog?.id])

    // ─── Mobile Detection ──────────────────────────────────────────────
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            if (mobile && view === "split") {
                setView("editor")
            } else if (!mobile && view === "editor") {
                setView("split")
            }
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [view])

    // ─── Computed View ─────────────────────────────────────────────────
    const effectiveView = isMobile ? (view === "split" ? "editor" : view) : view

    const shouldUseSplitPreviewSampling = useMemo(() => {
        return effectiveView !== "preview" && deferredSelectedProducts.length > SPLIT_PREVIEW_SOFT_LIMIT
    }, [effectiveView, deferredSelectedProducts.length])

    const previewProducts = useMemo(() => {
        if (!shouldUseSplitPreviewSampling) return deferredSelectedProducts
        return deferredSelectedProducts.slice(0, SPLIT_PREVIEW_SOFT_LIMIT)
    }, [deferredSelectedProducts, shouldUseSplitPreviewSampling])

    // ─── Handlers ──────────────────────────────────────────────────────
    const handleSelectedProductIdsChange = useCallback((ids: string[]) => {
        startSelectionTransition(() => {
            setSelectedProductIds(ids)
        })
    }, [])

    // ─── Return ────────────────────────────────────────────────────────
    return {
        // UI state
        showUpgradeModal, setShowUpgradeModal,
        showShareModal, setShowShareModal,
        showExitDialog, setShowExitDialog,
        view, setView,
        isMobile,
        isSelectionUpdatePending,

        // Catalog identity
        currentCatalogId, setCurrentCatalogId,
        isPublished, setIsPublished,
        hasUnpushedChanges, setHasUnpushedChanges,

        // Content
        catalogName, setCatalogName,
        catalogDescription, setCatalogDescription,
        selectedProductIds, handleSelectedProductIdsChange,
        layout, setLayout,

        // Design
        primaryColor, setPrimaryColor,
        headerTextColor, setHeaderTextColor,
        showPrices, setShowPrices,
        showDescriptions, setShowDescriptions,
        showAttributes, setShowAttributes,
        showSku, setShowSku,
        showUrls, setShowUrls,
        showInSearch, setShowInSearch,
        columnsPerRow, setColumnsPerRow,
        backgroundColor, setBackgroundColor,
        backgroundImage, setBackgroundImage,
        backgroundImageFit, setBackgroundImageFit,
        backgroundGradient, setBackgroundGradient,
        logoUrl, setLogoUrl,
        logoPosition, setLogoPosition,
        logoSize, setLogoSize,
        titlePosition, setTitlePosition,
        productImageFit, setProductImageFit,

        // Storytelling
        enableCoverPage, setEnableCoverPage,
        coverImageUrl, setCoverImageUrl,
        coverDescription, setCoverDescription,
        enableCategoryDividers, setEnableCategoryDividers,
        coverTheme, setCoverTheme,

        // Dirty tracking
        isDirty, setIsDirty,
        lastSavedState, setLastSavedState,
        hasUnsavedChanges,

        // Derived
        getState,
        selectedProducts,
        deferredSelectedProducts,
        previewProducts,
        effectiveView,
        shouldUseSplitPreviewSampling,
    }
}
