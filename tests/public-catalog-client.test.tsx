import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { buildSpreads } from "@/app/catalog/[slug]/_components/book-viewer"
import { PublicCatalogClient } from "@/app/catalog/[slug]/public-catalog-client"
import type { Catalog } from "@/lib/actions/catalogs"
import type { Product } from "@/lib/actions/products"
import type { TemplateProps } from "@/components/catalogs/templates/types"
import { getItemsPerPage } from "@/lib/constants"
import { normalizeLayout } from "@/lib/catalog-layouts"

vi.mock("@/lib/contexts/i18n-provider", () => ({
  useTranslation: () => ({ t: (key: string) => key, language: "tr" }),
}))

vi.mock("@/lib/contexts/lightbox-context", () => ({
  LightboxProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  CatalogPreloader: () => null,
}))
vi.mock("@/components/ui/image-lightbox", () => ({ ImageLightbox: () => null }))
vi.mock("@/components/catalogs/share-modal", () => ({ ShareModal: () => null }))
vi.mock("@/components/ui/pdf-progress-modal", () => ({ PdfProgressModal: () => null, PDF_PROGRESS_INITIAL_STATE: { phase: "idle" } }))
vi.mock("next/link", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }))

// Şablonları hafif yer tutucularla değiştir: hangi şablonun hangi ayarlarla çizildiğini doğrularız
function stubTemplate(name: string) {
  return function Stub(props: TemplateProps) {
    return (
      <div
        data-testid="template"
        data-template={name}
        data-products={props.products.length}
        data-show-attributes={String(props.showAttributes)}
        data-page={`${props.pageNumber}/${props.totalPages}`}
      />
    )
  }
}
vi.mock("@/components/catalogs/templates/compact-list", () => ({ CompactListTemplate: stubTemplate("compact-list") }))
vi.mock("@/components/catalogs/templates/modern-grid", () => ({ ModernGridTemplate: stubTemplate("modern-grid") }))
vi.mock("@/components/catalogs/templates/elegant-cards", () => ({ ElegantCardsTemplate: stubTemplate("elegant-cards") }))
vi.mock("@/components/catalogs/cover-page", () => ({ CoverPage: () => <div data-testid="cover" /> }))
vi.mock("@/components/catalogs/category-divider", () => ({
  CategoryDivider: ({ categoryName }: { categoryName: string }) => <div data-testid="divider">{categoryName}</div>,
}))

beforeAll(() => {
  // Node 26'nın global localStorage'ı jsdom'unkini gölgeliyor; bellek içi taklit (görünüm tercihi için)
  const store = new Map<string, string>()
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v) },
    removeItem: (k: string) => { store.delete(k) },
    clear: () => store.clear(),
  })
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
  global.IntersectionObserver = class {
    observe() {}
    disconnect() {}
    unobserve() {}
  } as unknown as typeof IntersectionObserver
})

function product(i: number, category: string | null = "Genel"): Product {
  return {
    id: `p${i}`, user_id: "u", sku: `SKU-${i}`, name: `Urun ${i}`, description: null, price: 10, stock: 1,
    category, image_url: null, images: [], product_url: null, custom_attributes: [], order: i,
    created_at: "", updated_at: "",
  }
}

function catalog(overrides: Partial<Catalog> = {}): Catalog {
  return {
    id: "c1", user_id: "u", template_id: null, name: "Katalog", description: null, layout: "modern-grid",
    primary_color: "#111111", show_prices: true, show_descriptions: true, show_attributes: null as unknown as boolean,
    show_sku: true, show_urls: false, is_published: true, share_slug: "katalog", product_ids: [],
    columns_per_row: 3, background_color: "#ffffff", background_image: null, background_gradient: null,
    logo_url: null, logo_position: null, logo_size: "medium", title_position: "left",
    created_at: "", updated_at: "", ...overrides,
  }
}

const VIEW_MODE_KEY = "fogcatalog:public-view-mode"

