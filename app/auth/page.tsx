import { Suspense } from "react"
import { AuthPageClient } from "@/components/auth/auth-page-client"

export default async function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>}>
      <AuthPageClient />
    </Suspense>
  )
}
