import { renderHook, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { useBuilderSelectedProducts } from "@/lib/hooks/use-builder-selected-products"
import { getProductsByIds, type Product } from "@/lib/actions/products"

vi.mock("@/lib/actions/products", () => ({
  getProductsByIds: vi.fn(),
}))

function makeProduct(id: string): Product {
  return {
    id,
    user_id: "u1",
    sku: `SKU-${id}`,
    name: `Urun ${id}`,
    description: null,
    price: 100,
    stock: 1,
    category: null,
    image_url: null,
    images: [],
    product_url: null,
    custom_attributes: [],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    order: 1,
  }
}

describe("useBuilderSelectedProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("missing selected urunleri chunk halinde yukler", async () => {
    vi.mocked(getProductsByIds).mockImplementation(async (ids: string[]) => ids.map((id) => makeProduct(id)))

    const selectedProductIds = Array.from({ length: 450 }, (_, i) => `p-${i + 1}`)
    const { result } = renderHook(() => useBuilderSelectedProducts({
      initialProducts: [],
      selectedProductIds,
    }))

    await waitFor(() => {
      expect(result.current.loadedProductsCount).toBe(450)
    })

    expect(getProductsByIds).toHaveBeenCalledTimes(3)
    expect(vi.mocked(getProductsByIds).mock.calls[0]?.[0]).toHaveLength(200)
    expect(vi.mocked(getProductsByIds).mock.calls[1]?.[0]).toHaveLength(200)
    expect(vi.mocked(getProductsByIds).mock.calls[2]?.[0]).toHaveLength(50)
  })

  it("invalid ve duplicate idleri filtreler", async () => {
    vi.mocked(getProductsByIds).mockResolvedValue([makeProduct("p-1")])

    const longId = "x".repeat(129)
    const { result } = renderHook(() => useBuilderSelectedProducts({
      initialProducts: [],
      selectedProductIds: ["p-1", "p-1", "", "   ", longId],
    }))

    await waitFor(() => {
      expect(result.current.loadedProductsCount).toBe(1)
    })

    expect(getProductsByIds).toHaveBeenCalledTimes(1)
    expect(vi.mocked(getProductsByIds).mock.calls[0]?.[0]).toEqual(["p-1"])
  })

  it("fetch hatasinda ayni idler sonraki renderda tekrar denenebilir", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    vi.mocked(getProductsByIds)
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce([makeProduct("p-2")])

    const { result, rerender } = renderHook(
      ({ selectedProductIds }) => useBuilderSelectedProducts({ initialProducts: [], selectedProductIds }),
      { initialProps: { selectedProductIds: ["p-2"] } }
    )

    await waitFor(() => {
      expect(getProductsByIds).toHaveBeenCalledTimes(1)
    })
    expect(result.current.loadedProductsCount).toBe(0)

    rerender({ selectedProductIds: ["p-2"] })

    await waitFor(() => {
      expect(result.current.loadedProductsCount).toBe(1)
    })
    expect(getProductsByIds).toHaveBeenCalledTimes(2)

    consoleErrorSpy.mockRestore()
  })
})
