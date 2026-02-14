import * as React from "react"
import { ChevronDown, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { type Product } from "@/lib/actions/products"
import { cn } from "@/lib/utils"

interface ProductSelectorProps {
    allProducts: Product[]
    selectedProductId: string
    onSelect: (id: string) => void
    disabled: boolean
    matchedProduct?: Product
}

export function ProductSelector({ allProducts, selectedProductId, onSelect, disabled, matchedProduct }: ProductSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const filteredProducts = React.useMemo(() => {
        if (!search) return allProducts.slice(0, 50)
        const keyword = search.toLocaleLowerCase("tr")

        return allProducts
            .filter(
                (product) =>
                    product.name.toLocaleLowerCase("tr").includes(keyword) ||
                    (product.sku && product.sku.toLocaleLowerCase("tr").includes(keyword)),
            )
            .slice(0, 50)
    }, [allProducts, search])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full h-8 px-2 justify-between bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                        matchedProduct && "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800",
                        disabled && "opacity-70 cursor-not-allowed",
                    )}
                    disabled={disabled}
                >
                    <span className="text-xs truncate font-medium">
                        {matchedProduct ? `${matchedProduct.name}${matchedProduct.sku ? ` [${matchedProduct.sku}]` : ""}` : "Ürün Seçilmedi"}
                    </span>
                    <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[300px] p-0 shadow-xl z-[200]" align="start" side="bottom">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 p-2 border-b bg-white sticky top-0 z-10">
                        <input
                            autoFocus
                            className="flex-1 h-9 px-3 text-sm border border-slate-200 rounded-md outline-none focus:border-violet-500/50 transition-all font-medium placeholder:text-slate-400"
                            placeholder="Ürün adı veya SKU ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto p-1 bg-slate-50/50" onWheel={(e) => e.stopPropagation()}>
                        <button
                            className="w-full px-3 py-2 text-xs font-semibold text-slate-500 text-left hover:bg-slate-100 rounded-md transition-colors flex items-center mb-1"
                            onClick={() => {
                                onSelect("none")
                                setOpen(false)
                            }}
                        >
                            <X className="w-3 h-3 mr-2" />
                            Seçimi Kaldır
                        </button>

                        {filteredProducts.map((product) => (
                            <button
                                key={product.id}
                                className={cn(
                                    "w-full px-3 py-2.5 text-xs text-left hover:bg-white hover:shadow-sm rounded-md transition-all mb-1 flex flex-col gap-0.5",
                                    selectedProductId === product.id ? "bg-violet-600 text-white shadow-md font-bold" : "text-slate-700",
                                )}
                                onClick={() => {
                                    onSelect(product.id)
                                    setOpen(false)
                                }}
                            >
                                <span className="truncate">{product.name}</span>
                                {product.sku && (
                                    <span className={cn("text-[10px] truncate", selectedProductId === product.id ? "text-white/80" : "text-slate-400")}>
                                        SKU: {product.sku}
                                    </span>
                                )}
                            </button>
                        ))}

                        {filteredProducts.length === 0 && (
                            <div className="px-3 py-8 text-xs text-center text-slate-400 italic bg-white rounded-md border border-dashed border-slate-200 m-1">
                                Eşleşen ürün bulunamadı.
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
