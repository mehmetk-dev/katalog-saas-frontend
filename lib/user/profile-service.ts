import type { SupabaseClient } from "@supabase/supabase-js"

import type { UserProfileRow } from "@/lib/user/types"

interface FetchUserProfileDataResult {
  profile: UserProfileRow | null
  productsCount: number
  catalogsCount: number
}

interface RetryOptions {
  maxRetries?: number
  retryDelayMs?: number
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchUserProfileData(supabase: SupabaseClient, userId: string): Promise<FetchUserProfileDataResult> {
  const [profileResult, productsResult, catalogsResult] = await Promise.all([
    supabase
      .from("users")
      .select("full_name, company, avatar_url, logo_url, plan, exports_used, is_admin, instagram_url, youtube_url, website_url")
      .eq("id", userId)
      .single(),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("catalogs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ])

  const { data: profile, error: profileError } = profileResult

  if (profileError && profileError.code !== "PGRST116") {
    throw profileError
  }

  return {
    profile: profile ?? null,
    productsCount: productsResult.count || 0,
    catalogsCount: catalogsResult.count || 0,
  }
}

export async function fetchUserProfileDataWithRetry(
  supabase: SupabaseClient,
  userId: string,
  options: RetryOptions = {},
): Promise<FetchUserProfileDataResult> {
  const maxRetries = options.maxRetries ?? 3
  const retryDelayMs = options.retryDelayMs ?? 1000

  let lastError: unknown = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchUserProfileData(supabase, userId)
    } catch (error) {
      lastError = error
      if (attempt >= maxRetries) {
        break
      }
      await delay(retryDelayMs)
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Profile fetch failed")
}
