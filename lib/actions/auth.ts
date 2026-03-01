"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { apiFetch } from "@/lib/api"
import { validate, profileUpdateSchema } from "@/lib/validations"

export async function signOut() {
  const supabase = await createServerSupabaseClient()

  // Get current user before signing out
  const { data: { user } } = await supabase.auth.getUser()

  // Log logout activity
  if (user) {
    try {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        user_email: user.email,
        activity_type: 'user_logout',
        description: `${user.email} sistemden çıkış yaptı`,
      })
    } catch (error) {
      console.error('Activity log error:', error)
    }
  }

  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/auth")
}

export async function getCurrentUser() {
  try {
    const user = await apiFetch<{ id: string; email: string; full_name?: string; company?: string; plan?: string; maxProducts?: number }>("/users/me")
    return user
  } catch {
    return null
  }
}

export async function updateProfile(formData: FormData, avatarUrl?: string | null, logoUrl?: string | null) {
  const fullName = formData.get("fullName") as string
  const company = formData.get("company") as string

  // Validate and sanitize input
  const validatedData = validate(profileUpdateSchema, {
    full_name: fullName,
    company: company,
    avatar_url: avatarUrl,
    logo_url: logoUrl
  })

  await apiFetch("/users/me", {
    method: "PUT",
    body: JSON.stringify(validatedData),
  })
  revalidatePath("/dashboard/settings")
  return { success: true }
}

// Builder'dan logo güncellendiğinde profili de güncelle
export async function updateUserLogo(logoUrl: string | null) {
  // Validate and sanitize input
  const validatedData = validate(profileUpdateSchema, { logo_url: logoUrl })

  await apiFetch("/users/me", {
    method: "PUT",
    body: JSON.stringify(validatedData),
  })
  revalidatePath("/dashboard/settings")
  revalidatePath("/dashboard/builder")
  return { success: true }
}

export async function deleteAccount() {
  const supabase = await createServerSupabaseClient()

  // Delete data via API first
  await apiFetch("/users/me", {
    method: "DELETE",
  })

  // Sign out from Supabase Auth
  await supabase.auth.signOut()

  redirect("/")
}

