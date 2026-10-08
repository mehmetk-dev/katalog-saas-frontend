import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function EmailConfirmedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted via-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-success-soft rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <CardTitle className="text-2xl">E-posta Doğrulandı!</CardTitle>
          <CardDescription className="text-base">Hesabınız başarıyla aktifleştirildi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">Artık FogCatalog'un tüm özelliklerini kullanabilirsiniz.</p>

          <Link href="/dashboard">
            <Button className="w-full bg-primary hover:bg-primary/90">Panele Git</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
