"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"
import { useSentryUser } from "@/lib/hooks/use-sentry-user"
import { useUserAuthLifecycle } from "@/lib/hooks/use-user-auth-lifecycle"
import { fetchUserProfileDataWithRetry } from "@/lib/user/profile-service"
import { buildUserFromProfile } from "@/lib/user/user-mapper"
import type { User } from "@/lib/user/types"

export type { User, UserPlan } from "@/lib/user/types"

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
  const supabaseUserIdRef = useRef<string | null>(initialSupabaseUser?.id ?? null)
  const [supabase] = useState(() => createClient())

  const fetchUserProfile = useCallback(
    async (authUser: SupabaseUser): Promise<boolean> => {
      try {
        const { profile, productsCount, catalogsCount } = await fetchUserProfileDataWithRetry(supabase, authUser.id)

        setUser(
          buildUserFromProfile({
            authUser,
            profile,
            productsCount,
            catalogsCount,
          }),
        )

        return true
      } catch (error) {
        console.error("Profile fetch failed:", error)
        return false
      }
    },
    [supabase],
  )

  const { refreshUser, logout } = useUserAuthLifecycle({
    supabase,
    initialUser,
    fetchUserProfile,
    setUser,
    setSupabaseUser,
    setIsLoading,
    isLoggingOutRef,
    supabaseUserIdRef,
  })

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

  useSentryUser(user)

  const canExport = useCallback(() => {
    if (!user) return false
    if (user.plan === "pro") return true
    return user.exportsUsed < user.maxExports
  }, [user])

  const incrementExports = useCallback((): boolean => {
    if (!user) return false
    if (user.plan === "pro") return true
    if (user.exportsUsed >= user.maxExports) return false

    setUser((prev) => (prev ? { ...prev, exportsUsed: prev.exportsUsed + 1 } : prev))
    return true
  }, [user])

  const contextValue = useMemo(
    () => ({
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
    }),
    [user, supabaseUser, adjustCatalogsCount, isLoading, logout, refreshUser, incrementExports, canExport],
  )

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
