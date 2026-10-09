import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ProductModal } from "@/components/products/modals/product-modal"
import { createProduct, updateProduct, type Product } from "@/lib/actions/products"

vi.mock("@/lib/contexts/i18n-provider", () => ({
  useTranslation: () => ({ t: (key: string) => key, language: "tr" }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}))

vi.mock("@/lib/actions/products", () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
}))

vi.mock("@/lib/storage", () => ({ storage: { upload: vi.fn() } }))

global.URL.createObjectURL = vi.fn(() => "blob:test")
global.URL.revokeObjectURL = vi.fn()
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

const baseProps = {
  open: true,
  onOpenChange: vi.fn(),
  product: null,
  onSaved: vi.fn(),
  allCategories: [],
  userPlan: "plus" as const,
  maxProducts: 50,
  currentProductCount: 10,
}

const existing = {
  id: "p1",
  user_id: "u1",
  name: "Koltuk",
  sku: null,
  description: null,
  price: 1250.5,
  stock: 3,
  category: null,
  image_url: null,
  images: [],
  product_url: null,
  custom_attributes: [],
  order: 0,
  created_at: "",
  updated_at: "",
} as unknown as Product

function submittedField(mock: ReturnType<typeof vi.fn>, field: string, callIndex = 0) {
  const formData = mock.mock.calls[callIndex].at(-1) as FormData
  return formData.get(field)
}

describe("ProductModal formu", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createProduct).mockImplementation(async () => ({ ...existing, id: "new" }))
    vi.mocked(updateProduct).mockImplementation(async () => existing)
  })

  it("Türkçe biçimli fiyatı doğru kaydeder (1.250,50 → 1250.5)", async () => {
    const user = userEvent.setup()
    render(<ProductModal {...baseProps} />)

    await user.type(screen.getByLabelText(/products.name/), "Ahşap masa")
    await user.type(screen.getByLabelText("products.price"), "1.250,50")
    await user.click(screen.getByRole("button", { name: "products.addProduct" }))

    await waitFor(() => expect(createProduct).toHaveBeenCalled())
    expect(submittedField(vi.mocked(createProduct), "price")).toBe("1250.5")
  })

  it("kayıtlı fiyat düzenleme alanında virgülle görünür ve değişmeden kaydedilir", async () => {
    const user = userEvent.setup()
    render(<ProductModal {...baseProps} product={existing} />)

    expect(screen.getByLabelText("products.price")).toHaveValue("1250,5")
    await user.click(screen.getByRole("button", { name: "common.save" }))

    await waitFor(() => expect(updateProduct).toHaveBeenCalled())
    expect(submittedField(vi.mocked(updateProduct), "price")).toBe("1250.5")
  })

  it("tek karakterlik adı sunucuya göndermeden alanda hata gösterir", async () => {
    const user = userEvent.setup()
    render(<ProductModal {...baseProps} />)

    await user.type(screen.getByLabelText(/products.name/), "A")
    await user.click(screen.getByRole("button", { name: "products.addProduct" }))

    expect(await screen.findByText("productForm.nameTooShort")).toBeInTheDocument()
    expect(createProduct).not.toHaveBeenCalled()
  })

  it("protokolsüz ürün linkine https:// ekler", async () => {
    const user = userEvent.setup()
    render(<ProductModal {...baseProps} />)

    await user.type(screen.getByLabelText(/products.name/), "Ahşap masa")
    await user.type(screen.getByLabelText(/products.productUrl/), "siteniz.com/masa")
    await user.click(screen.getByRole("button", { name: "products.addProduct" }))

    await waitFor(() => expect(createProduct).toHaveBeenCalled())
    expect(submittedField(vi.mocked(createProduct), "product_url")).toBe("https://siteniz.com/masa")
  })

  it("limit doluysa kaydetmeden durur", async () => {
    const user = userEvent.setup()
    render(<ProductModal {...baseProps} currentProductCount={50} />)

    await user.type(screen.getByLabelText(/products.name/), "Ahşap masa")
    await user.click(screen.getByRole("button", { name: "products.addProduct" }))

    await waitFor(() => expect(createProduct).not.toHaveBeenCalled())
  })

  it("değişiklik varken İptal önce onay ister, yoksa doğrudan kapatır", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const { unmount } = render(<ProductModal {...baseProps} product={existing} onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole("button", { name: "common.cancel" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    unmount()

    onOpenChange.mockClear()
    render(<ProductModal {...baseProps} product={existing} onOpenChange={onOpenChange} />)
    await user.type(screen.getByLabelText(/products.name/), " Pro")
    await user.click(screen.getByRole("button", { name: "common.cancel" }))

    expect(await screen.findByText("productForm.unsavedTitle")).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "productForm.unsavedDiscard" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
