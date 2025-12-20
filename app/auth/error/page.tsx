import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Bir hata oluştu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {params?.error ? (
              <p className="text-sm text-muted-foreground">Hata kodu: {params.error}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Beklenmeyen bir hata oluştu.</p>
            )}
            <Link href="/auth">
              <Button className="w-full">Tekrar Dene</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
