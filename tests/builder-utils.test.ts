import { describe, expect, it } from "vitest"

import {
  arrayFingerprint,
  buildCatalogPayload,
  buildInitialCatalogState,
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
})
