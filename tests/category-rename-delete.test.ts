import { beforeEach, describe, expect, it, vi } from "vitest"

type Row = Record<string, unknown>

const db = vi.hoisted(() => ({ tables: {} as Record<string, Row[]> }))

/** Zincirlenebilir, await edilebilir küçük bir sorgu sahtesi (yalnızca bu testin kullandıkları) */
vi.mock("@/backend/src/services/supabase", () => {
  function query(table: string) {
    const filters: Array<(row: Row) => boolean> = []
    let action: { type: "select" | "update" | "delete"; patch?: Row } = { type: "select" }
    let single = false
    let range: [number, number] | null = null
    const builder = {
      select: () => builder,
      update: (patch: Row) => ((action = { type: "update", patch }), builder),
      delete: () => ((action = { type: "delete" }), builder),
      eq: (col: string, value: unknown) => (filters.push((r) => r[col] === value), builder),
      in: (col: string, values: unknown[]) => (filters.push((r) => values.includes(r[col])), builder),
      not: (col: string) => (filters.push((r) => r[col] !== null && r[col] !== undefined), builder),
      order: () => builder,
      range: (from: number, to: number) => ((range = [from, to]), builder),
      single: () => ((single = true), builder),
      then(resolve: (value: { data: unknown; error: null }) => void) {
        const rows = db.tables[table] ?? []
        let matched = rows.filter((r) => filters.every((f) => f(r)))
        if (action.type === "update") matched.forEach((r) => Object.assign(r, action.patch))
        if (action.type === "delete") db.tables[table] = rows.filter((r) => !matched.includes(r))
        if (range) matched = matched.slice(range[0], range[1] + 1)
        const data = single ? { ...matched[0] } : matched.map((r) => ({ ...r }))
        resolve({ data, error: null })
      },
    }
    return builder
  }
  return { supabase: { from: (table: string) => query(table) } }
})

vi.mock("@/backend/src/services/redis", () => ({
  deleteCache: vi.fn(async () => undefined),
  setProductsInvalidated: vi.fn(),
  cacheKeys: { products: (id: string) => `p:${id}`, stats: (id: string) => `s:${id}`, catalogs: (id: string) => `c:${id}`, publicCatalog: (slug: string) => `pub:${slug}` },
}))

vi.mock("@/backend/src/services/activity-logger", () => ({
  logActivity: vi.fn(async () => undefined),
  getRequestInfo: () => ({}),
  ActivityDescriptions: { categoryDeleted: (name: string) => name },
}))

import { deleteCategoryFromProducts, renameCategory } from "@/backend/src/controllers/products/bulk-category"

async function run(handler: typeof renameCategory, body: Row) {
  const res = {
    statusCode: 200,
    payload: undefined as unknown,
    status(code: number) { this.statusCode = code; return this },
    json(data: unknown) { this.payload = data; return this },
  }
  await handler({ body, headers: {}, user: { id: "u1" } } as never, res as never)
  return res
}

const category = (id: string) => db.tables.products.find((p) => p.id === id)?.category

describe("kategori yeniden adlandırma / silme", () => {
  beforeEach(() => {
    db.tables = {
      products: [
        { id: "1", user_id: "u1", category: "Masa, Sandalye" },
        { id: "2", user_id: "u1", category: "Masa Lambası" },
        { id: "3", user_id: "u1", category: "masa, Ofis" },
        { id: "4", user_id: "u1", category: "Ev & Yaşam (Yeni), Ofis" },
        { id: "5", user_id: "other", category: "Masa" },
      ],
      category_metadata: [
        { id: "m1", user_id: "u1", category_name: "Masa", color: "#111" },
        { id: "m2", user_id: "u1", category_name: "Ev & Yaşam (Yeni)", color: "#222" },
      ],
      catalogs: [
        { id: "c1", user_id: "u1", category_order: ["Masa", "Ofis", "Ev & Yaşam (Yeni)"], share_slug: "k", is_published: true },
      ],
    }
  })

  it("yalnızca tam eşleşen kategoriyi değiştirir, benzer adlara dokunmaz", async () => {
    const res = await run(renameCategory, { oldName: "Masa", newName: "Masalar" })
    expect(res.statusCode).toBe(200)
    expect(category("1")).toBe("Masalar, Sandalye")
    expect(category("2")).toBe("Masa Lambası")
    expect(category("3")).toBe("Masalar, Ofis")
    expect(category("5")).toBe("Masa") // başka kullanıcı
  })

  it("var olan kategoriyle birleşince tekrar oluşturmaz", async () => {
    await run(renameCategory, { oldName: "Masa", newName: "Ofis" })
    expect(category("3")).toBe("Ofis")
    expect(db.tables.catalogs[0].category_order).toEqual(["Ofis", "Ev & Yaşam (Yeni)"])
  })

  it("renk/kapak kaydını ve katalog sırasını yeni ada taşır", async () => {
    await run(renameCategory, { oldName: "Masa", newName: "Masalar" })
    expect(db.tables.category_metadata.find((m) => m.id === "m1")?.category_name).toBe("Masalar")
    expect(db.tables.catalogs[0].category_order).toEqual(["Masalar", "Ofis", "Ev & Yaşam (Yeni)"])
  })

  it("noktalama içeren kategoriyi siler; ürünleri, kaydı ve katalog sırasını temizler", async () => {
    const res = await run(deleteCategoryFromProducts, { categoryName: "Ev & Yaşam (Yeni)" })
    expect(res.statusCode).toBe(200)
    expect(category("4")).toBe("Ofis")
    expect(db.tables.category_metadata.some((m) => m.id === "m2")).toBe(false)
    expect(db.tables.catalogs[0].category_order).toEqual(["Masa", "Ofis"])
  })

  it("virgüllü yeni adı reddeder (ürünlerde ayraç olarak kullanılıyor)", async () => {
    const res = await run(renameCategory, { oldName: "Masa", newName: "Masa, Sehpa" })
    expect(res.statusCode).toBe(400)
  })
})
