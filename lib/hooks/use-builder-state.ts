"use client"

import { useReducer, useEffect, useRef, useMemo, useCallback, useDeferredValue, useTransition } from "react"
import { type Catalog } from "@/lib/actions/catalogs"
import { type Product } from "@/lib/actions/products"
import { useUser } from "@/lib/contexts/user-context"
import { useBuilderSelectedProducts } from "@/lib/hooks/use-builder-selected-products"
import {
    type BuilderCatalogData,
    type CatalogDraft,
    buildInitialCatalogState,
    createDraftSetters,
    draftsEqual,
    normalizeColumnsPerRow,
    patchChangesDraft,
    toDraft,
    SPLIT_PREVIEW_SOFT_LIMIT,
} from "@/components/builder/builder-utils"
import { useWindowSize } from "@/lib/hooks/use-window-size"

// ─── Types ──────────────────────────────────────────────────────────────────────

export type BuilderView = "split" | "editor" | "preview"

/** Geri alma geçmişinde tutulan en fazla adım */
const HISTORY_LIMIT = 100
/** Aynı alana bu süre içinde yapılan ardışık değişiklikler (renk sürükleme, yazı yazma)
 *  tek bir geri alma adımı sayılır */
const HISTORY_COALESCE_MS = 800

interface BuilderCoreState {
    // UI
    showUpgradeModal: boolean
    showShareModal: boolean
    showExitDialog: boolean
    view: BuilderView
    // Catalog identity
    currentCatalogId: string | null
    isPublished: boolean
    // Content & design — tek kaynak
    draft: CatalogDraft
    /** Sunucuya en son yazılan taslak; hasUnsavedChanges = draft ≠ saved */
    saved: CatalogDraft
    // Undo / redo
    past: CatalogDraft[]
    future: CatalogDraft[]
    lastEdit: { key: string; at: number } | null
}

type UiPatch = Partial<Pick<BuilderCoreState,
    'showUpgradeModal' | 'showShareModal' | 'showExitDialog' | 'view' | 'currentCatalogId' | 'isPublished'>>

type BuilderAction =
    | { type: 'SET_UI'; payload: UiPatch }
    | { type: 'EDIT'; patch: Partial<CatalogDraft>; at: number }
    | { type: 'MARK_SAVED'; snapshot: CatalogDraft }
    | { type: 'UNDO' }
    | { type: 'REDO' }
    | { type: 'RESET'; draft: CatalogDraft; currentCatalogId: string | null; isPublished: boolean }

function builderReducer(state: BuilderCoreState, action: BuilderAction): BuilderCoreState {
    switch (action.type) {
        case 'SET_UI':
            return { ...state, ...action.payload }

        case 'EDIT': {
            const patch = { ...action.patch }
            // Şablon değişince sütun sayısını aynı adımda düzelt — ayrı bir effect
            // ikinci bir geçmiş adımı yaratıp geri almayı kilitliyordu.
            if (patch.layout !== undefined && patch.columnsPerRow === undefined) {
                patch.columnsPerRow = normalizeColumnsPerRow(patch.layout, state.draft.columnsPerRow)
            }
            if (!patchChangesDraft(state.draft, patch)) return state

            const key = Object.keys(patch).sort().join(',')
            const coalesce = state.lastEdit !== null
                && state.lastEdit.key === key
                && action.at - state.lastEdit.at < HISTORY_COALESCE_MS
            return {
                ...state,
                draft: { ...state.draft, ...patch },
                past: coalesce ? state.past : [...state.past, state.draft].slice(-HISTORY_LIMIT),
                future: [],
                lastEdit: { key, at: action.at },
            }
        }

        case 'MARK_SAVED':
            return { ...state, saved: action.snapshot }

        case 'UNDO': {
            if (state.past.length === 0) return state
            return {
                ...state,
                draft: state.past[state.past.length - 1],
                past: state.past.slice(0, -1),
                future: [state.draft, ...state.future],
                lastEdit: null,
            }
        }

        case 'REDO': {
            if (state.future.length === 0) return state
            return {
                ...state,
                draft: state.future[0],
                past: [...state.past, state.draft],
                future: state.future.slice(1),
                lastEdit: null,
            }
        }

        case 'RESET':
            return {
                ...state,
                showUpgradeModal: false,
                showShareModal: false,
                showExitDialog: false,
                currentCatalogId: action.currentCatalogId,
                isPublished: action.isPublished,
                draft: action.draft,
                saved: action.draft,
                past: [],
                future: [],
                lastEdit: null,
            }

        default:
            return state
    }
}