describe("PublicCatalogClient", () => {
  // Sayfa modeli testleri tüm sayfaların DOM'da olduğu liste görünümünde çalışır
  beforeEach(() => window.localStorage.setItem(VIEW_MODE_KEY, "list"))

  it("resolves legacy layout aliases to the same template and page size as the builder", () => {
    const products = Array.from({ length: 12 }, (_, i) => product(i))
    render(<PublicCatalogClient catalog={catalog({ layout: "list" })} products={products} />)

    const pages = screen.getAllByTestId("template")
    expect(pages[0]).toHaveAttribute("data-template", "compact-list")
    expect(pages).toHaveLength(Math.ceil(12 / getItemsPerPage("compact-list")))
  })

  it("uses the builder defaults for unset display options", () => {
    render(<PublicCatalogClient catalog={catalog()} products={[product(1)]} />)

    expect(screen.getByTestId("template")).toHaveAttribute("data-show-attributes", "false")
  })

  it("numbers pages like the builder preview (cover and dividers included)", () => {
    render(
      <PublicCatalogClient
        catalog={catalog({ enable_cover_page: true, enable_category_dividers: true })}
        products={[product(1, "A"), product(2, "B")]}
      />,
    )

    // kapak, A ayracı, A ürünleri, B ayracı, B ürünleri = 5 sayfa (ilk 3'ü hemen çizilir, kalanı tembel)
    expect(screen.getByTestId("cover")).toBeInTheDocument()
    expect(screen.getByTestId("divider")).toHaveTextContent("A")
    expect(screen.getByTestId("template")).toHaveAttribute("data-page", "3/5")
  })

  it("renders every page inside the light catalog scope", () => {
    const { container } = render(<PublicCatalogClient catalog={catalog()} products={[product(1)]} />)

    expect(container.querySelector('[data-pdf-page="true"]')).toHaveClass("catalog-light")
  })

  it("shows a no-results state with a reset action", async () => {
    const user = userEvent.setup()
    render(<PublicCatalogClient catalog={catalog()} products={[product(1)]} />)

    await user.type(screen.getByRole("searchbox"), "olmayan")
    expect(screen.getByText("catalogs.public.noResults")).toBeInTheDocument()
    expect(screen.queryByTestId("template")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "catalogs.public.resetFilters" }))
    expect(screen.getByTestId("template")).toBeInTheDocument()
  })
})

describe("buildSpreads", () => {
  it("keeps the cover alone on the right like a closed book", () => {
    expect(buildSpreads(5, true)).toEqual([[null, 0], [1, 2], [3, 4]])
    expect(buildSpreads(4, true)).toEqual([[null, 0], [1, 2], [3, null]])
  })

  it("opens to two pages when there is no cover", () => {
    expect(buildSpreads(3, false)).toEqual([[0, 1], [2, null]])
    expect(buildSpreads(0, false)).toEqual([])
  })
})

describe("PublicCatalogClient book view", () => {
  beforeEach(() => window.localStorage.removeItem(VIEW_MODE_KEY))

  const bookCatalog = () => (
    <PublicCatalogClient
      catalog={catalog({ enable_cover_page: true, enable_category_dividers: true })}
      products={[product(1, "A"), product(2, "B")]}
    />
  )

  it("starts closed on the cover and turns pages with buttons and arrow keys", async () => {
    const user = userEvent.setup()
    render(bookCatalog())

    // kapak, A ayracı, A ürünleri, B ayracı, B ürünleri → [kapak] [A ayracı | A] [B ayracı | B]
    expect(screen.getByTestId("cover")).toBeInTheDocument()
    expect(screen.queryByTestId("divider")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "catalogs.public.previousPage" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "catalogs.public.nextPage" }))
    expect(screen.queryByTestId("cover")).not.toBeInTheDocument()
    expect(screen.getByTestId("divider")).toHaveTextContent("A")
    expect(screen.getByTestId("template")).toHaveAttribute("data-page", "3/5")

    await user.keyboard("{ArrowRight}")
    expect(screen.getByTestId("divider")).toHaveTextContent("B")
    expect(screen.getByTestId("template")).toHaveAttribute("data-page", "5/5")
    expect(screen.getByRole("button", { name: "catalogs.public.nextPage" })).toBeDisabled()

    await user.keyboard("{ArrowLeft}")
    expect(screen.getByTestId("divider")).toHaveTextContent("A")
  })

  it("does not mark book pages for PDF capture (export renders its own copies)", () => {
    const { container } = render(bookCatalog())

    expect(container.querySelector('[data-pdf-page="true"]')).toBeNull()
    expect(container.querySelector(".catalog-light")).not.toBeNull()
  })
})

describe("normalizeLayout", () => {
  it.each([
    ["list", "compact-list"],
    ["elegant-showcase", "elegant-cards"],
    ["classic-list", "classic-catalog"],
    [null, "modern-grid"],
    ["magazine", "magazine"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeLayout(input)).toBe(expected)
  })

  it("gives aliases the page size of their real template", () => {
    expect(getItemsPerPage("elegant-showcase")).toBe(getItemsPerPage("elegant-cards"))
  })
})
