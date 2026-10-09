import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { buildInitialCatalogState } from "@/components/builder/builder-utils"
import { AppearanceSection, TemplateSection } from "@/components/builder/editor/design-sections"
import { DesignToolsProvider } from "@/components/builder/editor/design-sections/design-context"

vi.mock("@/lib/contexts/i18n-provider", () => ({
  useTranslation: () => ({ t: (key: string) => key, language: "tr" }),
}))

vi.mock("@/lib/hooks/use-editor-upload", () => ({
  useEditorUpload: () => ({
    logoInputRef: { current: null },
    bgInputRef: { current: null },
    coverInputRef: { current: null },
    handleUploadClick: vi.fn(),
    handleFileUpload: vi.fn(),
  }),
}))

vi.mock("@/components/builder/preview/template-preview-card", () => ({
  TemplatePreviewCard: ({ templateName, onSelect }: { templateName: string; onSelect: () => void }) => (
    <button type="button" onClick={onSelect}>{templateName}</button>
  ),
}))

const builder = vi.hoisted(() => ({ value: null as unknown }))
vi.mock("@/components/builder/builder-context", () => ({ useBuilder: () => builder.value }))

function makeState(overrides: Record<string, unknown> = {}) {
  const data = { ...buildInitialCatalogState(null), ...overrides }
  const setters = Object.fromEntries(
    Object.keys(data).map((key) => [`set${key.charAt(0).toUpperCase()}${key.slice(1)}`, vi.fn()]),
  ) as Record<string, ReturnType<typeof vi.fn>>
  return { ...data, ...setters, setShowUpgradeModal: vi.fn(), productMap: new Map() } as unknown as typeof data & Record<string, ReturnType<typeof vi.fn>>
}

function renderSections(state: ReturnType<typeof makeState>, userPlan = "pro") {
  builder.value = { state, userPlan }
  return render(
    <DesignToolsProvider>
      <TemplateSection />
      <AppearanceSection />
    </DesignToolsProvider>,
  )
}

describe("tasarım bölümleri builder state'inden beslenir", () => {
  beforeEach(() => vi.clearAllMocks())

  it("anahtarlar state değerini gösterir ve değişikliği ilgili setter'a iletir", () => {
    const state = makeState({ showPrices: true, showSku: false })
    renderSections(state)

    const prices = screen.getByRole("switch", { name: "builder.showPrices" })
    expect(prices).toHaveAttribute("aria-checked", "true")
    expect(screen.getByRole("switch", { name: "builder.showSku" })).toHaveAttribute("aria-checked", "false")

    fireEvent.click(prices)
    expect(state.setShowPrices).toHaveBeenCalledWith(false)
  })

  it("şablon seçimi layout setter'ını çağırır; ücretsiz planda premium şablon yükseltme penceresini açar", () => {
    const state = makeState({ layout: "modern-grid" })
    const { unmount } = renderSections(state, "pro")
    fireEvent.click(screen.getByRole("button", { name: "Lüks Koleksiyon" }))
    expect(state.setLayout).toHaveBeenCalledWith("luxury")
    unmount()

    const freeState = makeState({ layout: "modern-grid" })
    renderSections(freeState, "free")
    fireEvent.click(screen.getByRole("button", { name: "Lüks Koleksiyon" }))
    expect(freeState.setLayout).not.toHaveBeenCalled()
    expect(freeState.setShowUpgradeModal).toHaveBeenCalledWith(true)
  })

  it("bölüm başlığı bölümü açıp kapatır", () => {
    renderSections(makeState())
    expect(screen.getByRole("switch", { name: "builder.showPrices" })).toBeInTheDocument()
    const header = screen.getByRole("button", { name: /builder.designSettings/ })
    expect(header).toHaveAttribute("aria-expanded", "true")
    fireEvent.click(header)
    expect(header).toHaveAttribute("aria-expanded", "false")
    // Kapalı bölümdeki kontroller erişilebilirlik ağacından çıkar
    expect(screen.queryByRole("switch", { name: "builder.showPrices" })).not.toBeInTheDocument()
  })
})
