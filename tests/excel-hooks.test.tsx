import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useSpreadsheet } from "@/components/excel/hooks/use-spreadsheet"
import { useExcelCrud } from "@/components/excel/hooks/use-excel-crud"
import type { Product } from "@/lib/actions/products"
import { bulkImportProducts, bulkUpdateFields, deleteProducts } from "@/lib/actions/products"
import { toast } from "sonner"

vi.mock("@/lib/actions/products", () => ({
  bulkImportProducts: vi.fn(),
  bulkUpdateFields: vi.fn(),
  deleteProducts: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    user_id: "u1",
    sku: "SKU-1",
    name: "Eski Ad",
    description: null,
    price: 100,
    stock: 5,
    category: "Elektronik",
    image_url: null,
    images: [],
    product_url: null,
    custom_attributes: [{ name: "Renk", value: "Mavi" }],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    order: 1,
    ...overrides,
  }
}

describe("excel hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("useSpreadsheet: dirty state, validation ve canSave davranisini dogru hesaplar", () => {
    const { result } = renderHook(() => useSpreadsheet([makeProduct()]))

    expect(result.current.isDirty).toBe(false)
    expect(result.current.canSave).toBe(false)

    act(() => {
      result.current.setCellValue("p1", "price", -10)
    })

    expect(result.current.isDirty).toBe(true)
    expect(result.current.hasErrors).toBe(true)
    expect(result.current.getCellError("p1", "price")).toBe("priceInvalid")
    expect(result.current.canSave).toBe(false)

    act(() => {
      result.current.setCellValue("p1", "price", 150)
    })

    expect(result.current.getCellError("p1", "price")).toBeNull()
    expect(result.current.canSave).toBe(true)

    act(() => {
      result.current.addEmptyRow()
    })

    expect(result.current.canSave).toBe(false)

    const tempId = result.current.newRows[0]?.tempId
    expect(tempId).toBeTruthy()

    act(() => {
      result.current.updateNewRow(tempId!, "name", "Yeni Urun")
    })

    expect(result.current.canSave).toBe(true)
  })

  it("useSpreadsheet: ayni degere donunce hucre dirty olmaktan cikar", () => {
    const { result } = renderHook(() => useSpreadsheet([makeProduct({ name: "Telefon" })]))

    act(() => {
      result.current.setCellValue("p1", "name", "Yeni Telefon")
    })
    expect(result.current.isCellDirty("p1", "name")).toBe(true)

    act(() => {
      result.current.setCellValue("p1", "name", "Telefon")
    })

    expect(result.current.isCellDirty("p1", "name")).toBe(false)
    expect(result.current.editedCells.size).toBe(0)
  })

  it("useSpreadsheet: sayfa degisse de cache edilen urune erisir", () => {
    const product = makeProduct({ id: "p-cache", name: "Cache Product" })
    const { result, rerender } = renderHook(({ products }) => useSpreadsheet(products), {
      initialProps: { products: [product] },
    })

    expect(result.current.getCachedProduct("p-cache")?.name).toBe("Cache Product")

    rerender({ products: [] })

    expect(result.current.productMap.get("p-cache")).toBeUndefined()
    expect(result.current.getCachedProduct("p-cache")?.name).toBe("Cache Product")
  })

  it("useExcelCrud: saveAll tum adimlari cagirir ve basari mesaji gosterir", async () => {
    vi.mocked(bulkUpdateFields).mockResolvedValue({ success: true, updatedCount: 1, failedCount: 0 })
    vi.mocked(bulkImportProducts).mockResolvedValue([makeProduct({ id: "new-1" })])
    vi.mocked(deleteProducts).mockResolvedValue({ success: true })

    const editedCells = new Map([
      ["p1", new Map([["price", "250"], ["attr:Renk", "Kirmizi"]])],
    ])

    const newRows = [{
      tempId: "tmp-1",
      name: "Yeni Urun",
      sku: "SKU-NEW",
      price: 500,
      stock: 2,
      category: "Mobilya",
      description: "Aciklama",
      product_url: "https://example.com/yeni",
      custom_attributes: [{ name: "Boyut", value: "XL" }],
    }]

    const deletedIds = new Set(["p2"])
    const discardAll = vi.fn()
    const refreshData = vi.fn().mockResolvedValue(undefined)
    const t = vi.fn((key: string, params?: Record<string, unknown>) => `${key}:${JSON.stringify(params || {})}`)

    const product = makeProduct({ id: "p1", custom_attributes: [{ name: "Renk", value: "Mavi" }] })

    const { result } = renderHook(() => useExcelCrud({
      editedCells,
      newRows,
      deletedIds,
      canSave: true,
      discardAll,
      refreshData,
      t,
      getCachedProduct: (productId: string) => (productId === "p1" ? product : undefined),
    }))

    await act(async () => {
      const ok = await result.current.saveAll()
      expect(ok).toBe(true)
    })

    expect(bulkUpdateFields).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "p1",
        price: 250,
        custom_attributes: [{ name: "Renk", value: "Kirmizi" }],
      }),
    ])
    expect(bulkImportProducts).toHaveBeenCalledTimes(1)
    expect(bulkImportProducts).toHaveBeenCalledWith([
      expect.objectContaining({
        name: "Yeni Urun",
        sku: "SKU-NEW",
        category: "Mobilya",
      }),
    ])
    expect(deleteProducts).toHaveBeenCalledWith(["p2"])
    expect(discardAll).toHaveBeenCalledTimes(1)
    expect(refreshData).toHaveBeenCalledTimes(1)
    expect(toast.success).toHaveBeenCalledTimes(1)
  })

  it("useExcelCrud: canSave false ise hicbir islem yapmaz", async () => {
    const { result } = renderHook(() => useExcelCrud({
      editedCells: new Map(),
      newRows: [],
      deletedIds: new Set(),
      canSave: false,
      discardAll: vi.fn(),
      refreshData: vi.fn().mockResolvedValue(undefined),
      t: (key: string) => key,
      getCachedProduct: () => undefined,
    }))

    await act(async () => {
      const ok = await result.current.saveAll()
      expect(ok).toBe(false)
    })

    expect(bulkUpdateFields).not.toHaveBeenCalled()
    expect(bulkImportProducts).not.toHaveBeenCalled()
    expect(deleteProducts).not.toHaveBeenCalled()
  })

  it("useExcelCrud: hata durumunda false doner ve error toast gosterir", async () => {
    vi.mocked(bulkUpdateFields).mockRejectedValue(new Error("boom"))

    const editedCells = new Map([["p1", new Map([["name", "Yeni"]])]])
    const product = makeProduct({ id: "p1" })

    const { result } = renderHook(() => useExcelCrud({
      editedCells,
      newRows: [],
      deletedIds: new Set(),
      canSave: true,
      discardAll: vi.fn(),
      refreshData: vi.fn().mockResolvedValue(undefined),
      t: (key: string) => key,
      getCachedProduct: () => product,
    }))

    await act(async () => {
      const ok = await result.current.saveAll()
      expect(ok).toBe(false)
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("common.error")
    })
  })
})