interface UseBuilderStateOptions {
    catalog: Catalog | null
    products: Product[]
}

const PRODUCT_ID_MAX_LENGTH = 128

function normalizeProductIds(ids: string[]): string[] {
    const seen = new Set<string>()
    const normalized: string[] = []

    for (const id of ids) {
        if (typeof id !== "string") continue
        const trimmed = id.trim()
        if (!trimmed || trimmed.length > PRODUCT_ID_MAX_LENGTH || seen.has(trimmed)) continue
        seen.add(trimmed)
        normalized.push(trimmed)
    }

    return normalized
}

function initialDraft(catalog: Catalog | null, userLogoUrl?: string | null): CatalogDraft {
    const draft = toDraft(buildInitialCatalogState(catalog, userLogoUrl))
    return { ...draft, selectedProductIds: normalizeProductIds(draft.selectedProductIds) }
}


// ─── Hook ───────────────────────────────────────────────────────────────────────

export function useBuilderState({ catalog, products }: UseBuilderStateOptions) {
    const { user } = useUser()

    const [state, dispatch] = useReducer(builderReducer, undefined, (): BuilderCoreState => {
        const draft = initialDraft(catalog, user?.logo_url)
        return {
            showUpgradeModal: false,
            showShareModal: false,
            showExitDialog: false,
            view: "split",
            currentCatalogId: catalog?.id || null,
            isPublished: catalog?.is_published || false,
            draft,
            saved: draft,
            past: [],
            future: [],
            lastEdit: null,
        }
    })
    const { draft } = state

    const [isSelectionUpdatePending, startSelectionTransition] = useTransition()
    const {
        productMap,
        loadedProductsCount,
        upsertLoadedProducts,
    } = useBuilderSelectedProducts({
        initialProducts: products,
        selectedProductIds: draft.selectedProductIds,
    })
    // PERF(F6): Shared resize listener instead of dedicated one
    const { width: windowWidth } = useWindowSize()
    const isMobile = windowWidth < 768

    // ─── Stable setters (dispatch is stable) ───────────────────────────
    /** Birden çok alanı tek geri alma adımında değiştirir */
    const editDraft = useCallback((patch: Partial<CatalogDraft>) => dispatch({ type: 'EDIT', patch, at: Date.now() }), [])
    const draftSetters = useMemo(() => createDraftSetters(editDraft), [editDraft])

    const uiSetters = useMemo(() => ({
        setShowUpgradeModal: (v: boolean) => dispatch({ type: 'SET_UI', payload: { showUpgradeModal: v } }),
        setShowShareModal: (v: boolean) => dispatch({ type: 'SET_UI', payload: { showShareModal: v } }),
        setShowExitDialog: (v: boolean) => dispatch({ type: 'SET_UI', payload: { showExitDialog: v } }),
        setView: (v: BuilderView) => dispatch({ type: 'SET_UI', payload: { view: v } }),
        setCurrentCatalogId: (v: string | null) => dispatch({ type: 'SET_UI', payload: { currentCatalogId: v } }),
        setIsPublished: (v: boolean) => dispatch({ type: 'SET_UI', payload: { isPublished: v } }),
        /** Sunucuya yazılan anlık görüntüyü "kaydedildi" olarak işaretle. Kayıt sürerken
         *  yapılan değişiklikler snapshot'ta olmadığı için kaydedilmemiş görünmeye devam eder. */
        markSaved: (snapshot: BuilderCatalogData) => dispatch({ type: 'MARK_SAVED', snapshot: toDraft(snapshot) }),
        undo: () => dispatch({ type: 'UNDO' }),
        redo: () => dispatch({ type: 'REDO' }),
    }), [])

    const hasUnsavedChanges = useMemo(() => !draftsEqual(draft, state.saved), [draft, state.saved])

    // ─── State Ref (for hooks to read fresh data without re-render) ────
    const stateRef = useRef<BuilderCatalogData>({ ...draft, isPublished: state.isPublished })
    stateRef.current = { ...draft, isPublished: state.isPublished }
    const getState = useCallback((): BuilderCatalogData => ({ ...stateRef.current }), [])

    const selectedProducts = useMemo(() =>
        draft.selectedProductIds
            .map((id) => productMap.get(id))
            .filter((p): p is Product => p !== undefined),
        [draft.selectedProductIds, productMap]
    )
    const deferredSelectedProducts = useDeferredValue(selectedProducts)

    // PERF(Y1): Tüketicilerin tekrar tekrar `new Set(selectedProductIds)` yapmasını
    // engelle — tek bir kaynaktan memoize edilmiş Set paylaş.
    const selectedProductIdSet = useMemo(
        () => new Set(draft.selectedProductIds),
        [draft.selectedProductIds]
    )

    // ─── Beforeunload Warning ──────────────────────────────────────────
    // Tarayıcılar artık özel mesaj göstermiyor; preventDefault yeterli.
    useEffect(() => {
        if (!hasUnsavedChanges) return
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault()
            e.returnValue = ""
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [hasUnsavedChanges])

    // ─── Reset state when a different catalog is loaded ────────────────
    useEffect(() => {
        if (!catalog) return
        dispatch({
            type: 'RESET',
            draft: initialDraft(catalog, user?.logo_url),
            currentCatalogId: catalog.id || null,
            isPublished: catalog.is_published || false,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [catalog?.id])

    // PERF(F6): Auto-fix view on mobile/desktop switch (no separate resize listener)
    useEffect(() => {
        if (isMobile && state.view === "split") {
            dispatch({ type: 'SET_UI', payload: { view: "editor" } })
        } else if (!isMobile && state.view === "editor") {
            dispatch({ type: 'SET_UI', payload: { view: "split" } })
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
        const normalized = normalizeProductIds(ids)
        startSelectionTransition(() => {
            dispatch({ type: 'EDIT', patch: { selectedProductIds: normalized }, at: Date.now() })
        })
    }, [])

    // ─── Return ────────────────────────────────────────────────────────
    // PERF: Memoize so context consumers only re-render on real changes.
    return useMemo(() => ({
        // Catalog data (catalogName, primaryColor, …) + their setters
        /** Taslağın tamamı; her düzenlemede kimliği değişir (otomatik kayıt bunu izler) */
        draft,
        ...draft,
        ...draftSetters,
        editDraft,
        handleSelectedProductIdsChange,

        // UI state
        showUpgradeModal: state.showUpgradeModal,
        showShareModal: state.showShareModal,
        showExitDialog: state.showExitDialog,
        view: state.view,
        isMobile,
        isSelectionUpdatePending,
        currentCatalogId: state.currentCatalogId,
        isPublished: state.isPublished,
        ...uiSetters,

        // Save / history
        hasUnsavedChanges,
        canUndo: state.past.length > 0,
        canRedo: state.future.length > 0,

        // Derived
        getState,
        productMap,
        selectedProducts,
        selectedProductIdSet,
        deferredSelectedProducts,
        loadedProductsCount,
        upsertLoadedProducts,
        previewProducts,
        effectiveView,
        shouldUseSplitPreviewSampling,
    }), [
        draft,
        draftSetters,
        editDraft,
        handleSelectedProductIdsChange,
        state.showUpgradeModal,
        state.showShareModal,
        state.showExitDialog,
        state.view,
        state.currentCatalogId,
        state.isPublished,
        state.past.length,
        state.future.length,
        isMobile,
        isSelectionUpdatePending,
        uiSetters,
        hasUnsavedChanges,
        getState,
        productMap,
        selectedProducts,
        selectedProductIdSet,
        deferredSelectedProducts,
        loadedProductsCount,
        upsertLoadedProducts,
        previewProducts,
        effectiveView,
        shouldUseSplitPreviewSampling,
    ])
}
