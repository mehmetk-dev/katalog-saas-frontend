"use client"

import { LayoutGrid, List, Table2 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ProductsView } from "../products-page-utils"

const VIEWS = [
    ["list", List, "products.viewList"],
    ["grid", LayoutGrid, "products.viewGrid"],
    ["table", Table2, "products.viewTable"],
] as const

interface ProductsViewSwitchProps {
    value: ProductsView
    onChange: (view: ProductsView) => void
    t: (key: string) => string
}

/** Ürünler sayfası görünüm seçici. "Tablo" eski Excel Düzenleyici'dir (/dashboard/products?view=table). */
export function ProductsViewSwitch({ value, onChange, t }: ProductsViewSwitchProps) {
    return (
        <div role="radiogroup" aria-label={t("products.viewMode")} className="flex shrink-0 rounded-md border bg-card p-0.5">
            {VIEWS.map(([view, Icon, labelKey]) => (
                <button
                    key={view}
                    type="button"
                    role="radio"
                    aria-checked={value === view}
                    aria-label={t(labelKey)}
                    title={t(labelKey)}
                    onClick={() => onChange(view)}
                    className={cn(
                        "flex size-8 min-h-0 min-w-0 items-center justify-center rounded transition-colors",
                        value === view ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Icon className="size-4" />
                </button>
            ))}
        </div>
    )
}
