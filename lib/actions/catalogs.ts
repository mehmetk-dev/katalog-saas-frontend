"use server"

import { revalidatePath } from "next/cache"

import { apiFetch } from "@/lib/api"

export interface Catalog {
  id: string
  user_id: string
  template_id: string | null
  name: string
  description: string | null
  layout: string
  primary_color: string
  show_prices: boolean
  show_descriptions: boolean
  show_attributes: boolean
  show_sku: boolean
  is_published: boolean
  share_slug: string | null
  product_ids: string[]
  // Yeni kişiselleştirme alanları
  columns_per_row: number  // 2, 3, 4
  background_color: string
  background_image: string | null
  background_image_fit?: 'cover' | 'contain' | 'fill'
  background_gradient: string | null
  logo_url: string | null
  logo_position: 'header-left' | 'header-center' | 'header-right' | 'footer-left' | 'footer-center' | 'footer-right' | null
  logo_size: 'small' | 'medium' | 'large'
  is_disabled?: boolean
  title_position: 'left' | 'center' | 'right'  // Başlık konumu
  created_at: string
  updated_at: string
  // Public API'den gelen ürünler (opsiyonel)
  products?: unknown[]
}

export interface CatalogTemplate {
  id: string
  name: string
  description: string | null
  layout: string
  thumbnail_url: string | null
  is_premium: boolean
  items_per_page: number
  component_name: string
  created_at: string
}

export async function getCatalogs() {
  try {
    return await apiFetch<Catalog[]>("/catalogs")
  } catch (error) {
    console.error("Error fetching catalogs:", error)
    return []
  }
}

export async function getCatalog(id: string) {
  try {
    return await apiFetch<Catalog>(`/catalogs/${id}`)
  } catch (error) {
    console.error("Error fetching catalog:", error)
    return null
  }
}

export async function getTemplatesFromAPI() {
  try {
    return await apiFetch<CatalogTemplate[]>("/catalogs/templates")
  } catch (error) {
    console.error("Error fetching templates from API:", error)
    return []
  }
}

// Database'den template çek
export async function getTemplates(): Promise<CatalogTemplate[]> {
  try {
    // Import dynamically to avoid circular imports
    const { getTemplates: getDatabaseTemplates } = await import("@/lib/actions/templates")
    const templates = await getDatabaseTemplates()

    // Map database format to CatalogTemplate format
    return templates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      layout: t.layout,
      thumbnail_url: t.preview_image,
      is_premium: t.is_pro,
      items_per_page: t.items_per_page,
      component_name: t.component_name,
      created_at: t.created_at
    }))
  } catch (error) {
    console.error("Error fetching templates:", error)
    return []
  }
}

export async function createCatalog(data: {
  name: string
  description?: string
  template_id?: string
  layout?: string
}) {
  const newCatalog = await apiFetch<Catalog>("/catalogs", {
    method: "POST",
    body: JSON.stringify(data),
  })
  revalidatePath("/dashboard")
  return newCatalog
}

export async function updateCatalog(id: string, updates: Partial<Catalog>) {
  await apiFetch(`/catalogs/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  })
  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/builder/${id}`)
  return { success: true }
}

export async function deleteCatalog(id: string) {
  await apiFetch(`/catalogs/${id}`, {
    method: "DELETE",
  })
  revalidatePath("/dashboard")
  return { success: true }
}

export async function publishCatalog(id: string, isPublished: boolean, share_slug?: string | null) {
  await apiFetch(`/catalogs/${id}/publish`, {
    method: "PATCH",
    body: JSON.stringify({ is_published: isPublished }),
  })
  revalidatePath("/dashboard")
  if (share_slug) {
    revalidatePath(`/catalog/${share_slug}`)
  }
  return { success: true }
}

export async function revalidateCatalogPublic(slug: string) {
  try {
    revalidatePath(`/catalog/${slug}`)
    return { success: true }
  } catch (error) {
    console.error("Revalidation error:", error)
    return { success: false }
  }
}


export async function getPublicCatalog(slug: string) {
  try {
    return await apiFetch<Catalog>(`/catalogs/public/${slug}`)
  } catch {
    return null
  }
}

export interface DashboardStats {
  totalCatalogs: number
  publishedCatalogs: number
  totalViews: number
  totalProducts: number
  topCatalogs: { id: string; name: string; views: number }[]
  // Detaylı analitik verileri (catalog_views tablosundan)
  uniqueVisitors?: number
  deviceStats?: { device_type: string; view_count: number; percentage: number }[]
  dailyViews?: { view_date: string; view_count: number }[]
}

export async function getDashboardStats(timeRange: "7d" | "30d" | "90d" = "30d") {
  try {
    const params = new URLSearchParams({ timeRange })
    return await apiFetch<DashboardStats>(`/catalogs/stats?${params.toString()}`)
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return null
  }
}
