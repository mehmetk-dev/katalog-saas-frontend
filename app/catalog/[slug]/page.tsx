import { notFound } from "next/navigation"
import { getPublicCatalog } from "@/lib/actions/catalogs"
import { createClient } from "@/lib/supabase/server"

interface PublicCatalogPageProps {
  params: Promise<{ slug: string }>
}

export default async function PublicCatalogPage({ params }: PublicCatalogPageProps) {
  const { slug } = await params
  const catalog = await getPublicCatalog(slug)

  if (!catalog) {
    notFound()
  }

  // Get products for this catalog
  const supabase = await createClient()
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .in("id", catalog.product_ids || [])

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-card rounded-xl shadow-lg overflow-hidden">
          {/* Catalog Header */}
          <div className="p-8 md:p-12 text-white" style={{ backgroundColor: catalog.primary_color }}>
            <h1 className="text-3xl md:text-4xl font-bold">{catalog.name}</h1>
            {catalog.description && <p className="text-white/80 mt-3 text-lg">{catalog.description}</p>}
          </div>

          {/* Products */}
          <div className="p-6 md:p-8">
            {!products || products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No products in this catalog yet.</p>
              </div>
            ) : (
              <div
                className={`grid gap-6 ${
                  catalog.layout === "list"
                    ? "grid-cols-1"
                    : catalog.layout === "masonry"
                      ? "grid-cols-2 md:grid-cols-3"
                      : "grid-cols-2 md:grid-cols-3"
                }`}
              >
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`group ${catalog.layout === "list" ? "flex items-center gap-4 p-4 border rounded-lg" : ""}`}
                  >
                    <div
                      className={`bg-muted rounded-lg overflow-hidden ${
                        catalog.layout === "list" ? "w-24 h-24 shrink-0" : "aspect-square mb-4"
                      }`}
                    >
                      <img
                        src={product.image_url || "/placeholder.svg?height=300&width=300&query=product"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      {catalog.show_descriptions && product.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                      )}
                      {catalog.show_prices && (
                        <p className="font-bold text-lg mt-2" style={{ color: catalog.primary_color }}>
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
            <p className="text-sm text-muted-foreground">
              Created with{" "}
              <a href="/" className="text-primary hover:underline">
                CatalogPro
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
