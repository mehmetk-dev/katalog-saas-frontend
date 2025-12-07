"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface CustomAttribute {
  name: string
  value: string
  unit?: string
}

export interface Product {
  id: string
  user_id: string
  sku: string | null
  name: string
  description: string | null
  price: number
  stock: number
  category: string | null
  image_url: string | null
  custom_attributes: CustomAttribute[]
  created_at: string
  updated_at: string
}

export async function getProducts() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching products:", error)
    return []
  }

  return data as Product[]
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Oturum açılmamış")

  const customAttributesJson = formData.get("custom_attributes") as string
  let customAttributes: CustomAttribute[] = []
  try {
    if (customAttributesJson) {
      customAttributes = JSON.parse(customAttributesJson)
    }
  } catch {
    customAttributes = []
  }

  const product = {
    user_id: user.id,
    name: formData.get("name") as string,
    sku: (formData.get("sku") as string) || null,
    description: (formData.get("description") as string) || null,
    price: Number.parseFloat(formData.get("price") as string) || 0,
    stock: Number.parseInt(formData.get("stock") as string) || 0,
    category: (formData.get("category") as string) || null,
    image_url: (formData.get("image_url") as string) || null,
    custom_attributes: customAttributes,
  }

  const { data, error } = await supabase.from("products").insert(product).select().single()

  if (error) throw error

  revalidatePath("/dashboard/products")
  return data
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Oturum açılmamış")

  const customAttributesJson = formData.get("custom_attributes") as string
  let customAttributes: CustomAttribute[] = []
  try {
    if (customAttributesJson) {
      customAttributes = JSON.parse(customAttributesJson)
    }
  } catch {
    customAttributes = []
  }

  const updates = {
    name: formData.get("name") as string,
    sku: (formData.get("sku") as string) || null,
    description: (formData.get("description") as string) || null,
    price: Number.parseFloat(formData.get("price") as string) || 0,
    stock: Number.parseInt(formData.get("stock") as string) || 0,
    category: (formData.get("category") as string) || null,
    image_url: (formData.get("image_url") as string) || null,
    custom_attributes: customAttributes,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from("products").update(updates).eq("id", id).eq("user_id", user.id)

  if (error) throw error

  revalidatePath("/dashboard/products")
  return { success: true }
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Oturum açılmamış")

  const { error } = await supabase.from("products").delete().eq("id", id).eq("user_id", user.id)

  if (error) throw error

  revalidatePath("/dashboard/products")
  return { success: true }
}

export async function deleteProducts(ids: string[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Oturum açılmamış")

  const { error } = await supabase.from("products").delete().in("id", ids).eq("user_id", user.id)

  if (error) throw error

  revalidatePath("/dashboard/products")
  return { success: true }
}

export async function bulkImportProducts(products: Omit<Product, "id" | "user_id" | "created_at" | "updated_at">[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Oturum açılmamış")

  const productsWithUserId = products.map((p) => ({
    ...p,
    user_id: user.id,
  }))

  const { data, error } = await supabase.from("products").insert(productsWithUserId).select()

  if (error) throw error

  revalidatePath("/dashboard/products")
  return data
}
