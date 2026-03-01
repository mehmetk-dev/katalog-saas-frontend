"use client"

import React, { createContext, useContext, type ReactNode } from "react"
import type { Catalog } from "@/lib/actions/catalogs"
import type { Product } from "@/lib/actions/products"
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
    /** Total product count (may be > products.length when truncated) */
    productTotalCount?: number
    /** True if the product list was truncated for performance */
    isProductListTruncated: boolean
    /** Current user's plan */
    userPlan: string
}

// ─── Context ────────────────────────────────────────────────────────────────────

const BuilderContext = createContext<BuilderContextValue | null>(null)

// ─── Provider ───────────────────────────────────────────────────────────────────

interface BuilderProviderProps {
    catalog: Catalog | null
    products: Product[]
    productTotalCount?: number
    isProductListTruncated?: boolean
    children: ReactNode
}

/** FIX(F2): Wraps the entire builder in a context so child components
 *  can access state & handlers directly via useBuilder() — no more prop drilling. */
export function BuilderProvider({
    catalog,
    products,
    productTotalCount,
    isProductListTruncated = false,
    children,
}: BuilderProviderProps) {
    const { user } = useUser()
    const state = useBuilderState({ catalog, products })
    const handlers = useBuilderHandlers({ catalog, state })

    const value: BuilderContextValue = {
        state,
        handlers,
        catalog,
        products,
        productTotalCount,
        isProductListTruncated,
        userPlan: user?.plan || "free",
    }

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
