"use server"

import { revalidatePath } from "next/cache"
import { apiFetch } from "@/lib/api"
import { signOut } from "@/lib/actions/auth"

export async function updateUserProfile(data: {
  full_name?: string
  company?: string
}) {
  try {
    await apiFetch("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    })
    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getUserProfile() {
  try {
    return await apiFetch("/users/me")
  } catch (error) {
    return null
  }
}

export async function deleteUserAccount() {
  try {
    await apiFetch("/users/me", {
      method: "DELETE",
    })
    await signOut()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function incrementUserExports() {
  try {
    await apiFetch("/users/me/export", {
      method: "POST",
    })
    return { success: true }
  } catch (error: any) {
    if (error.message.includes("Export limit reached")) {
      return { error: "limit_reached" }
    }
    return { error: error.message }
  }
}

export async function upgradeUserToPro() {
  try {
    await apiFetch("/users/me/upgrade", {
      method: "POST",
    })
    // Revalidate user profile paths
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

