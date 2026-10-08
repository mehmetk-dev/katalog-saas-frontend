import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"

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

describe("PublicCatalogClient", () => {
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
