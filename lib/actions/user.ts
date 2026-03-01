"use server"

import { revalidatePath } from "next/cache"

import { apiFetch } from "@/lib/api"
import { signOut } from "@/lib/actions/auth"
import { validate, profileUpdateSchema } from "@/lib/validations"

export async function updateUserProfile(data: {
  full_name?: string
  company?: string
}) {
  try {
    // Validate and sanitize input
    const validatedData = validate(profileUpdateSchema, data)

    await apiFetch("/users/me", {
      method: "PUT",
      body: JSON.stringify(validatedData),
    })
    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

export async function getUserProfile() {
  try {
    return await apiFetch("/users/me")
  } catch {
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

export async function incrementUserExports(catalogName?: string) {
  try {
    await apiFetch("/users/me/export", {
      method: "POST",
      body: JSON.stringify({ catalogName }),
    })
    return { success: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error'
    if (errorMessage.includes("Export limit reached")) {
      return { error: "limit_reached" }
    }
    return { error: errorMessage }
  }
}

export async function upgradeUserToPlan(plan: "free" | "plus" | "pro") {
  try {
    await apiFetch("/users/me/upgrade", {
      method: "POST",
      body: JSON.stringify({ plan }),
    })
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error'
    return { error: errorMessage }
  }
}

/** @deprecated Use `upgradeUserToPlan("pro")` instead */
export async function upgradeUserToPro() { return upgradeUserToPlan("pro") }

/** @deprecated Use `upgradeUserToPlan("plus")` instead */
export async function upgradeUserToPlus() { return upgradeUserToPlan("plus") }

export async function sendWelcomeNotification() {
  try {
    await apiFetch("/users/me/welcome", {
      method: "POST",
    })
    return { success: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error'
    return { error: errorMessage }
  }
}

