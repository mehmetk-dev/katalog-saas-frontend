import { Suspense } from "react"
import { Metadata } from "next"
import { redirect } from "next/navigation"

import { getProducts } from "@/lib/actions/products"
import { getCurrentUser } from "@/lib/actions/auth"
import { ExcelPageClient } from "@/components/excel/excel-page-client"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Excel Düzenleyici",
  description: "Ürünlerinizi Excel benzeri bir arayüzde toplu olarak düzenleyin.",
}

const EXCEL_PAGE_SIZE = 100

export default async function ExcelPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const requestedPage = Number.parseInt(params.page || "1", 10)
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1

  const user = await getCurrentUser()

  if (!user) redirect("/auth")

  const userPlan = (user?.plan as "free" | "plus" | "pro") || "free"

  let productsResponse: Awaited<ReturnType<typeof getProducts>> = {
    products: [],
    metadata: { total: 0, page: 1, limit: EXCEL_PAGE_SIZE, totalPages: 1 },
  }

  try {
    const res = await getProducts({ page, limit: EXCEL_PAGE_SIZE })
    if (res) productsResponse = res
  } catch (error) {
    console.error("[ExcelPage] Error fetching data:", error)
  }

  return (
    <Suspense fallback={<ExcelPageSkeleton />}>
      <ExcelPageClient
        initialProducts={productsResponse.products}
        initialMetadata={productsResponse.metadata}
        userPlan={userPlan}
      />
    </Suspense>
  )
}

function ExcelPageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-[600px] w-full" />
    </div>
  )
}
