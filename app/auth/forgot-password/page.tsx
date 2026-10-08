import { redirect } from "next/navigation"

/** Şifre sıfırlama formu /auth içinde; eski linkler ve hata yönlendirmeleri için korunur. */
export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const params = new URLSearchParams({ tab: "forgot-password" })
  if (error) params.set("error", error)
  redirect(`/auth?${params.toString()}`)
}
