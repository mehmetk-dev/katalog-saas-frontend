"use client"

import React, { createContext, useContext, useMemo, type ReactNode } from "react"
import type { Catalog } from "@/lib/actions/catalogs"
import type { Product, ProductsResponse } from "@/lib/actions/products"
import { useBuilderState } from "@/lib/hooks/use-builder-state"
import { useBuilderHandlers } from "@/lib/hooks/use-builder-handlers"
import { useUser } from "@/lib/contexts/user-context"

// ─── Types ──────────────────────────────────────────────────────────────────────

export type BuilderState = ReturnType<typeof useBuilderState>
export type BuilderHandlers = ReturnType<typeof useBuilderHandlers>

export interface BuilderContextValue {
    /** All reactive state from useBuilderState */
    state: BuilderState
    /** All handlers from useBuilderHandlers */
    handlers: BuilderHandlers
    /** Server-loaded catalog (null for new) */
    catalog: Catalog | null
    /** Server-loaded products */
    products: Product[]
    /** First page response used as initial data for client pagination */
    initialProductsResponse: ProductsResponse
    /** Current user's plan */
    userPlan: string
}

// ─── Context ────────────────────────────────────────────────────────────────────

const BuilderContext = createContext<BuilderContextValue | null>(null)

// ─── Provider ───────────────────────────────────────────────────────────────────

interface BuilderProviderProps {
    catalog: Catalog | null
    products: Product[]
    initialProductsResponse: ProductsResponse
    children: ReactNode
}

/** FIX(F2): Wraps the entire builder in a context so child components
 *  can access state & handlers directly via useBuilder() — no more prop drilling. */
export function BuilderProvider({
    catalog,
    products,
    initialProductsResponse,
    children,
}: BuilderProviderProps) {
    const { user } = useUser()
    const state = useBuilderState({ catalog, products })
    const handlers = useBuilderHandlers({ catalog, state })
    const userPlan = user?.plan || "free"

    // PERF: Stable context value — prevents every consumer from re-rendering
    // when BuilderProvider re-renders but state/handlers identities are unchanged.
    const value = useMemo<BuilderContextValue>(() => ({
        state,
        handlers,
        catalog,
        products,
        initialProductsResponse,
        userPlan,
    }), [state, handlers, catalog, products, initialProductsResponse, userPlan])

    return (
        <BuilderContext.Provider value={value}>
            {children}
        </BuilderContext.Provider>
    )
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

/** Access the builder context.
 *  @throws if used outside <BuilderProvider> */
export function useBuilder(): BuilderContextValue {
    const ctx = useContext(BuilderContext)
    if (!ctx) {
        throw new Error("useBuilder must be used within <BuilderProvider>")
    }
    return ctx
}
