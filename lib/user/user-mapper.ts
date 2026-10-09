import type { User as SupabaseUser } from "@supabase/supabase-js"

import { getPlanLimits } from "@/lib/constants"
import type { User, UserPlan, UserProfileRow } from "@/lib/user/types"

interface BuildUserParams {
  authUser: SupabaseUser
  profile: UserProfileRow | null
  productsCount: number
  catalogsCount: number
  monthlyExports: number
}

/** Sınırsız limitler UI'da sayı olarak taşınır */
const UNLIMITED = 999999
const finiteLimit = (value: number) => (Number.isFinite(value) ? value : UNLIMITED)

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

export function buildUserFromProfile({ authUser, profile, productsCount, catalogsCount, monthlyExports }: BuildUserParams): User {
  const plan = normalizePlan(profile?.plan)
  // Limitler tek kaynaktan (lib/constants); önceden burada ücretsiz plan PDF hakkı 0 yazıyordu
  const limits = getPlanLimits(plan)

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
    maxProducts: finiteLimit(limits.maxProducts),
    maxExports: finiteLimit(limits.maxExports),
    exportsUsed: monthlyExports,
    isAdmin: profile?.is_admin || false,
    subscriptionStatus: profile?.subscription_status ?? null,
    subscriptionEnd: profile?.subscription_end ?? null,
    instagram_url: profile?.instagram_url || null,
    youtube_url: profile?.youtube_url || null,
    website_url: profile?.website_url || null,
  }
}
