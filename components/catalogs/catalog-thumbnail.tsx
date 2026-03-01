import NextImage from "next/image"

import type { Product } from "@/lib/actions/products"
import type { Catalog } from "@/lib/actions/catalogs"

interface CatalogThumbnailProps {
    catalog: Catalog
    products: Product[]
}

export function CatalogThumbnail({ catalog, products }: CatalogThumbnailProps) {
    // Filter products that belong to this catalog
    const catalogProducts = products.filter((p) => catalog.product_ids?.includes(p.id))

    // Limit items for thumbnail
    const displayProducts = catalogProducts.slice(0, 4)

    // Determine layout style simple
    const isList = catalog.layout === "compact-list" || catalog.layout === "list"

    return (
        <div className="w-full h-full bg-white flex flex-col overflow-hidden pointer-events-none select-none">
            {/* Mini Header */}
            <div className="h-8 bg-slate-900 w-full flex items-center justify-center shrink-0">
                <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Content Area */}
            <div className="flex-1 p-2 bg-gray-50 overflow-hidden">
                {displayProducts.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        Ürün Yok
                    </div>
                ) : (
                    <div className={`grid gap-1 ${isList ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {displayProducts.map(product => (
                            <div key={product.id} className="bg-white p-1 rounded-sm shadow-sm border border-gray-100 flex flex-col gap-1">
                                {/* Image */}
                                <div className={`relative overflow-hidden rounded-sm bg-gray-200 ${isList ? 'h-8' : 'aspect-square'}`}>
                                    {product.image_url ? (
                                        <NextImage src={product.image_url} alt="" fill className="object-cover" unoptimized />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[6px] text-gray-400">IMG</div>
                                    )}
                                </div>
                                {/* Text Lines */}
                                <div className="space-y-[2px]">
                                    <div className="h-[3px] bg-gray-200 rounded-full w-3/4" />
                                    <div className="h-[3px] bg-gray-100 rounded-full w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
