import type { User as SupabaseUser } from "@supabase/supabase-js"

import type { User, UserPlan, UserProfileRow } from "@/lib/user/types"

interface BuildUserParams {
  authUser: SupabaseUser
  profile: UserProfileRow | null
  productsCount: number
  catalogsCount: number
}

const PLAN_LIMITS: Record<UserPlan, { maxProducts: number; maxExports: number }> = {
  free: { maxProducts: 50, maxExports: 0 },
  plus: { maxProducts: 1000, maxExports: 50 },
  pro: { maxProducts: 999999, maxExports: 999999 },
}

export function normalizePlan(plan: string | null | undefined): UserPlan {
  const normalized = plan?.toLowerCase()
  if (normalized === "plus" || normalized === "pro") {
    return normalized
  }
  return "free"
}

function getSafeDisplayName(profileName: string | null, metadataName: unknown): string {
  const nameFromProfile = typeof profileName === "string" ? profileName.trim() : ""
  if (nameFromProfile && !nameFromProfile.includes("�")) {
    return nameFromProfile
  }

  const nameFromMetadata = typeof metadataName === "string" ? metadataName.trim() : ""
  if (nameFromMetadata && !nameFromMetadata.includes("�")) {
    return nameFromMetadata
  }

  return "Kullanıcı"
}

export function buildUserFromProfile({ authUser, profile, productsCount, catalogsCount }: BuildUserParams): User {
  const plan = normalizePlan(profile?.plan)
  const limits = PLAN_LIMITS[plan]

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    name: getSafeDisplayName(profile?.full_name ?? null, authUser.user_metadata?.full_name),
    company: profile?.company || "",
    avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url,
    logo_url: profile?.logo_url || null,
    plan,
    productsCount,
    catalogsCount,
    maxProducts: limits.maxProducts,
    maxExports: limits.maxExports,
    exportsUsed: profile?.exports_used || 0,
    isAdmin: profile?.is_admin || false,
    instagram_url: profile?.instagram_url || null,
    youtube_url: profile?.youtube_url || null,
    website_url: profile?.website_url || null,
  }
}
