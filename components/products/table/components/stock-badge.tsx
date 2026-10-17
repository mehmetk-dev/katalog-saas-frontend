import { AlertTriangle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ProductViewProps } from "../types"
import { getStockStatus } from "../utils/product-helpers"

/**
 * Stok rozeti. Durum yalnızca renkle anlatılmaz: tükenen ürün "Tükendi" yazar,
 * az stokta uyarı simgesi ve ekran okuyucu metni bulunur.
 */
export function StockBadge({ stock, className, t }: { stock: number; className?: string; t: ProductViewProps["t"] }) {
    const { variant } = getStockStatus(stock)

    if (variant === "destructive") {
        return (
            <Badge variant="outline" className={cn("border-destructive/20 bg-destructive-soft text-destructive-soft-foreground", className)}>
                {t("products.soldOut")}
            </Badge>
        )
    }

    const low = variant === "secondary"
    return (
        <Badge variant={low ? "warning" : "success"} className={cn("tabular-nums", className)} title={low ? t("products.lowStock") : undefined}>
            {low && <AlertTriangle aria-hidden className="size-3" />}
            {t("products.unitCount", { count: stock })}
            {low && <span className="sr-only"> ({t("products.lowStock")})</span>}
        </Badge>
    )
}
