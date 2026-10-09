import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PasswordCard } from "@/components/settings/password-card"

const auth = vi.hoisted(() => ({
  getUser: vi.fn(),
  signInWithPassword: vi.fn(),
  updateUser: vi.fn(),
}))
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth }) }))

const t = (key: string) => key

function withIdentities(...providers: string[]) {
  auth.getUser.mockResolvedValue({ data: { user: { identities: providers.map((provider) => ({ provider })) } } })
}

describe("PasswordCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.signInWithPassword.mockResolvedValue({ error: null })
    auth.updateUser.mockResolvedValue({ error: null })
  })

  it("mevcut şifre yanlışsa şifreyi değiştirmez", async () => {
    withIdentities("email")
    auth.signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } })
    render(<PasswordCard email="a@b.com" t={t} />)

    await userEvent.type(await screen.findByLabelText("settings.currentPassword"), "yanlis-sifre")
    await userEvent.type(screen.getByLabelText("auth.newPassword"), "yeni-sifre-123")
    await userEvent.type(screen.getByLabelText("auth.confirmPassword"), "yeni-sifre-123")
    await userEvent.click(screen.getByRole("button", { name: "settings.changePassword" }))

    expect(await screen.findByText("settings.currentPasswordWrong")).toBeInTheDocument()
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "a@b.com", password: "yanlis-sifre" })
    expect(auth.updateUser).not.toHaveBeenCalled()
  })

  it("doğrulanan şifreden sonra yeni şifreyi kaydeder ve alanları temizler", async () => {
    withIdentities("email", "google")
    render(<PasswordCard email="a@b.com" t={t} />)

    await userEvent.type(await screen.findByLabelText("settings.currentPassword"), "eski-sifre")
    await userEvent.type(screen.getByLabelText("auth.newPassword"), "yeni-sifre-123")
    await userEvent.type(screen.getByLabelText("auth.confirmPassword"), "yeni-sifre-123")
    await userEvent.click(screen.getByRole("button", { name: "settings.changePassword" }))

    expect(await screen.findByText("settings.passwordChanged")).toBeInTheDocument()
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "yeni-sifre-123" })
    expect(screen.getByLabelText("auth.newPassword")).toHaveValue("")
  })

  it("kısa ya da eşleşmeyen şifreyi göndermez", async () => {
    withIdentities("email")
    render(<PasswordCard email="a@b.com" t={t} />)

    await userEvent.type(await screen.findByLabelText("settings.currentPassword"), "eski-sifre")
    await userEvent.type(screen.getByLabelText("auth.newPassword"), "kisa")
    await userEvent.click(screen.getByRole("button", { name: "settings.changePassword" }))
    expect(screen.getByText("auth.passwordLength")).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText("auth.newPassword"), "-uzatildi")
    await userEvent.type(screen.getByLabelText("auth.confirmPassword"), "baska-sifre")
    await userEvent.click(screen.getByRole("button", { name: "settings.changePassword" }))
    expect(screen.getByText("auth.passwordMismatch")).toBeInTheDocument()
    expect(auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it("yalnızca Google hesabında mevcut şifre sormadan şifre belirletir", async () => {
    withIdentities("google")
    render(<PasswordCard email="a@b.com" t={t} />)

    await userEvent.type(await screen.findByLabelText("auth.newPassword"), "yeni-sifre-123")
    expect(screen.queryByLabelText("settings.currentPassword")).not.toBeInTheDocument()
    await userEvent.type(screen.getByLabelText("auth.confirmPassword"), "yeni-sifre-123")
    await userEvent.click(screen.getByRole("button", { name: "settings.setPassword" }))

    await waitFor(() => expect(auth.updateUser).toHaveBeenCalledWith({ password: "yeni-sifre-123" }))
    expect(auth.signInWithPassword).not.toHaveBeenCalled()
  })
})
