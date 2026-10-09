import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }))

// vitest.setup.ts next/server'ı global olarak mock'luyor; middleware gerçek NextResponse ile test edilmeli
vi.mock("next/server", async () => await vi.importActual<typeof import("next/server")>("next/server"))

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
    from: vi.fn(() => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { is_admin: false } }) }) }) })),
  })),
}))

import { updateSession } from "@/lib/supabase/proxy"

const THIRTEEN_HOURS_MS = 13 * 60 * 60 * 1000

function request(path: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(`https://fogcatalog.test${path}`)
  for (const [name, value] of Object.entries(cookies)) req.cookies.set(name, value)
  return req
}

describe("updateSession", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon"
    getUserMock.mockReset()
  })

  it("redirects anonymous dashboard visits to /auth with the original target", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null })

    const response = await updateSession(request("/dashboard/products?page=2&_rsc=abc"))

    expect(response.status).toBe(303)
    const location = new URL(response.headers.get("location")!)
    expect(location.pathname).toBe("/auth")
    expect(location.searchParams.get("next")).toBe("/dashboard/products?page=2")
    expect(location.searchParams.has("page")).toBe(false)
  })

  it("does not bounce public pages when the inactivity timer has expired", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
    const staleTimer = String(Date.now() - THIRTEEN_HOURS_MS)

    const response = await updateSession(request("/catalog/spring-2026", { auth_session_timer: staleTimer }))

    expect(response.headers.get("location")).toBeNull()
    expect(response.cookies.get("auth_session_timer")?.value).toBe("")
  })

  it("still logs out dashboard visits when the inactivity timer has expired", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
    const staleTimer = String(Date.now() - THIRTEEN_HOURS_MS)

    const response = await updateSession(request("/dashboard", { auth_session_timer: staleTimer }))

    expect(response.status).toBe(303)
    expect(new URL(response.headers.get("location")!).pathname).toBe("/auth")
  })

  it("does not bounce public pages on a stale refresh token", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: { code: "refresh_token_not_found" } })

    const response = await updateSession(request("/catalog/spring-2026"))

    expect(response.headers.get("location")).toBeNull()
  })

  it.each(["refresh_token_already_used", "session_not_found", "session_expired"])(
    "logs out dashboard visits and clears cookies when the session is dead (%s)",
    async (code) => {
      getUserMock.mockResolvedValue({ data: { user: null }, error: { code } })

      const response = await updateSession(
        request("/dashboard/builder?id=c1", { "sb-project-auth-token.0": "a", "sb-project-auth-token.1": "b" }),
      )

      expect(response.status).toBe(303)
      const location = new URL(response.headers.get("location")!)
      expect(location.pathname).toBe("/auth")
      expect(location.searchParams.get("session")).toBe("expired")
      expect(location.searchParams.get("next")).toBe("/dashboard/builder?id=c1")
      expect(response.cookies.get("sb-project-auth-token.0")?.value).toBe("")
      expect(response.cookies.get("sb-project-auth-token.1")?.value).toBe("")
    },
  )

  it("logs out a returning user whose timer cookie expired long ago (falls back to last sign-in)", async () => {
    const lastSignIn = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1", last_sign_in_at: lastSignIn } }, error: null })

    const response = await updateSession(request("/dashboard"))

    expect(response.status).toBe(303)
    expect(new URL(response.headers.get("location")!).searchParams.get("session")).toBe("expired")
  })

  it("lets a fresh login in and starts the inactivity timer", async () => {
    const lastSignIn = new Date(Date.now() - 60 * 1000).toISOString()
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1", last_sign_in_at: lastSignIn } }, error: null })

    const response = await updateSession(request("/dashboard"))

    expect(response.headers.get("location")).toBeNull()
    expect(Number(response.cookies.get("auth_session_timer")?.value)).toBeGreaterThan(Date.now() - 5000)
  })

  it("keeps an active user signed in even if they signed in days ago", async () => {
    const lastSignIn = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1", last_sign_in_at: lastSignIn } }, error: null })

    const response = await updateSession(request("/dashboard", { auth_session_timer: String(Date.now() - 60 * 1000) }))

    expect(response.headers.get("location")).toBeNull()
  })
})
