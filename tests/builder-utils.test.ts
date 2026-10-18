import { describe, expect, it } from "vitest"

import {
  arrayFingerprint,
  buildCatalogPatch,
  buildCatalogPayload,
  buildInitialCatalogState,
  toDraft,
  type BuilderCatalogData,
} from "@/components/builder/builder-utils"
import { TEMPLATES, getItemsPerPage } from "@/lib/constants"
import { catalogCreateSchema, catalogUpdateSchema } from "@/lib/validations"

describe("builder-utils", () => {
  it("detects adjacent product reorder in large arrays", () => {
    const original = Array.from({ length: 100 }, (_, index) => `p-${index}`)
    const reordered = [...original]

    ;[reordered[10], reordered[11]] = [reordered[11], reordered[10]]

    expect(arrayFingerprint(reordered)).not.toBe(arrayFingerprint(original))
  })

  it("preserves every builder field while validating a new catalog", () => {
    const builderData: BuilderCatalogData = {
      catalogName: "Yaz Koleksiyonu",
      catalogDescription: "Yeni sezon ürünleri",
      selectedProductIds: ["11111111-1111-4111-8111-111111111111"],
      layout: "industrial",
      primaryColor: "#123456",
      showPrices: false,
      showDescriptions: true,
      showAttributes: true,
      showSku: false,
      showUrls: true,
      columnsPerRow: 1,
      backgroundColor: "#ffffff",
      backgroundImage: "https://example.com/background.jpg",
      backgroundImageFit: "cover",
      backgroundGradient: "linear-gradient(#fff, #eee)",
      logoUrl: "https://example.com/logo.png",
      logoPosition: "header-center",
      logoSize: "large",
      titlePosition: "center",
      productImageFit: "contain",
      headerTextColor: "#111111",
      enableCoverPage: true,
      coverImageUrl: "https://example.com/cover.jpg",
      coverDescription: "Kapak metni",
      enableCategoryDividers: true,
      categoryOrder: ["Mobilya", "Aksesuar"],
      coverTheme: "modern",
      isPublished: false,
      showInSearch: true,
    }

    const payload = buildCatalogPayload(builderData)

    expect(catalogCreateSchema.parse(payload)).toEqual(payload)
    expect(catalogUpdateSchema.parse(payload)).toEqual(payload)
  })

  it.each([
    ["catalog-pro", 4],
    ["elegant-cards", 4],
    ["industrial", 6],
  ])("matches the real %s renderer capacity", (layout, expectedCapacity) => {
    expect(getItemsPerPage(layout)).toBe(expectedCapacity)
  })

  it("lists every renderer exposed by the builder", () => {
    const templateIds = new Set(TEMPLATES.map((template) => template.id))

    expect(templateIds.has("clean-white")).toBe(true)
    expect(templateIds.has("retail")).toBe(true)
    expect(templateIds.has("tech-modern")).toBe(true)
  })

  it("uses a real registered template for a new catalog", () => {
    expect(buildInitialCatalogState(null).layout).toBe("modern-grid")
  })

  it("builds a patch with only the fields that differ from the saved draft", () => {
    const saved = buildInitialCatalogState(null)
    const ids = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"]
    const savedWithProducts = toDraft({ ...saved, selectedProductIds: ids })

    expect(buildCatalogPatch({ ...savedWithProducts, isPublished: false }, savedWithProducts)).toEqual({})

    const patch = buildCatalogPatch(
      { ...savedWithProducts, primaryColor: "#ff0000", selectedProductIds: [...ids], isPublished: false },
      savedWithProducts,
    )
    // Aynı ürün listesinin yeni bir kopyası değişiklik sayılmaz
    expect(patch).toEqual({ primary_color: "#ff0000" })

    const reordered = buildCatalogPatch(
      { ...savedWithProducts, selectedProductIds: [ids[1], ids[0]], isPublished: false },
      savedWithProducts,
    )
    expect(reordered).toEqual({ product_ids: [ids[1], ids[0]] })
  })
})
