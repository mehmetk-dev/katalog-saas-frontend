"use client"

import { useReducer, useEffect, useRef, useMemo, useCallback, useDeferredValue, useTransition } from "react"
import { type Catalog } from "@/lib/actions/catalogs"
import { type Product } from "@/lib/actions/products"
import { useUser } from "@/lib/contexts/user-context"
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
import { useWindowSize } from "@/lib/hooks/use-window-size"

// ─── Types ──────────────────────────────────────────────────────────────────────

export type BuilderView = "split" | "editor" | "preview"

/** Consolidated state managed by the builder reducer */
export interface BuilderCoreState {
    // UI
    showUpgradeModal: boolean
    showShareModal: boolean
    showExitDialog: boolean
    view: BuilderView
    // Catalog Identity
    currentCatalogId: string | null
    isPublished: boolean
    hasUnpushedChanges: boolean
    // Content
    catalogName: string
    catalogDescription: string
    selectedProductIds: string[]
    layout: string
    // Design
    primaryColor: string
    headerTextColor: string
    showPrices: boolean
    showDescriptions: boolean
    showAttributes: boolean
    showSku: boolean
    showUrls: boolean
    showInSearch: boolean
    columnsPerRow: number
    backgroundColor: string
    backgroundImage: string | null
    backgroundImageFit: NonNullable<Catalog['background_image_fit']>
    backgroundGradient: string | null
    logoUrl: string | null
    logoPosition: Catalog['logo_position']
    logoSize: Catalog['logo_size']
    titlePosition: Catalog['title_position']
    productImageFit: NonNullable<Catalog['product_image_fit']>
    // Storytelling
    enableCoverPage: boolean
    coverImageUrl: string | null
    coverDescription: string | null
    enableCategoryDividers: boolean
    categoryOrder: string[]
    coverTheme: string
    // Dirty Tracking
    isDirty: boolean
    lastSavedState: SavedState
}

/** Discriminated union for all builder actions */
type BuilderAction =
    | { type: 'UPDATE'; payload: Partial<BuilderCoreState> }
    | { type: 'SYNC_CATALOG'; payload: BuilderCoreState }

function builderReducer(state: BuilderCoreState, action: BuilderAction): BuilderCoreState {
    switch (action.type) {
        case 'UPDATE':
            return { ...state, ...action.payload }
        case 'SYNC_CATALOG':
            return action.payload
        default:
            return state
    }
}

