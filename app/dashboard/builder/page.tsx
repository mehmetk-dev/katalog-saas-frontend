import { Suspense } from "react"
import { getCatalog } from "@/lib/actions/catalogs"
import { getProducts } from "@/lib/actions/products"
import { BuilderPageClient } from "@/components/builder/builder-page-client"
import { Skeleton } from "@/components/ui/skeleton"

interface BuilderPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function CatalogBuilderPage({ searchParams }: BuilderPageProps) {
  const params = await searchParams
  const catalogId = params.id

  const [catalog, products] = await Promise.all([catalogId ? getCatalog(catalogId) : null, getProducts()])

  return (
    <Suspense fallback={<BuilderSkeleton />}>
      <BuilderPageClient catalog={catalog} products={products} />
    </Suspense>
  )
}

function BuilderSkeleton() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-6">
      <div className="h-14 border-b bg-background flex items-center justify-between px-4">
        <Skeleton className="h-9 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="flex-1 flex">
        <div className="w-1/2 border-r p-6">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="w-1/2 p-6">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </div>
  )
}
