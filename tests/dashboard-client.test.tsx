import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

import { DashboardClient } from "@/components/dashboard/dashboard-client"
import type { Catalog, DashboardStats } from "@/lib/actions/catalogs"

// Çeviri anahtarı + parametreler döner; metin yerine anahtarla doğrulama yapılır
vi.mock("@/lib/contexts/i18n-provider", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
    language: "tr",
  }),
}))

const mockUseUser = vi.fn()
vi.mock("@/lib/contexts/user-context", () => ({
  useUser: () => mockUseUser(),
}))

const createNewCatalog = vi.fn()
vi.mock("@/lib/hooks/use-create-catalog", () => ({
  useCreateCatalog: () => ({ createNewCatalog, isCreating: false }),
}))

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

vi.mock("@/components/dashboard/onboarding-checklist", () => ({
  OnboardingChecklist: (props: { hasProducts: boolean; hasCatalogs: boolean; hasPublishedCatalog: boolean }) => (
    <div data-testid="onboarding-checklist">{JSON.stringify(props)}</div>
  ),
}))

function catalog(overrides: Partial<Catalog>): Catalog {
  return {
    id: "c1",
    name: "Katalog",
    is_published: false,
    product_ids: [],
    updated_at: "2026-10-01T10:00:00.000Z",
    logo_url: null,
    ...overrides,
  } as Catalog
}

const catalogs = [
  catalog({ id: "old", name: "Eski Katalog", is_published: true, product_ids: ["p1", "p1", "p2"], updated_at: "2026-09-01T10:00:00.000Z" }),
  catalog({ id: "new", name: "Yeni Katalog", updated_at: "2026-10-08T10:00:00.000Z" }),
]

const stats: DashboardStats = {
  totalViews: 150,
  periodViews: 45,
  totalProducts: 12,
  totalCatalogs: 2,
  publishedCatalogs: 1,
  topCatalogs: [],
  prevTotalViews: 30,
  prevUniqueVisitors: 20,
}

function renderDashboard(props: Partial<Parameters<typeof DashboardClient>[0]> = {}) {
  return render(<DashboardClient initialCatalogs={catalogs} totalProductCount={12} initialStats={stats} {...props} />)
}

describe("DashboardClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseUser.mockReturnValue({ user: { id: "u1", name: "Ayşe Yılmaz", plan: "free" }, isLoading: false })
  })

  it("kullanıcının adıyla karşılar", () => {
    renderDashboard()
    expect(screen.getByText(/dashboard\.welcomeUser.*Ayşe/)).toBeInTheDocument()
  })

  it("gerçek sayıları gösterir: ürün limiti plandan, görüntülenme analitikten", () => {
    renderDashboard()
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByText(/dashboard\.home\.productsHint.*"max":50/)).toBeInTheDocument()
    expect(screen.getByText("45")).toBeInTheDocument()
    expect(screen.getByText(/dashboard\.home\.catalogsHint.*"published":1.*"drafts":1/)).toBeInTheDocument()
  })

  it("analitik alınamazsa sayfa yine açılır ve kataloglardan hesaplar", () => {
    renderDashboard({ initialStats: null })
    expect(screen.getByText(/dashboard\.home\.catalogsHint.*"published":1/)).toBeInTheDocument()
    expect(screen.getByText("dashboard.home.seeAnalytics")).toBeInTheDocument()
  })

  it("son düzenlenen katalog önce gelir ve builder'a link verir", () => {
    renderDashboard()
    const links = screen.getAllByRole("link").filter((a) => a.getAttribute("href")?.startsWith("/dashboard/builder"))
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/dashboard/builder?id=new", "/dashboard/builder?id=old"])
    expect(within(links[1]).getByText("dashboard.published")).toBeInTheDocument()
    expect(within(links[0]).getByText("dashboard.draft")).toBeInTheDocument()
  })

  it("ürün sayısını tekrarlı id'lere rağmen doğru gösterir", () => {
    renderDashboard()
    expect(screen.getByText(/dashboard\.home\.productCount.*"count":2/)).toBeInTheDocument()
  })

  it("katalog yoksa boş durum ve oluştur butonu gösterir", () => {
    renderDashboard({ initialCatalogs: [], initialStats: null })
    expect(screen.getByText("dashboard.home.noCatalogsTitle")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "dashboard.home.newCatalog" }))
    expect(createNewCatalog).toHaveBeenCalled()
  })

  it("hızlı işlemler doğru sayfalara gider", () => {
    renderDashboard()
    expect(screen.getByRole("link", { name: /dashboard\.home\.addProduct/ })).toHaveAttribute("href", "/dashboard/products?action=new")
    expect(screen.getByRole("link", { name: /dashboard\.home\.importProducts/ })).toHaveAttribute("href", "/dashboard/products?action=import")
    expect(screen.getByRole("link", { name: /dashboard\.home\.browseTemplates/ })).toHaveAttribute("href", "/dashboard/templates")
  })

  it("onboarding paylaşım adımı ancak yayında katalog varsa tamamlanır", () => {
    renderDashboard({ initialCatalogs: [catalog({ id: "d" })], initialStats: { ...stats, totalCatalogs: 1, publishedCatalogs: 0 } })
    expect(screen.getByTestId("onboarding-checklist")).toHaveTextContent('"hasPublishedCatalog":false')
  })
})
