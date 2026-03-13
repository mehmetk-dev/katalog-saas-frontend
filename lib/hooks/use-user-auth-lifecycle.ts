"use client"

import { useCallback, useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react"
import type { SupabaseClient, User as SupabaseUser } from "@supabase/supabase-js"

import type { User } from "@/lib/user/types"

interface UseUserAuthLifecycleParams {
  supabase: SupabaseClient
  initialUser: User | null
  fetchUserProfile: (authUser: SupabaseUser) => Promise<boolean>
  setUser: Dispatch<SetStateAction<User | null>>
  setSupabaseUser: Dispatch<SetStateAction<SupabaseUser | null>>
  setIsLoading: Dispatch<SetStateAction<boolean>>
  isLoggingOutRef: MutableRefObject<boolean>
  supabaseUserIdRef: MutableRefObject<string | null>
}

interface UseUserAuthLifecycleResult {
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

export function useUserAuthLifecycle({
  supabase,
  initialUser,
  fetchUserProfile,
  setUser,
  setSupabaseUser,
  setIsLoading,
  isLoggingOutRef,
  supabaseUserIdRef,
}: UseUserAuthLifecycleParams): UseUserAuthLifecycleResult {
  const clearUserState = useCallback(() => {
    setSupabaseUser(null)
    supabaseUserIdRef.current = null
    setUser(null)
  }, [setSupabaseUser, setUser, supabaseUserIdRef])

  const refreshUser = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (authUser) {
      await fetchUserProfile(authUser)
      setSupabaseUser(authUser)
      supabaseUserIdRef.current = authUser.id
      return
    }

    clearUserState()
  }, [supabase.auth, fetchUserProfile, setSupabaseUser, clearUserState, supabaseUserIdRef])

  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          clearUserState()
          return
        }

        setSupabaseUser(authUser)
        supabaseUserIdRef.current = authUser.id

        if (initialUser && initialUser.id === authUser.id) {
          return
        }

        const success = await fetchUserProfile(authUser)
        if (!success) {
          console.warn("Could not fetch user profile, using existing user state")
        }
      } catch (error) {
        console.error("Auth init error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (initialUser) {
      setIsLoading(false)
    } else {
      void initAuth()
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (isLoggingOutRef.current && event === "SIGNED_IN") {
          return
        }

        if (event === "SIGNED_OUT") {
          clearUserState()
          return
        }

        if (!session?.user) {
          clearUserState()
          return
        }

        const currentUserId = supabaseUserIdRef.current || initialUser?.id
        if (currentUserId && currentUserId === session.user.id && event !== "SIGNED_IN") {
          setSupabaseUser(session.user)
          return
        }

        setSupabaseUser(session.user)
        supabaseUserIdRef.current = session.user.id
        await fetchUserProfile(session.user)
      } finally {
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [
    supabase.auth,
    initialUser,
    setIsLoading,
    setSupabaseUser,
    fetchUserProfile,
    isLoggingOutRef,
    supabaseUserIdRef,
    clearUserState,
  ])

  const logout = useCallback(async () => {
    if (isLoggingOutRef.current) {
      return
    }

    isLoggingOutRef.current = true

    try {
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3000))
      await Promise.race([signOutPromise, timeoutPromise])
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      if (typeof window !== "undefined") {
        window.location.href = "/auth?logged_out=1"
      }
    }
  }, [supabase.auth, isLoggingOutRef])

  return { refreshUser, logout }
}
