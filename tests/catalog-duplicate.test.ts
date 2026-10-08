import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  source: null as Record<string, unknown> | null,
  catalogCount: 0,
  plan: "plus",
  inserted: null as Record<string, unknown> | null,
}))

vi.mock("@/backend/src/services/supabase", () => {
  const from = (table: string) => {
    if (table === "catalogs") {
      return {
        select: (_cols: string, opts?: { head?: boolean }) => {
          if (opts?.head) {
            return { eq: async () => ({ count: state.catalogCount, error: null }) }
          }
          return {
            eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.source, error: null }) }) }),
          }
        },
        insert: (row: Record<string, unknown>) => {
          state.inserted = row
          return { select: () => ({ single: async () => ({ data: { id: "copy-1", ...row }, error: null }) }) }
        },
      }
    }
    return { select: () => ({ eq: () => ({ single: async () => ({ data: { plan: state.plan, full_name: "Ayse" } }) }) }) }
  }
  return { supabase: { from } }
})

vi.mock("@/backend/src/services/redis", () => ({
  deleteCache: vi.fn(async () => undefined),
  getOrSetCache: async (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn(),
  cacheKeys: { user: (id: string) => `u:${id}`, catalogs: (id: string) => `c:${id}`, stats: (id: string) => `s:${id}`, catalog: () => "x" },
  cacheTTL: { user: 1, catalogs: 1 },
}))

vi.mock("@/backend/src/services/activity-logger", () => ({
  logActivity: vi.fn(async () => undefined),
  getRequestInfo: () => ({}),
  ActivityDescriptions: { catalogCreated: (name: string) => name },
}))

vi.mock("@/backend/src/controllers/notifications", () => ({
  createNotification: vi.fn(),
  NotificationTemplates: {},
}))

import { duplicateCatalog } from "@/backend/src/controllers/catalogs/write"

function run(body: unknown = {}) {
  const res = {
    statusCode: 200,
    payload: undefined as unknown,
    status(code: number) { this.statusCode = code; return this },
    json(data: unknown) { this.payload = data; return this },
  }
  const req = { params: { id: "source-1" }, body, headers: {}, user: { id: "user-1" } }
  return duplicateCatalog(req as never, res as never).then(() => res)
}

describe("duplicateCatalog", () => {
  beforeEach(() => {
    state.source = {
      id: "source-1",
      user_id: "user-1",
      name: "Yaz",
      description: "Açıklama",
      layout: "magazine",
      product_ids: ["p1", "p2"],
      primary_color: "#111111",
      cover_theme: "modern",
      is_published: true,
      share_slug: "ayse-yaz-abc",
      view_count: 42,
    }
    state.catalogCount = 1
    state.plan = "plus"
    state.inserted = null
  })

  it("copies design and products but not publish state, slug or stats", async () => {
    const res = await run({ name: "Yaz (kopya)" })

    expect(res.statusCode).toBe(201)
    expect(state.inserted).toMatchObject({
      user_id: "user-1",
      name: "Yaz (kopya)",
      layout: "magazine",
      product_ids: ["p1", "p2"],
      primary_color: "#111111",
      cover_theme: "modern",
      is_published: false,
    })
    expect(state.inserted).not.toHaveProperty("view_count")
    expect(state.inserted?.share_slug).not.toBe("ayse-yaz-abc")
  })

  it("enforces the plan catalog limit", async () => {
    state.plan = "free"
    const res = await run()

    expect(res.statusCode).toBe(403)
    expect(state.inserted).toBeNull()
  })

  it("returns 404 for catalogs the user does not own", async () => {
    state.source = null
    const res = await run()

    expect(res.statusCode).toBe(404)
    expect(state.inserted).toBeNull()
  })
})