interface UseBuilderStateOptions {
    catalog: Catalog | null
    products: Product[]
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export function useBuilderState({ catalog, products }: UseBuilderStateOptions) {
    const { user } = useUser()

    // PERF(F5): Memoize — only needed at mount; catalog sync effect handles updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const initialState = useMemo(() => buildInitialCatalogState(catalog, user?.logo_url), [])
    const initialSavedState = useMemo(() => buildSavedStateSnapshot(initialState), [initialState])

    // ─── P2: Consolidated useReducer instead of 30+ useState calls ─────
    const [state, dispatch] = useReducer(builderReducer, undefined, (): BuilderCoreState => ({
        // UI
        showUpgradeModal: false,
        showShareModal: false,
        showExitDialog: false,
        view: "split",
        // Catalog Identity
        currentCatalogId: catalog?.id || null,
        isPublished: catalog?.is_published || false,
        hasUnpushedChanges: false,
        // Content
        catalogName: catalog?.name || "",
        catalogDescription: catalog?.description || "",
        // FIX: product_ids may contain stale references to deleted products.
        // Initial cleanup happens in the useEffect below after productMap is ready.
        selectedProductIds: catalog?.product_ids || [],
        layout: catalog?.layout || "grid",
        // Design (from initialState)
        primaryColor: initialState.primaryColor,
        headerTextColor: initialState.headerTextColor,
        showPrices: initialState.showPrices,
        showDescriptions: initialState.showDescriptions,
        showAttributes: initialState.showAttributes,
        showSku: initialState.showSku,
        showUrls: initialState.showUrls,
        showInSearch: initialState.showInSearch,
        columnsPerRow: initialState.columnsPerRow,
        backgroundColor: initialState.backgroundColor,
        backgroundImage: initialState.backgroundImage,
        backgroundImageFit: initialState.backgroundImageFit,
        backgroundGradient: initialState.backgroundGradient,
        logoUrl: initialState.logoUrl,
        logoPosition: initialState.logoPosition,
        logoSize: initialState.logoSize,
        titlePosition: initialState.titlePosition,
        productImageFit: initialState.productImageFit,
        // Storytelling
        enableCoverPage: initialState.enableCoverPage,
        coverImageUrl: initialState.coverImageUrl,
        coverDescription: initialState.coverDescription,
        enableCategoryDividers: initialState.enableCategoryDividers,
        categoryOrder: initialState.categoryOrder,
        coverTheme: initialState.coverTheme,
        // Dirty
        isDirty: false,
        lastSavedState: initialSavedState,
    }))

    const [isSelectionUpdatePending, startSelectionTransition] = useTransition()
    // PERF(F6): Shared resize listener instead of dedicated one
    const { width: windowWidth } = useWindowSize()
    const isMobile = windowWidth < 768

    // ─── Stable setter helpers (dispatch is stable) ────────────────────
    // useMemo with [] is safe because dispatch identity never changes
    const setters = useMemo(() => ({
        setShowUpgradeModal: (v: boolean) => dispatch({ type: 'UPDATE', payload: { showUpgradeModal: v } }),
        setShowShareModal: (v: boolean) => dispatch({ type: 'UPDATE', payload: { showShareModal: v } }),
        setShowExitDialog: (v: boolean) => dispatch({ type: 'UPDATE', payload: { showExitDialog: v } }),
        setView: (v: BuilderView) => dispatch({ type: 'UPDATE', payload: { view: v } }),
        setCurrentCatalogId: (v: string | null) => dispatch({ type: 'UPDATE', payload: { currentCatalogId: v } }),
        setIsPublished: (v: boolean) => dispatch({ type: 'UPDATE', payload: { isPublished: v } }),
        setHasUnpushedChanges: (v: boolean) => dispatch({ type: 'UPDATE', payload: { hasUnpushedChanges: v } }),
        setCatalogName: (v: string) => dispatch({ type: 'UPDATE', payload: { catalogName: v } }),
        setCatalogDescription: (v: string) => dispatch({ type: 'UPDATE', payload: { catalogDescription: v } }),
        setLayout: (v: string) => dispatch({ type: 'UPDATE', payload: { layout: v } }),
        setPrimaryColor: (v: string) => dispatch({ type: 'UPDATE', payload: { primaryColor: v } }),
        setHeaderTextColor: (v: string) => dispatch({ type: 'UPDATE', payload: { headerTextColor: v } }),
        setShowPrices: (v: boolean) => dispatch({ type: 'UPDATE', payload: { showPrices: v } }),
        setShowDescriptions: (v: boolean) => dispatch({ type: 'UPDATE', payload: { showDescriptions: v } }),
        setShowAttributes: (v: boolean) => dispatch({ type: 'UPDATE', payload: { showAttributes: v } }),
        setShowSku: (v: boolean) => dispatch({ type: 'UPDATE', payload: { showSku: v } }),
        setShowUrls: (v: boolean) => dispatch({ type: 'UPDATE', payload: { showUrls: v } }),
        setShowInSearch: (v: boolean) => dispatch({ type: 'UPDATE', payload: { showInSearch: v } }),
        setColumnsPerRow: (v: number) => dispatch({ type: 'UPDATE', payload: { columnsPerRow: v } }),
        setBackgroundColor: (v: string) => dispatch({ type: 'UPDATE', payload: { backgroundColor: v } }),
        setBackgroundImage: (v: string | null) => dispatch({ type: 'UPDATE', payload: { backgroundImage: v } }),
        setBackgroundImageFit: (v: NonNullable<Catalog['background_image_fit']>) => dispatch({ type: 'UPDATE', payload: { backgroundImageFit: v } }),
        setBackgroundGradient: (v: string | null) => dispatch({ type: 'UPDATE', payload: { backgroundGradient: v } }),
        setLogoUrl: (v: string | null) => dispatch({ type: 'UPDATE', payload: { logoUrl: v } }),
        setLogoPosition: (v: Catalog['logo_position']) => dispatch({ type: 'UPDATE', payload: { logoPosition: v } }),
        setLogoSize: (v: Catalog['logo_size']) => dispatch({ type: 'UPDATE', payload: { logoSize: v } }),
        setTitlePosition: (v: Catalog['title_position']) => dispatch({ type: 'UPDATE', payload: { titlePosition: v } }),
        setProductImageFit: (v: NonNullable<Catalog['product_image_fit']>) => dispatch({ type: 'UPDATE', payload: { productImageFit: v } }),
        setEnableCoverPage: (v: boolean) => dispatch({ type: 'UPDATE', payload: { enableCoverPage: v } }),
        setCoverImageUrl: (v: string | null) => dispatch({ type: 'UPDATE', payload: { coverImageUrl: v } }),
        setCoverDescription: (v: string | null) => dispatch({ type: 'UPDATE', payload: { coverDescription: v } }),
        setEnableCategoryDividers: (v: boolean) => dispatch({ type: 'UPDATE', payload: { enableCategoryDividers: v } }),
        setCategoryOrder: (v: string[]) => dispatch({ type: 'UPDATE', payload: { categoryOrder: v } }),
        setCoverTheme: (v: string) => dispatch({ type: 'UPDATE', payload: { coverTheme: v } }),
        setIsDirty: (v: boolean) => dispatch({ type: 'UPDATE', payload: { isDirty: v } }),
        setLastSavedState: (v: SavedState) => dispatch({ type: 'UPDATE', payload: { lastSavedState: v } }),
    }), [])  // dispatch is stable — safe to omit from deps

    // PERFORMANCE: O(1) fingerprint instead of O(n) comparison
    const selectedIdsFingerprint = useMemo(
        () => arrayFingerprint(state.selectedProductIds),
        [state.selectedProductIds]
    )
    const savedIdsFingerprint = useMemo(
        () => arrayFingerprint(state.lastSavedState.productIds),
        [state.lastSavedState.productIds]
    )

    // FIX(F11): Compare ALL design fields — aligned with buildSavedStateSnapshot
    const hasUnsavedChanges = useMemo(() => {
        const s = state
        const ls = s.lastSavedState
        return (
            s.catalogName !== ls.name ||
            s.catalogDescription !== ls.description ||
            selectedIdsFingerprint !== savedIdsFingerprint ||
            s.layout !== ls.layout ||
            s.coverTheme !== ls.coverTheme ||
            s.primaryColor !== ls.primaryColor ||
            s.headerTextColor !== ls.headerTextColor ||
            s.showPrices !== ls.showPrices ||
            s.showDescriptions !== ls.showDescriptions ||
            s.showAttributes !== ls.showAttributes ||
            s.showSku !== ls.showSku ||
            s.showUrls !== ls.showUrls ||
            s.columnsPerRow !== ls.columnsPerRow ||
            s.backgroundColor !== ls.backgroundColor ||
            s.backgroundImage !== ls.backgroundImage ||
            s.backgroundImageFit !== ls.backgroundImageFit ||
            s.backgroundGradient !== ls.backgroundGradient ||
            s.logoUrl !== ls.logoUrl ||
            s.logoPosition !== ls.logoPosition ||
            s.logoSize !== ls.logoSize ||
            s.titlePosition !== ls.titlePosition ||
            s.productImageFit !== ls.productImageFit ||
            s.enableCoverPage !== ls.enableCoverPage ||
            s.coverImageUrl !== ls.coverImageUrl ||
            s.coverDescription !== ls.coverDescription ||
            s.enableCategoryDividers !== ls.enableCategoryDividers ||
            arrayFingerprint(s.categoryOrder) !== arrayFingerprint(ls.categoryOrder) ||
            s.showInSearch !== ls.showInSearch
        )
    }, [state, selectedIdsFingerprint, savedIdsFingerprint])

    // ─── State Ref (for hooks to read fresh data without re-render) ────
    const stateRef = useRef<BuilderCatalogData | null>(null)
    stateRef.current = {
        catalogName: state.catalogName,
        catalogDescription: state.catalogDescription,
        selectedProductIds: state.selectedProductIds,
        layout: state.layout,
        primaryColor: state.primaryColor,
        showPrices: state.showPrices,
        showDescriptions: state.showDescriptions,
        showAttributes: state.showAttributes,
        showSku: state.showSku,
        showUrls: state.showUrls,
        columnsPerRow: state.columnsPerRow,
        backgroundColor: state.backgroundColor,
        backgroundImage: state.backgroundImage,
        backgroundImageFit: state.backgroundImageFit,
        backgroundGradient: state.backgroundGradient,
        logoUrl: state.logoUrl,
        logoPosition: state.logoPosition,
        logoSize: state.logoSize,
        titlePosition: state.titlePosition,
        productImageFit: state.productImageFit,
        headerTextColor: state.headerTextColor,
        enableCoverPage: state.enableCoverPage,
        coverImageUrl: state.coverImageUrl,
        coverDescription: state.coverDescription,
        enableCategoryDividers: state.enableCategoryDividers,
        categoryOrder: state.categoryOrder,
        coverTheme: state.coverTheme,
        isPublished: state.isPublished,
        showInSearch: state.showInSearch,
    }
    const getState = useCallback((): BuilderCatalogData => {
        // stateRef is always set synchronously after useRef, safe to assert
        return stateRef.current!
    }, [])

    // ─── Product Derivations ───────────────────────────────────────────
    const productMap = useMemo(() => {
        const map = new Map<string, Product>()
        for (const p of products) map.set(p.id, p)
        return map
    }, [products])

    // FIX: One-time cleanup — remove stale product IDs (deleted products) from selectedProductIds
    // This prevents sending hundreds of invalid UUIDs to the backend on save.
    const hasCleanedStaleIds = useRef(false)
    useEffect(() => {
        if (hasCleanedStaleIds.current || productMap.size === 0) return
        hasCleanedStaleIds.current = true
        const currentIds = state.selectedProductIds
        const validIds = currentIds.filter(id => productMap.has(id))
        if (validIds.length !== currentIds.length) {
            console.warn(`[BuilderState] Cleaned ${currentIds.length - validIds.length} stale product IDs from catalog`)
            dispatch({ type: 'UPDATE', payload: { selectedProductIds: validIds } })
        }
    }, [productMap, state.selectedProductIds])

    const selectedProducts = useMemo(() =>
        state.selectedProductIds
            .map((id) => productMap.get(id))
            .filter((p): p is Product => p !== undefined),
        [state.selectedProductIds, productMap]
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

    // ─── Sync State on Catalog Change (P2: single dispatch replaces 25+ setters) ─
    useEffect(() => {
        if (catalog) {
            const nextState = buildInitialCatalogState(catalog, user?.logo_url)
            dispatch({
                type: 'SYNC_CATALOG',
                payload: {
                    // Preserve UI flags
                    showUpgradeModal: false,
                    showShareModal: false,
                    showExitDialog: false,
                    view: state.view,
                    // Catalog identity
                    currentCatalogId: catalog.id || null,
                    isPublished: nextState.isPublished,
                    hasUnpushedChanges: false,
                    // Content
                    catalogName: nextState.catalogName,
                    catalogDescription: nextState.catalogDescription,
                    selectedProductIds: nextState.selectedProductIds,
                    layout: nextState.layout,
                    // Design
                    primaryColor: nextState.primaryColor,
                    headerTextColor: nextState.headerTextColor,
                    showPrices: nextState.showPrices,
                    showDescriptions: nextState.showDescriptions,
                    showAttributes: nextState.showAttributes,
                    showSku: nextState.showSku,
                    showUrls: nextState.showUrls,
                    showInSearch: nextState.showInSearch,
                    columnsPerRow: nextState.columnsPerRow,
                    backgroundColor: nextState.backgroundColor,
                    backgroundImage: nextState.backgroundImage,
                    backgroundImageFit: nextState.backgroundImageFit,
                    backgroundGradient: nextState.backgroundGradient,
                    logoUrl: nextState.logoUrl,
                    logoPosition: nextState.logoPosition,
                    logoSize: nextState.logoSize,
                    titlePosition: nextState.titlePosition,
                    productImageFit: nextState.productImageFit,
                    // Storytelling
                    enableCoverPage: nextState.enableCoverPage,
                    coverImageUrl: nextState.coverImageUrl,
                    coverDescription: nextState.coverDescription,
                    enableCategoryDividers: nextState.enableCategoryDividers,
                    categoryOrder: nextState.categoryOrder,
                    coverTheme: nextState.coverTheme,
                    // Dirty
                    isDirty: false,
                    lastSavedState: buildSavedStateSnapshot(nextState),
                },
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [catalog?.id])

    // PERF(F6): Auto-fix view on mobile/desktop switch (no separate resize listener)
    useEffect(() => {
        if (isMobile && state.view === "split") {
            dispatch({ type: 'UPDATE', payload: { view: "editor" } })
        } else if (!isMobile && state.view === "editor") {
            dispatch({ type: 'UPDATE', payload: { view: "split" } })
        }
    }, [isMobile, state.view])

    // ─── Computed View ─────────────────────────────────────────────────
    const effectiveView = isMobile ? (state.view === "split" ? "editor" : state.view) : state.view

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
            dispatch({ type: 'UPDATE', payload: { selectedProductIds: ids } })
        })
    }, [])

    // ─── Return ────────────────────────────────────────────────────────
    return {
        // UI state
        showUpgradeModal: state.showUpgradeModal, setShowUpgradeModal: setters.setShowUpgradeModal,
        showShareModal: state.showShareModal, setShowShareModal: setters.setShowShareModal,
        showExitDialog: state.showExitDialog, setShowExitDialog: setters.setShowExitDialog,
        view: state.view, setView: setters.setView,
        isMobile,
        isSelectionUpdatePending,

        // Catalog identity
        currentCatalogId: state.currentCatalogId, setCurrentCatalogId: setters.setCurrentCatalogId,
        isPublished: state.isPublished, setIsPublished: setters.setIsPublished,
        hasUnpushedChanges: state.hasUnpushedChanges, setHasUnpushedChanges: setters.setHasUnpushedChanges,

        // Content
        catalogName: state.catalogName, setCatalogName: setters.setCatalogName,
        catalogDescription: state.catalogDescription, setCatalogDescription: setters.setCatalogDescription,
        selectedProductIds: state.selectedProductIds, handleSelectedProductIdsChange,
        layout: state.layout, setLayout: setters.setLayout,

        // Design
        primaryColor: state.primaryColor, setPrimaryColor: setters.setPrimaryColor,
        headerTextColor: state.headerTextColor, setHeaderTextColor: setters.setHeaderTextColor,
        showPrices: state.showPrices, setShowPrices: setters.setShowPrices,
        showDescriptions: state.showDescriptions, setShowDescriptions: setters.setShowDescriptions,
        showAttributes: state.showAttributes, setShowAttributes: setters.setShowAttributes,
        showSku: state.showSku, setShowSku: setters.setShowSku,
        showUrls: state.showUrls, setShowUrls: setters.setShowUrls,
        showInSearch: state.showInSearch, setShowInSearch: setters.setShowInSearch,
        columnsPerRow: state.columnsPerRow, setColumnsPerRow: setters.setColumnsPerRow,
        backgroundColor: state.backgroundColor, setBackgroundColor: setters.setBackgroundColor,
        backgroundImage: state.backgroundImage, setBackgroundImage: setters.setBackgroundImage,
        backgroundImageFit: state.backgroundImageFit, setBackgroundImageFit: setters.setBackgroundImageFit,
        backgroundGradient: state.backgroundGradient, setBackgroundGradient: setters.setBackgroundGradient,
        logoUrl: state.logoUrl, setLogoUrl: setters.setLogoUrl,
        logoPosition: state.logoPosition, setLogoPosition: setters.setLogoPosition,
        logoSize: state.logoSize, setLogoSize: setters.setLogoSize,
        titlePosition: state.titlePosition, setTitlePosition: setters.setTitlePosition,
        productImageFit: state.productImageFit, setProductImageFit: setters.setProductImageFit,

        // Storytelling
        enableCoverPage: state.enableCoverPage, setEnableCoverPage: setters.setEnableCoverPage,
        coverImageUrl: state.coverImageUrl, setCoverImageUrl: setters.setCoverImageUrl,
        coverDescription: state.coverDescription, setCoverDescription: setters.setCoverDescription,
        enableCategoryDividers: state.enableCategoryDividers, setEnableCategoryDividers: setters.setEnableCategoryDividers,
        categoryOrder: state.categoryOrder,
        setCategoryOrder: setters.setCategoryOrder,
        coverTheme: state.coverTheme, setCoverTheme: setters.setCoverTheme,

        // Dirty tracking
        isDirty: state.isDirty, setIsDirty: setters.setIsDirty,
        lastSavedState: state.lastSavedState, setLastSavedState: setters.setLastSavedState,
        hasUnsavedChanges,

        // Derived
        getState,
        productMap,
        selectedProducts,
        deferredSelectedProducts,
        previewProducts,
        effectiveView,
        shouldUseSplitPreviewSampling,
    }
}
