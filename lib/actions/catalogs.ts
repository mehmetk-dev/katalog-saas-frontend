"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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
  is_published: boolean
  share_slug: string | null
  product_ids: string[]
  created_at: string
  updated_at: string
}

export interface CatalogTemplate {
  id: string
  name: string
  description: string | null
  layout: string
  thumbnail_url: string | null
  is_premium: boolean
  created_at: string
}

export async function getCatalogs() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from("catalogs")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Error fetching catalogs:", error)
    return []
  }

  return data as Catalog[]
}

export async function getCatalog(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase.from("catalogs").select("*").eq("id", id).eq("user_id", user.id).single()

  if (error) return null

  return data as Catalog
}

export async function getTemplates() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("catalog_templates").select("*").order("is_premium", { ascending: true })

  if (error) {
    console.error("Error fetching templates:", error)
    return []
  }

  return data as CatalogTemplate[]
}

export async function createCatalog(data: {
  name: string
  description?: string
  template_id?: string
  layout?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")

  // Generate a unique share slug
  const shareSlug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`

  const catalog = {
    user_id: user.id,
    name: data.name,
    description: data.description || null,
    template_id: data.template_id || null,
    layout: data.layout || "grid",
    share_slug: shareSlug,
    product_ids: [],
  }

  const { data: newCatalog, error } = await supabase.from("catalogs").insert(catalog).select().single()

  if (error) throw error

  revalidatePath("/dashboard")
  return newCatalog
}

export async function updateCatalog(id: string, updates: Partial<Catalog>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase
    .from("catalogs")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw error

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/builder/${id}`)
  return { success: true }
}

export async function deleteCatalog(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase.from("catalogs").delete().eq("id", id).eq("user_id", user.id)

  if (error) throw error

  revalidatePath("/dashboard")
  return { success: true }
}

export async function publishCatalog(id: string, isPublished: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase
    .from("catalogs")
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw error

  revalidatePath("/dashboard")
  return { success: true }
}

// Get public catalog by share slug (no auth required)
export async function getPublicCatalog(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("catalogs")
    .select("*")
    .eq("share_slug", slug)
    .eq("is_published", true)
    .single()

  if (error) return null

  return data as Catalog
}
