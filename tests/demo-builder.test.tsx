import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DemoBuilder } from "@/components/demo/demo-builder"

vi.mock("@/lib/contexts/i18n-provider", () => ({
  useTranslation: () => ({ t: (key: string) => key, language: "tr" }),
}))

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), dismiss: vi.fn(), loading: vi.fn() } }))

// Builder'ın gerçek önizlemesi demo'da kullanılıyor; burada aldığı ayarları gösteren basit bir yer tutucu
vi.mock("@/components/builder/preview/catalog-preview", () => ({
  CatalogPreview: (props: { layout: string; showPrices?: boolean; products: unknown[] }) => (
    <div data-testid="preview">{JSON.stringify({ layout: props.layout, showPrices: props.showPrices, count: props.products.length })}</div>
  ),
}))
vi.mock("@/components/builder/preview/template-preview-card", () => ({
  TemplatePreviewCard: ({ templateName, onSelect }: { templateName: string; onSelect: () => void }) => (
    <button type="button" onClick={onSelect}>{templateName}</button>
  ),
}))

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

const preview = () => JSON.parse(screen.getByTestId("preview").textContent || "{}")

describe("demo oluşturucu builder parçalarını kullanır", () => {
  it("şablon ve görünüm ayarları builder bölümlerinden değişir ve önizlemeye yansır", () => {
    render(<DemoBuilder />)
    expect(preview()).toMatchObject({ layout: "modern-grid", showPrices: true })

    fireEvent.click(screen.getByRole("button", { name: /demoPage.next/ }))
    // Builder'ın şablon bölümü: tüm şablonlar (ör. premium Lüks) demoda denenebilir
    fireEvent.click(screen.getByRole("button", { name: "Lüks Koleksiyon" }))
    expect(preview().layout).toBe("luxury")

    fireEvent.click(screen.getByRole("button", { name: /demoPage.next/ }))
    fireEvent.click(screen.getByRole("switch", { name: "builder.showPrices" }))
    expect(preview().showPrices).toBe(false)
  })

  it("sektör değişince önizleme o sektörün ürünlerini gösterir", () => {
    render(<DemoBuilder />)
    const before = preview().count
    fireEvent.click(screen.getByRole("button", { name: /demoPage.industries.food/ }))
    expect(preview().count).toBeGreaterThan(0)
    expect(screen.getByRole("button", { name: /demoPage.industries.food/ })).toHaveAttribute("aria-pressed", "true")
    expect(before).toBeGreaterThan(0)
  })
})
