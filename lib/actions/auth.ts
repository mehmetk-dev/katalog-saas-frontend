"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { apiFetch } from "@/lib/api"

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/auth")
}

export async function getCurrentUser() {
  try {
    const user = await apiFetch<any>("/users/me")
    return user
  } catch (error) {
    // console.error("Error fetching current user:", error)
    return null
  }
}

export async function updateProfile(formData: FormData) {
  const fullName = formData.get("fullName") as string
  const company = formData.get("company") as string

  try {
    await apiFetch("/users/me", {
      method: "PUT",
      body: JSON.stringify({
        full_name: fullName,
        company: company,
      }),
    })
    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error) {
    throw error
  }
}

export async function deleteAccount() {
  const supabase = await createServerSupabaseClient()

  try {
    // Delete data via API first
    await apiFetch("/users/me", {
      method: "DELETE",
    })

    // Sign out from Supabase Auth
    await supabase.auth.signOut()

    redirect("/")
  } catch (error) {
    throw error
  }
}

