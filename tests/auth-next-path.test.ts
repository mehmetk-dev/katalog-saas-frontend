import { describe, expect, it } from "vitest"

import { sanitizeNextPath } from "@/lib/auth/next-path"

describe("sanitizeNextPath", () => {
  it("keeps same-origin relative paths with query and hash", () => {
    expect(sanitizeNextPath("/dashboard/products?page=2#top")).toBe("/dashboard/products?page=2#top")
  })

  it.each([
    null,
    "",
    "dashboard",
    "//evil.example.com",
    "/\\evil.example.com",
    "/\t/evil.example.com",
    "https://evil.example.com",
    "javascript:alert(1)",
    "%2F%2Fevil.example.com",
  ])("falls back for unsafe target %j", (value) => {
    expect(sanitizeNextPath(value)).toBe("/dashboard")
  })

  it("rejects auth pages to avoid redirect loops", () => {
    expect(sanitizeNextPath("/auth?tab=signup")).toBe("/dashboard")
    expect(sanitizeNextPath("/auth/callback")).toBe("/dashboard")
  })

  it("uses the provided fallback", () => {
    expect(sanitizeNextPath(null, "/dashboard/catalogs")).toBe("/dashboard/catalogs")
  })
})
