"use client"

import { Badge } from "@/components/ui/badge"
import { useUser } from "@/lib/user-context"
import type { Product } from "@/lib/actions/products"

interface CatalogPreviewProps {
  catalogName: string
  products: Product[]
  layout: string
  primaryColor: string
  showPrices: boolean
  showDescriptions: boolean
}

export function CatalogPreview({
  catalogName,
  products,
  layout,
  primaryColor,
  showPrices,
  showDescriptions,
}: CatalogPreviewProps) {
  const { user } = useUser()
  const isFreeUser = user?.plan === "free"

  const getGridClass = () => {
    switch (layout) {
      case "list":
        return "grid-cols-1"
      case "masonry":
        return "grid-cols-2 md:grid-cols-3"
      default:
        return "grid-cols-2"
    }
  }

  return (
    <div className="p-8 flex items-start justify-center min-h-full">
      <div className="w-full max-w-2xl bg-card rounded-lg shadow-lg overflow-hidden relative">
        {/* Watermark for Free Users */}
        {isFreeUser && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-6xl font-bold text-primary/10 rotate-[-30deg] select-none">PREVIEW</div>
          </div>
        )}

        {/* Catalog Header */}
        <div className="p-8 text-white" style={{ backgroundColor: primaryColor }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold">CP</span>
            </div>
            {isFreeUser && (
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                Free Plan
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold">{catalogName || "Untitled Catalog"}</h1>
          <p className="text-white/80 mt-2">Discover our latest collection of premium products</p>
        </div>

        {/* Products Grid */}
        <div className="p-6">
          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No products selected</p>
              <p className="text-sm mt-1">Select products from the editor to preview</p>
            </div>
          ) : (
            <div className={`grid ${getGridClass()} gap-4`}>
              {products.map((product) => (
                <div key={product.id} className={`group ${layout === "list" ? "flex items-center gap-4" : ""}`}>
                  <div
                    className={`bg-muted rounded-lg overflow-hidden ${layout === "list" ? "w-20 h-20 shrink-0" : "aspect-square mb-3"}`}
                  >
                    <img
                      src={product.image_url || "/placeholder.svg?height=200&width=200&query=product"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className={layout === "list" ? "flex-1" : ""}>
                    <h3 className="font-medium text-sm">{product.name}</h3>
                    {showDescriptions && product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
                    )}
                    {showPrices && (
                      <p className="font-semibold mt-1" style={{ color: primaryColor }}>
                        ${Number(product.price).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Created with CatalogPro
            {isFreeUser && " • Upgrade to remove watermark"}
          </p>
        </div>
      </div>
    </div>
  )
}
