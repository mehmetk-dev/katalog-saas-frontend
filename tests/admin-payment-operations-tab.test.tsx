import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PaymentOperationsTab } from "@/components/admin/admin-dashboard/payment-operations-tab"
import { I18nProvider } from "@/lib/contexts/i18n-provider"

const actions = vi.hoisted(() => ({
  getAdminPaymentOperationsData: vi.fn(),
  acknowledgeAdminPaymentAlert: vi.fn(),
  reconcileAdminPaymentAttempt: vi.fn(),
  createAdminPaymentReversal: vi.fn(),
}))
vi.mock("@/lib/actions/admin", () => actions)

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }))
vi.mock("sonner", () => ({ toast }))

const order = {
  id: "11111111-2222-3333-4444-555555555555",
  user_id: "u1",
  plan_id: "pro",
  billing_cycle: "yearly",
  status: "paid",
  total_amount: "100.00",
  currency: "TRY",
  refunded_amount_minor: 2500,
  paid_at: null,
  reversed_at: null,
  created_at: "2026-10-01T10:00:00Z",
}
const alert = {
  id: "a1",
  order_id: null,
  operation_id: null,
  severity: "critical",
  code: "PAYMENT_QUEUE_UNAVAILABLE",
  title: "Kuyruk yok",
  message: "Worker kontrol edilmeli",
  status: "open",
  occurrence_count: 3,
  last_seen_at: "2026-10-01T10:00:00Z",
}
const operation = {
  id: "o1",
  order_id: order.id,
  attempt_id: "att1",
  operation_type: "reconciliation",
  status: "manual_review",
  requested_amount_minor: 10000,
  reason: null,
  bank_response_code: null,
  retry_count: 0,
  next_retry_at: null,
  last_error_code: null,
  created_at: "2026-10-01T10:00:00Z",
}

// I18nProvider dil tercihini localStorage'dan okur
const store = new Map<string, string>()
vi.stubGlobal("localStorage", {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
})

function renderTab() {
  return render(
    <I18nProvider>
      <PaymentOperationsTab />
    </I18nProvider>,
  )
}

describe("PaymentOperationsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    actions.getAdminPaymentOperationsData.mockResolvedValue({ orders: [order], operations: [operation], alerts: [alert] })
  })

  it("durum, tür ve dönem kodlarını çevirerek gösterir", async () => {
    renderTab()
    expect(await screen.findByText("Ödendi")).toBeInTheDocument()
    expect(screen.getByText("pro / Yıllık")).toBeInTheDocument()
    expect(screen.getByText("Mutabakat")).toBeInTheDocument()
    expect(screen.getAllByText("Manuel inceleme").length).toBeGreaterThan(1)
    expect(screen.getByText(/3 kez/)).toBeInTheDocument()
  })

  it("başarısız işlem sayfayı düşürmez, hata bildirimi gösterir", async () => {
    actions.acknowledgeAdminPaymentAlert.mockRejectedValue(new Error("boom"))
    renderTab()
    await userEvent.click(await screen.findByRole("button", { name: "İncelendi" }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("İşlem yapılamadı; durumu yenileyip tekrar deneyin."))
    expect(actions.getAdminPaymentOperationsData).toHaveBeenCalledTimes(2)
  })

  it("kalan tutardan fazla iadeyi göndermeden reddeder", async () => {
    renderTab()
    await screen.findByText("Ödendi")
    const [amountInput] = screen.getAllByRole("textbox")
    await userEvent.type(amountInput, "80")
    await userEvent.type(screen.getByPlaceholderText("İade gerekçesi"), "müşteri talebi")
    await userEvent.click(screen.getByRole("button", { name: "İptal / İade" }))
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("kalan tutarı"))
    expect(actions.createAdminPaymentReversal).not.toHaveBeenCalled()
  })

  it("işlem ve sipariş yoksa boş durum gösterir", async () => {
    actions.getAdminPaymentOperationsData.mockResolvedValue({ orders: [], operations: [], alerts: [] })
    renderTab()
    expect(await screen.findByText("İade edilebilecek ödenmiş sipariş yok.")).toBeInTheDocument()
    expect(screen.getByText("Henüz işlem yok.")).toBeInTheDocument()
    expect(screen.getByText("Açık alarm yok.")).toBeInTheDocument()
  })
})
