"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/auth")
}

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get user profile from users table
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Get products count
  const { count: productsCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Get catalogs count
  const { count: catalogsCount } = await supabase
    .from("catalogs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  return {
    id: user.id,
    email: user.email!,
    name: profile?.full_name || user.user_metadata?.full_name || "Kullanıcı",
    company: profile?.company || "",
    avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
    plan: profile?.plan || "free",
    productsCount: productsCount || 0,
    catalogsCount: catalogsCount || 0,
    maxProducts: profile?.plan === "pro" ? 999999 : 50,
    maxExports: profile?.plan === "pro" ? 999999 : 1,
    exportsUsed: 0,
  }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Giriş yapmalısınız")

  const fullName = formData.get("fullName") as string
  const company = formData.get("company") as string

  const { error } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      company: company,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) throw error

  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function deleteAccount() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Giriş yapmalısınız")

  // Delete user data (cascade will handle related data)
  await supabase.from("users").delete().eq("id", user.id)

  // Sign out
  await supabase.auth.signOut()

  redirect("/")
}
