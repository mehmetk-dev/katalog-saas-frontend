export type UserPlan = "free" | "plus" | "pro"

export interface User {
  id: string
  name: string
  email: string
  company: string
  avatar_url?: string
  logo_url?: string | null
  plan: UserPlan
  industry?: string
  exportsUsed: number
  maxExports: number
  productsCount: number
  maxProducts: number
  catalogsCount: number
  isAdmin?: boolean
  instagram_url?: string | null
  youtube_url?: string | null
  website_url?: string | null
}

export interface UserProfileRow {
  full_name: string | null
  company: string | null
  avatar_url: string | null
  logo_url: string | null
  plan: string | null
  exports_used: number | null
  is_admin: boolean | null
  instagram_url: string | null
  youtube_url: string | null
  website_url: string | null
}
