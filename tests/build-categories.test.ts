import { describe, expect, it } from "vitest"

import { buildCategoryList, UNCATEGORIZED_ID } from "@/components/categories/build-categories"

describe("buildCategoryList", () => {
  const products = [
    { name: "Masa", category: "Mobilya, Ofis", image_url: "a.jpg" },
    { name: "Sandalye", category: "Mobilya, Mobilya", image_url: null },
    { name: "Kalem", category: null, image_url: null },
  ]

  it("ürün sayılarını sayar, aynı üründe tekrarlanan kategoriyi bir kez sayar", () => {
    const list = buildCategoryList(products, [])
    expect(list.find((c) => c.name === "Mobilya")?.productCount).toBe(2)
    expect(list.find((c) => c.name === "Ofis")?.productCount).toBe(1)
  })

  it("kategorisiz ürünleri başa ayrı grup olarak koyar", () => {
    const list = buildCategoryList(products, [])
    expect(list[0]).toMatchObject({ id: UNCATEGORIZED_ID, productCount: 1 })
  })

  it("ürünü olmayan ama kaydı olan kategoriyi de listeler (yeni oluşturulan)", () => {
    const list = buildCategoryList([], [{ category_name: "Aksesuar", color: "#000000", cover_image: null }])
    expect(list).toEqual([expect.objectContaining({ name: "Aksesuar", productCount: 0, color: "#000000" })])
  })

  it("Türkçe harfli adlar farklı kimlik alır", () => {
    const list = buildCategoryList([{ name: "x", category: "Çay, Şay", image_url: null }], [])
    const ids = list.map((c) => c.id)
    expect(new Set(ids).size).toBe(2)
  })
})
