import { beforeEach, describe, expect, it, vi } from "vitest"

type Row = Record<string, unknown>

const db = vi.hoisted(() => ({
  tables: {} as Record<string, Row[]>,
  auth: { deleted: [] as string[], updated: [] as Array<{ id: string; attrs: Row }> },
}))

vi.mock("@/backend/src/services/supabase", () => {
  function query(table: string) {
    const filters: Array<(row: Row) => boolean> = []
    let action: { type: "select" | "update" | "delete" | "upsert"; patch?: Row } = { type: "select" }
    let head = false
    let maybeSingle = false
    const builder = {
      select: (_cols?: string, opts?: { head?: boolean }) => ((head = Boolean(opts?.head)), builder),
      update: (patch: Row) => ((action = { type: "update", patch }), builder),
      delete: () => ((action = { type: "delete" }), builder),
      upsert: (row: Row) => {
        ;(db.tables[table] ??= []).push(row)
        return Promise.resolve({ error: null })
      },
      eq: (col: string, value: unknown) => (filters.push((r) => r[col] === value), builder),
      order: () => builder,
      range: () => builder,
      maybeSingle: () => ((maybeSingle = true), builder),
      then(resolve: (value: unknown) => void) {
        const rows = db.tables[table] ?? []
        const matched = rows.filter((r) => filters.every((f) => f(r)))
        if (action.type === "update") matched.forEach((r) => Object.assign(r, action.patch))
        if (action.type === "delete") db.tables[table] = rows.filter((r) => !matched.includes(r))
        if (head) return resolve({ count: matched.length, error: null })
        resolve({ data: maybeSingle ? matched[0] ?? null : matched, error: null })
      },
    }
    return builder
  }
  return {
    supabase: {
      from: (table: string) => query(table),
      auth: {
        admin: {
          deleteUser: async (id: string) => {
            db.auth.deleted.push(id)
            return { error: null }
          },
          updateUserById: async (id: string, attrs: Row) => {
            db.auth.updated.push({ id, attrs })
            return { error: null }
          },
        },
      },
    },
  }
})

vi.mock("@/backend/src/services/redis", () => ({
  deleteCache: vi.fn(async () => undefined),
  cacheKeys: { user: (id: string) => `u:${id}` },
}))

vi.mock("@/backend/src/services/activity-logger", () => ({
  logActivity: vi.fn(async () => undefined),
  getRequestInfo: () => ({}),
  ActivityDescriptions: { accountDeleted: () => "deleted" },
}))

const cleanup = vi.hoisted(() => ({ calls: [] as string[][] }))
vi.mock("@/backend/src/controllers/products/media", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/backend/src/controllers/products/media")>()
  return {
    ...actual,
    cleanupProductPhotos: vi.fn(async (urls: string[]) => {
      cleanup.calls.push(urls)
    }),
  }
})

import { deleteMe } from "@/backend/src/controllers/users"

async function run() {
  const res = {
    statusCode: 200,
    payload: undefined as unknown,
    status(code: number) { this.statusCode = code; return this },
    json(data: unknown) { this.payload = data; return this },
  }
  await deleteMe({ body: {}, headers: {}, user: { id: "u1" } } as never, res as never)
  return res
}

describe("hesap silme", () => {
  beforeEach(() => {
    cleanup.calls = []
    db.auth = { deleted: [], updated: [] }
    db.tables = {
      users: [{ id: "u1", email: "ayse@example.com", full_name: "Ayşe", company: "Ayşe Ltd", plan: "plus" }],
      products: [
        { id: "p1", user_id: "u1", image_url: "https://res.cloudinary.com/x/p1.jpg", images: ["https://res.cloudinary.com/x/p1.jpg", "https://res.cloudinary.com/x/p1b.jpg"] },
        { id: "p2", user_id: "other", image_url: "https://res.cloudinary.com/x/other.jpg", images: [] },
      ],
      catalogs: [{ id: "c1", user_id: "u1", cover_image_url: "https://res.cloudinary.com/x/cover.jpg", logo_url: null, background_image: null }],
      category_metadata: [],
      notifications: [],
      billing_payment_attempts: [],
      billing_documents: [],
      deleted_users: [],
    }
  })

  it("ödeme geçmişi yoksa kullanıcıyı tamamen siler", async () => {
    const res = await run()
    expect(res.statusCode).toBe(200)
    expect(res.payload).toMatchObject({ mode: "deleted" })
    expect(db.auth.deleted).toEqual(["u1"])
    expect(db.tables.deleted_users).toHaveLength(1)
  })

  it("ödeme geçmişi varsa içeriği ve kişisel bilgileri siler, ödeme kayıtlarını korur, girişi kapatır", async () => {
    db.tables.billing_payment_attempts.push({ id: "a1", user_id: "u1" })

    const res = await run()

    expect(res.statusCode).toBe(200)
    expect(res.payload).toMatchObject({ mode: "anonymized" })
    expect(db.auth.deleted).toEqual([])
    expect(db.tables.products.map((p) => p.id)).toEqual(["p2"])
    expect(db.tables.catalogs).toHaveLength(0)
    expect(db.tables.billing_payment_attempts).toHaveLength(1)
    expect(db.tables.users[0]).toMatchObject({ full_name: null, company: null, plan: "free" })
    expect(String(db.tables.users[0].email)).toMatch(/^deleted-u1@/)
    expect(db.auth.updated[0]).toMatchObject({ id: "u1", attrs: expect.objectContaining({ ban_duration: "876000h" }) })
  })

  it("hesabın görsellerini (yalnızca kendi) Cloudinary temizliğine gönderir", async () => {
    await run()
    expect(cleanup.calls).toHaveLength(1)
    expect(cleanup.calls[0].sort()).toEqual([
      "https://res.cloudinary.com/x/cover.jpg",
      "https://res.cloudinary.com/x/p1.jpg",
      "https://res.cloudinary.com/x/p1b.jpg",
    ])
  })
})
