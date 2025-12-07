"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateUserProfile(data: {
  full_name?: string
  company?: string
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Giriş yapmalısınız" }
  }

  const { error } = await supabase
    .from("users")
    .update({
      full_name: data.full_name,
      company: data.company,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function getUserProfile() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase.from("users").select("*").eq("id", user.id).single()

  return data
}

export async function deleteUserAccount() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Giriş yapmalısınız" }
  }

  // Delete user data from our tables (cascades will handle related data)
  const { error: deleteError } = await supabase.from("users").delete().eq("id", user.id)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  // Sign out the user
  await supabase.auth.signOut()

  return { success: true }
}
