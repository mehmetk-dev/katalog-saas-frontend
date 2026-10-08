import Link from "next/link"
import { Mail, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted via-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center mx-auto mb-6 hover:opacity-80 transition-opacity">
            <Logo size="lg" />
          </Link>
          <div className="mx-auto w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">E-postanızı Kontrol Edin</CardTitle>
          <CardDescription className="text-base">Hesabınızı doğrulamak için size bir e-posta gönderdik</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
            <p>E-postanızdaki doğrulama linkine tıklayarak hesabınızı aktifleştirin.</p>
            <p>E-posta birkaç dakika içinde gelmezse spam klasörünüzü kontrol edin.</p>
          </div>

          <div className="pt-4">
            <Link href="/auth">
              <Button variant="outline" className="w-full bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Giriş Sayfasına Dön
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
