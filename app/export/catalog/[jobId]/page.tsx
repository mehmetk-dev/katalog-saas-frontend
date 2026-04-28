import { notFound } from "next/navigation"

import { PdfExportDocument } from "@/components/export/pdf-export-document"
import type { Product } from "@/lib/actions/products"
import type { User, UserPlan } from "@/lib/user/types"
import { verifyPdfExportToken } from "@/lib/server/pdf-export-token"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

interface ExportCatalogPageProps {
  params: Promise<{ jobId: string }>
  searchParams: Promise<{ token?: string }>
}

interface RenderData {
  catalog: Record<string, unknown>
  products: Product[]
  user: Record<string, unknown> | null
}

function getApiBaseUrl(): string {
  return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "")
}

function toExportUser(row: Record<string, unknown> | null, productsCount: number): User {
  const plan = row?.plan === "plus" || row?.plan === "pro" ? row.plan : "free"
  return {
    id: typeof row?.id === "string" ? row.id : "pdf-export",
    name: typeof row?.full_name === "string" ? row.full_name : "FogCatalog",
    email: typeof row?.email === "string" ? row.email : "export@fogcatalog.local",
    company: typeof row?.company === "string" ? row.company : "",
    logo_url: typeof row?.logo_url === "string" ? row.logo_url : null,
    plan: plan as UserPlan,
    exportsUsed: typeof row?.exports_used === "number" ? row.exports_used : 0,
    maxExports: 999999,
    productsCount,
    maxProducts: 999999,
    catalogsCount: 1,
  }
}

async function getRenderData(jobId: string, token: string): Promise<RenderData | null> {
  const response = await fetch(
    `${getApiBaseUrl()}/pdf-exports/${jobId}/render-data?token=${encodeURIComponent(token)}`,
    { cache: "no-store" },
  )

  if (!response.ok) return null
  return response.json()
}

export default async function ExportCatalogPage({ params, searchParams }: ExportCatalogPageProps) {
  const { jobId } = await params
  const { token } = await searchParams

  if (!token || !verifyPdfExportToken(jobId, token)) {
    notFound()
  }

  const renderData = await getRenderData(jobId, token)
  if (!renderData) {
    notFound()
  }

  return (
    <PdfExportDocument
      catalog={renderData.catalog}
      products={renderData.products}
      user={toExportUser(renderData.user, renderData.products.length)}
    />
  )
}
