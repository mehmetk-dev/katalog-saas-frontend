import { Suspense } from "react"
import { Loader2 } from "lucide-react"

import { AuthPageClient } from "@/components/auth/auth-page-client"

export default async function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AuthPageClient />
    </Suspense>
  )
}
