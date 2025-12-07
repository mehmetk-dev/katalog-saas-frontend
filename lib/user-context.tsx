"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

type UserPlan = "free" | "pro"

interface User {
  id: string
  name: string
  email: string
  company: string
  avatar_url?: string
  plan: UserPlan
  industry?: string
  exportsUsed: number
  maxExports: number
  productsCount: number
  maxProducts: number
  catalogsCount: number
}

interface UserContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  incrementExports: () => boolean
  canExport: () => boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchUserProfile = async (authUser: SupabaseUser) => {
    // Get user profile
    const { data: profile } = await supabase.from("users").select("*").eq("id", authUser.id).single()

    // Get products count
    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("user_id", authUser.id)

    // Get catalogs count
    const { count: catalogsCount } = await supabase
      .from("catalogs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", authUser.id)

    const plan = profile?.plan || "free"

    setUser({
      id: authUser.id,
      email: authUser.email!,
      name: profile?.full_name || authUser.user_metadata?.full_name || "Kullanıcı",
      company: profile?.company || "",
      avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url,
      plan: plan as UserPlan,
      productsCount: productsCount || 0,
      catalogsCount: catalogsCount || 0,
      maxProducts: plan === "pro" ? 999999 : 50,
      maxExports: plan === "pro" ? 999999 : 1,
      exportsUsed: 0,
    })
  }

  const refreshUser = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (authUser) {
      await fetchUserProfile(authUser)
    }
  }

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        setSupabaseUser(authUser)
        await fetchUserProfile(authUser)
      }

      setIsLoading(false)
    }

    initAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user)
        await fetchUserProfile(session.user)
      } else {
        setSupabaseUser(null)
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    try {
      // Global scope ile tüm cihazlardan çıkış yap
      await supabase.auth.signOut({ scope: "global" })
    } catch (error) {
      console.error("Çıkış hatası:", error)
    }
    setUser(null)
    setSupabaseUser(null)
    // Hard redirect ile sayfayı yenile
    window.location.href = "/auth"
  }

  const canExport = () => {
    if (!user) return false
    if (user.plan === "pro") return true
    return user.exportsUsed < user.maxExports
  }

  const incrementExports = (): boolean => {
    if (!user) return false
    if (user.plan === "pro") return true
    if (user.exportsUsed >= user.maxExports) return false
    setUser({ ...user, exportsUsed: user.exportsUsed + 1 })
    return true
  }

  return (
    <UserContext.Provider
      value={{
        user,
        supabaseUser,
        setUser,
        isAuthenticated: !!user,
        isLoading,
        logout,
        refreshUser,
        incrementExports,
        canExport,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
