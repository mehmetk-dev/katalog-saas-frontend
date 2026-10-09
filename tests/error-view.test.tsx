import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ErrorView, isConnectionError } from "@/components/error-view"

vi.mock("@/lib/contexts/i18n-provider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }))

describe("ErrorView", () => {
  it("yalnızca gerçek bağlantı hatalarını 'sunucuya ulaşılamıyor' sayar", () => {
    expect(isConnectionError(new Error("fetch failed"))).toBe(true)
    expect(isConnectionError(new Error("api.error.serviceUnavailable"))).toBe(true)
    // Önceden mesajda "api" geçen her hata bağlantı hatası sayılıyordu
    expect(isConnectionError(new Error("api.error.notFound"))).toBe(false)
    expect(isConnectionError(new Error("Cannot read properties of undefined"))).toBe(false)
  })

  it("tekrar dene butonu reset'i çağırır ve dönüş linki verilen sayfaya gider", () => {
    const reset = vi.fn()
    render(<ErrorView error={new Error("boom")} reset={reset} home={{ href: "/dashboard", labelKey: "errorPage.goDashboard" }} />)

    expect(screen.getByText("errorPage.title")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /errorPage.retry/ }))
    expect(reset).toHaveBeenCalled()
    expect(screen.getByRole("link", { name: "errorPage.goDashboard" })).toHaveAttribute("href", "/dashboard")
  })
})
