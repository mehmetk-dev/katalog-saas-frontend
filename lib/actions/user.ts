"use server"

import { revalidatePath } from "next/cache"

import { apiFetch } from "@/lib/api"
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

