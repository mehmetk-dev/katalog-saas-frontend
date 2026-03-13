"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"

import type { User } from "@/lib/user/types"

export function useSentryUser(user: User | null) {
  useEffect(() => {
    if (!user) {
      Sentry.setUser(null)
      return
    }

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
      company: user.company,
      plan: user.plan,
    })
  }, [user])
}
