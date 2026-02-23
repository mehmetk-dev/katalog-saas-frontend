"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"
import * as Sentry from "@sentry/nextjs"

type UserPlan = "free" | "plus" | "pro"

export interface User {
  id: string
  name: string
  email: string
  company: string
  avatar_url?: string
  logo_url?: string
  plan: UserPlan
  industry?: string
  exportsUsed: number
  maxExports: number
  productsCount: number
  maxProducts: number
  catalogsCount: number
  isAdmin?: boolean
}

export interface UserContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  setUser: (user: User | null) => void
  adjustCatalogsCount: (delta: number) => void
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  incrementExports: () => boolean
  canExport: () => boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
  initialUser?: User | null
  initialSupabaseUser?: SupabaseUser | null
}

export function UserProvider({ children, initialUser = null, initialSupabaseUser = null }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(initialSupabaseUser)
  const [isLoading, setIsLoading] = useState(!initialUser)
  const isLoggingOutRef = useRef(false)
  const [supabase] = useState(() => createClient())

  const fetchUserProfile = useCallback(async (authUser: SupabaseUser, retryCount = 0): Promise<boolean> => {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 1000 // 1 saniye

    try {
      // BATCH QUERY OPTIMIZATION: Tüm query'leri paralel olarak çalıştır
      const [profileResult, productsResult, catalogsResult] = await Promise.all([
        // 1. User profile (is_admin dahil - ayrı sorgu gereksiz)
        supabase
          .from("users")
          .select("*, is_admin")
          .eq("id", authUser.id)
          .single(),
        // 2. Products count
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("user_id", authUser.id),
        // 3. Catalogs count
        supabase
          .from("catalogs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", authUser.id)
      ])

      const { data: profile, error } = profileResult
      const productsCount = productsResult.count
      const catalogsCount = catalogsResult.count

      // PGRST116 = "Row not found" - bu normal, yeni kullanıcı olabilir
      // Diğer hatalar için retry yap
      if (error) {
        console.warn(`Profile fetch error (code: ${error.code}, attempt ${retryCount + 1}/${MAX_RETRIES}):`, error.message)

        // Row not found değilse retry
        if (error.code !== 'PGRST116') {
          if (retryCount < MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
            return fetchUserProfile(authUser, retryCount + 1)
          }
          console.error("All retry attempts failed for profile fetch:", error.code, error.message)
          return false
        }
        // PGRST116 ise profil yok ama devam et (yeni kullanıcı)
      }

      // Profile varsa plan'ı al, yoksa yeni kullanıcı olabilir
      const plan = profile?.plan ? profile.plan.toLowerCase() : "free"

      setUser({
        id: authUser.id,
        email: authUser.email!,
        name: profile?.full_name || authUser.user_metadata?.full_name || "Kullanıcı",
        company: profile?.company || "",
        avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url,
        logo_url: profile?.logo_url || null,
        plan: plan as UserPlan,
        productsCount: productsCount || 0,
        catalogsCount: catalogsCount || 0,
        maxProducts: plan === "pro" ? 999999 : plan === "plus" ? 1000 : 50,
        maxExports: plan === "pro" ? 999999 : plan === "plus" ? 50 : 0,
        exportsUsed: profile?.exports_used || 0,
        isAdmin: profile?.is_admin || false,
      })
      return true
    } catch (error) {
      console.error(`Critical error in fetchUserProfile (attempt ${retryCount + 1}):`, error)

      if (retryCount < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        return fetchUserProfile(authUser, retryCount + 1)
      }

      // Tüm denemeler başarısız - mevcut user varsa koru, yoksa null bırak
      return false
    }
  }, [supabase])

  const refreshUser = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (authUser) {
      await fetchUserProfile(authUser)
    }
  }, [supabase.auth, fetchUserProfile])

  const adjustCatalogsCount = useCallback((delta: number) => {
    if (!delta) return
    setUser((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        catalogsCount: Math.max(0, (prev.catalogsCount || 0) + delta),
      }
    })
  }, [])

  useEffect(() => {
    // Sentry User Identification
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.name,
        company: user.company,
        plan: user.plan
      })
    } else {
      Sentry.setUser(null)
    }
  }, [user])

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (authUser) {
          setSupabaseUser(authUser)

          // OPTIMIZATION: initialUser zaten varsa ve aynı user'sa, client-side fetch ATMA
          if (initialUser && initialUser.id === authUser.id) {
            console.log("✅ Using SSR initial user data (skipping client fetch)")
            setIsLoading(false)
            return
          }

          const success = await fetchUserProfile(authUser)
          if (!success) {
            console.warn("Could not fetch user profile, showing limited info")
          }
        }
      } catch (error) {
        console.error("Auth init error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // OPTIMIZATION: initialUser varsa initAuth'u atla
    if (initialUser) {
      console.log("✅ Using SSR initial user (skipping initAuth)")
      setIsLoading(false)
    } else {
      initAuth()
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (isLoggingOutRef.current && event === "SIGNED_IN") {
          return
        }

        if (event === "SIGNED_OUT") {
          setSupabaseUser(null)
          setUser(null)
          return
        }

        if (session?.user) {
          // OPTIMIZATION: Sadece user değiştiyse fetch yap
          const currentUserId = supabaseUser?.id || initialUser?.id
          if (currentUserId && currentUserId === session.user.id && event !== 'SIGNED_IN') {
            console.log("✅ Same user, skipping profile refetch (event:", event + ")")
            setSupabaseUser(session.user)
            return
          }

          console.log("🔄 Auth state changed, fetching profile (event:", event + ")")
          setSupabaseUser(session.user)
          await fetchUserProfile(session.user)
        } else {
          setSupabaseUser(null)
          setUser(null)
        }
      } finally {
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUserProfile, supabase.auth, initialUser, supabaseUser?.id])

  const logout = useCallback(async () => {
    if (isLoggingOutRef.current) return
    isLoggingOutRef.current = true

    try {
      // Sign out silently without clearing state first to avoid flash
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3000))
      await Promise.race([signOutPromise, timeoutPromise])
    } catch (error) {
      console.error("Çıkış hatası:", error)
    } finally {
      // Redirect FIRST, then state will be cleaned by page unload
      if (typeof window !== "undefined") {
        window.location.href = "/auth?logged_out=1"
      }
    }
  }, [supabase.auth])

  const canExport = useCallback(() => {
    if (!user) return false
    if (user.plan === "pro") return true
    return user.exportsUsed < user.maxExports
  }, [user])

  const incrementExports = useCallback((): boolean => {
    if (!user) return false
    if (user.plan === "pro") return true
    if (user.exportsUsed >= user.maxExports) return false
    setUser({ ...user, exportsUsed: user.exportsUsed + 1 })
    return true
  }, [user])

  const contextValue = useMemo(() => ({
    user,
    supabaseUser,
    setUser,
    adjustCatalogsCount,
    isAuthenticated: !!user,
    isLoading,
    logout,
    refreshUser,
    incrementExports,
    canExport,
  }), [user, supabaseUser, adjustCatalogsCount, isLoading, logout, refreshUser, incrementExports, canExport])

  return (
    <UserContext.Provider value={contextValue}>
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
