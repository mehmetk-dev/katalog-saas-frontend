"use client"

import { Button } from "@/components/ui/button"
import type { Language } from "@/lib/translations"
import type { GeneratedProduct } from "@/lib/excel-ai/types"

interface PendingProductsCardProps {
    products: GeneratedProduct[]
    language: Language
    isApplying: boolean
    isGenerating: boolean
    onAdd: () => void
    onDismiss: () => void
}

export function PendingProductsCard({
    products,
    language,
    isApplying,
    isGenerating,
    onAdd,
    onDismiss,
}: PendingProductsCardProps) {
    return (
        <div className="rounded-md border border-green-500/30 bg-green-500/5 p-3">
            <div className="text-xs font-semibold text-green-700 dark:text-green-400">
                {language === "tr" ? "Oluşturulan Ürünler" : "Generated Products"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
                {products.length}{" "}
                {language === "tr" ? "ürün tabloya eklenecek" : "products will be added to the table"}
            </div>
            <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={onAdd} disabled={isApplying || isGenerating}>
                    {language === "tr" ? "Tabloya Ekle" : "Add to Table"}
                </Button>
                <Button size="sm" variant="ghost" onClick={onDismiss} disabled={isApplying || isGenerating}>
                    {language === "tr" ? "İptal" : "Dismiss"}
                </Button>
            </div>
        </div>
    )
}
