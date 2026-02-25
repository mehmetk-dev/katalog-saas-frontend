"use server"

import { revalidatePath } from "next/cache"
import { cache } from "react"

import { apiFetch } from "@/lib/api"
import type { Product } from "@/lib/actions/products"

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
  show_urls: boolean
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
  logo_position: 'header-left' | 'header-center' | 'header-right' | 'footer-left' | 'footer-center' | 'footer-right' | 'none' | null
  logo_size: 'small' | 'medium' | 'large'
  is_disabled?: boolean
  title_position: 'left' | 'center' | 'right'  // Başlık konumu
  product_image_fit?: 'cover' | 'contain' | 'fill'  // Ürün görsel hizalama
  header_text_color?: string  // Başlık yazı rengi
  view_count?: number
  // Storytelling Catalog Features (Cover & Category Pages)
  enable_cover_page?: boolean  // Enable cover page (default: false)
  cover_image_url?: string | null  // Custom cover image uploaded by user
  cover_description?: string | null  // Cover page description (max 500 chars)
  enable_category_dividers?: boolean  // Enable category transition pages (default: false)
  cover_theme?: string // Theme for the cover page (e.g., 'modern', 'minimal', 'lux', etc.)
  show_in_search?: boolean // New: Visibility in search engines (default: true)
  created_at: string
  updated_at: string
  // Public API'den gelen ürünler (opsiyonel)
  products?: Product[]
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
  return await apiFetch<Catalog[]>("/catalogs")
}

export async function getCatalog(id: string) {
  return await apiFetch<Catalog>(`/catalogs/${id}`)
}

export async function getTemplatesFromAPI() {
  try {
    return await apiFetch<CatalogTemplate[]>("/catalogs/templates")
  } catch (error) {
    console.error("Error fetching templates from API:", error)
    return []
  }
}

// Database'den template çek (fallback to API if empty)
export async function getTemplates(): Promise<CatalogTemplate[]> {
  try {
    // Import dynamically to avoid circular imports
    const { getTemplates: getDatabaseTemplates } = await import("@/lib/actions/templates")
    const templates = await getDatabaseTemplates()

    // Eğer database boşsa API'den çekmeyi deniyelim
    if (!templates || templates.length === 0) {
      console.log("No templates found in database, falling back to API...")
      return await getTemplatesFromAPI()
    }

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
    console.error("Error fetching templates, trying API fallback:", error)
    return await getTemplatesFromAPI()
  }
}

export async function createCatalog(data: Partial<Catalog>) {
  const newCatalog = await apiFetch<Catalog>("/catalogs", {
    method: "POST",
    body: JSON.stringify(data),
  })
  revalidatePath("/dashboard", "layout")
  return newCatalog
}

export async function updateCatalog(id: string, updates: Partial<Catalog>) {
  await apiFetch(`/catalogs/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  })
  revalidatePath("/dashboard", "layout")
  return { success: true }
}

export async function deleteCatalog(id: string) {
  await apiFetch(`/catalogs/${id}`, {
    method: "DELETE",
  })
  revalidatePath("/dashboard", "layout")
  return { success: true }
}

export async function publishCatalog(id: string, isPublished: boolean, share_slug?: string | null) {
  await apiFetch(`/catalogs/${id}/publish`, {
    method: "PATCH",
    body: JSON.stringify({ is_published: isPublished }),
  })
  revalidatePath("/dashboard", "layout")
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


export const getPublicCatalog = cache(async (slug: string) => {
  try {
    // Large catalogs (10K+ products) need longer timeout — backend fetches in batches
    return await apiFetch<Catalog>(`/catalogs/public/${slug}`, { timeout: 120000 })
  } catch {
    return null
  }
})

/** Lightweight metadata-only fetch — no products, no view tracking */
export const getPublicCatalogMeta = cache(async (slug: string) => {
  try {
    return await apiFetch<Pick<Catalog, 'id' | 'name' | 'description' | 'is_published' | 'show_in_search'>>(`/catalogs/public/${slug}/meta`)
  } catch {
    return null
  }
})

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
  const params = new URLSearchParams({ timeRange })
  return await apiFetch<DashboardStats>(`/catalogs/stats?${params.toString()}`)
}
