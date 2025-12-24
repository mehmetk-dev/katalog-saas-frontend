import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function EmailConfirmedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">E-posta Doğrulandı!</CardTitle>
          <CardDescription className="text-base">Hesabınız başarıyla aktifleştirildi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">Artık CatalogPro'nun tüm özelliklerini kullanabilirsiniz.</p>

          <Link href="/dashboard">
            <Button className="w-full bg-violet-600 hover:bg-violet-700">Panele Git</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
