import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { buildRecoveryRedirectTarget } from "@/app/auth/confirm-recovery/page"
import { checkRateLimit } from "@/lib/services/rate-limit"

describe("auth security regressions", () => {
  it("does not trust spoofable forwarded IP headers by default", () => {
    const first = new Headers({ "x-forwarded-for": "203.0.113.10" })
    const spoofed = new Headers({ "x-forwarded-for": "203.0.113.11" })
    const keyPrefix = `auth-test-${Date.now()}-${Math.random()}`

    expect(checkRateLimit(first, keyPrefix, 1).allowed).toBe(true)
    expect(checkRateLimit(spoofed, keyPrefix, 1).allowed).toBe(false)
  })

  it("consumes recovery hash before redirecting to reset password", () => {
    const hash = "#access_token=access-token&refresh_token=refresh-token&type=recovery"

    expect(buildRecoveryRedirectTarget("/auth/reset-password", hash)).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      redirectPath: "/auth/reset-password",
    })
  })

  it("does not grant direct users updates or activity log inserts to authenticated clients", () => {
    const initialSchema = readFileSync(join(process.cwd(), "supabase/migrations/00_initial_schema.sql"), "utf8")
    const activityLogs = readFileSync(join(process.cwd(), "supabase/migrations/activity_logs.sql"), "utf8")

    expect(initialSchema).not.toMatch(/CREATE POLICY\s+users_update_own[\s\S]*?FOR UPDATE\s+USING\s*\(auth\.uid\(\)\s*=\s*id\)/i)
    expect(activityLogs).not.toMatch(/GRANT\s+INSERT\s+ON\s+activity_logs\s+TO\s+authenticated/i)
  })
})
