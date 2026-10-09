import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SubscriptionTab } from "@/components/settings/tabs/subscription-tab"
import { cancelSubscription } from "@/lib/actions/notifications"
import { I18nProvider, useTranslation } from "@/lib/contexts/i18n-provider"
import type { User } from "@/lib/contexts/user-context"

const refreshUser = vi.fn()

vi.mock("@/lib/contexts/user-context", () => ({
  useUser: () => ({ refreshUser }),
}))

vi.mock("@/lib/actions/notifications", () => ({
  cancelSubscription: vi.fn(),
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// I18nProvider dil tercihini localStorage'dan okur
const storage = new Map<string, string>()
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  },
})

const baseUser: User = {
  id: "u1",
  name: "Test",
  email: "t@example.com",
  company: "",
  plan: "plus",
  exportsUsed: 0,
  maxExports: 50,
  productsCount: 0,
  maxProducts: 1000,
  catalogsCount: 0,
  subscriptionStatus: "active",
  subscriptionEnd: "2026-12-31T21:00:00.000Z",
}

function Harness({ user }: { user: User }) {
  const { t } = useTranslation()
  return <SubscriptionTab onUpgradeClick={vi.fn()} t={t as (key: string, params?: Record<string, unknown>) => string} user={user} />
}

function renderTab(user: User) {
  return render(
    <I18nProvider>
      <Harness user={user} />
    </I18nProvider>,
  )
}

describe("Ayarlar > Abonelik iptali", () => {
  beforeEach(() => {
    vi.mocked(cancelSubscription).mockReset()
    refreshUser.mockReset()
  })

  it("ücretli planda onay sonrası aboneliği iptal eder ve kullanıcıyı yeniler", async () => {
    vi.mocked(cancelSubscription).mockResolvedValue({ success: true })
    renderTab(baseUser)

    fireEvent.click(screen.getByRole("button", { name: "Aboneliği iptal et" }))
    expect(await screen.findByText(/tarihine kadar kullanılmaya devam eder/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Evet, iptal et" }))

    await waitFor(() => expect(cancelSubscription).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(refreshUser).toHaveBeenCalled())
  })

  it("iptal edilmiş abonelikte buton yerine bitiş tarihini gösterir", () => {
    renderTab({ ...baseUser, subscriptionStatus: "cancelled" })

    expect(screen.queryByRole("button", { name: "Aboneliği iptal et" })).not.toBeInTheDocument()
    expect(screen.getByText(/İptal edildi/)).toBeInTheDocument()
  })

  it("ücretsiz planda iptal seçeneği yok", () => {
    renderTab({ ...baseUser, plan: "free", subscriptionStatus: null, subscriptionEnd: null })

    expect(screen.queryByRole("button", { name: "Aboneliği iptal et" })).not.toBeInTheDocument()
  })
})
