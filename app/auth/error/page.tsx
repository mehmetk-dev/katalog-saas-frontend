import { AuthErrorView } from "@/components/auth/auth-status-views"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  // Yalnızca kısa, güvenli hata kodlarını göster (URL'den gelen serbest metni yansıtma)
  const code = error && /^[a-z0-9_-]{1,64}$/i.test(error) ? error : undefined
  return <AuthErrorView code={code} />
}
