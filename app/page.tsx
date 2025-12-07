import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle2, LayoutGrid, Zap, Share2, Sparkles, Users, FileText } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <LayoutGrid className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">CatalogPro</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Özellikler
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Nasıl Çalışır
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Fiyatlandırma
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/auth">
              <Button variant="ghost" size="sm">
                Giriş Yap
              </Button>
            </Link>
            <Link href="/auth?tab=signup">
              <Button size="sm">Ücretsiz Dene</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              <Sparkles className="w-3 h-3 mr-1" />
              Yeni: AI destekli ürün açıklamaları
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-balance">
              Profesyonel ürün katalogları <span className="text-primary">dakikalar içinde</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty">
              Ürünlerinizi sergileyin, müşterilerinizi etkileyin. Sürükle-bırak editörümüzle göz alıcı dijital
              kataloglar oluşturun ve anında paylaşın.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth?tab=signup">
                <Button size="lg" className="h-12 px-8 text-base">
                  Ücretsiz Başla
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base bg-transparent">
                  Demo İzle
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Kredi kartı gerektirmez
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                14 gün ücretsiz deneme
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="rounded-xl border border-border shadow-2xl overflow-hidden bg-card">
              <div className="h-8 bg-muted flex items-center gap-2 px-4 border-b border-border">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <img
                src="/modern-catalog-builder-dashboard-with-product-grid.jpg"
                alt="CatalogPro Dashboard"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">10K+</p>
              <p className="text-sm text-muted-foreground mt-1">Aktif Kullanıcı</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">50K+</p>
              <p className="text-sm text-muted-foreground mt-1">Katalog Oluşturuldu</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">2M+</p>
              <p className="text-sm text-muted-foreground mt-1">Ürün Eklendi</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">99.9%</p>
              <p className="text-sm text-muted-foreground mt-1">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">
              Özellikler
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">İhtiyacınız olan her şey</h2>
            <p className="text-muted-foreground text-lg">
              Güçlü araçlarımızla profesyonel kataloglar oluşturun, yönetin ve paylaşın.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <LayoutGrid className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Sürükle & Bırak Editör</h3>
              <p className="text-muted-foreground text-sm">
                Kod bilgisi gerektirmeden görsel editörümüzle kataloglarınızı kolayca tasarlayın.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Anında Yayınlama</h3>
              <p className="text-muted-foreground text-sm">
                Tek tıkla kataloglarınızı yayınlayın ve özel linkinizle anında paylaşın.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Çoklu Format Export</h3>
              <p className="text-muted-foreground text-sm">
                PDF, web linki veya embed kodu olarak kataloglarınızı dışa aktarın.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">CSV/Excel Import</h3>
              <p className="text-muted-foreground text-sm">
                Mevcut ürün verilerinizi toplu olarak içe aktarın ve zaman kazanın.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">AI Açıklamalar</h3>
              <p className="text-muted-foreground text-sm">
                Yapay zeka ile etkileyici ürün açıklamaları otomatik oluşturun.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Takım İşbirliği</h3>
              <p className="text-muted-foreground text-sm">
                Ekibinizle birlikte çalışın, yetkileri yönetin ve değişiklikleri takip edin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">
              Nasıl Çalışır
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">3 adımda başlayın</h2>
            <p className="text-muted-foreground text-lg">
              Profesyonel kataloglar oluşturmak hiç bu kadar kolay olmamıştı.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                1
              </div>
              <h3 className="font-semibold text-lg mb-2">Ürünlerinizi Ekleyin</h3>
              <p className="text-muted-foreground text-sm">Ürünlerinizi tek tek veya CSV ile toplu olarak yükleyin.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                2
              </div>
              <h3 className="font-semibold text-lg mb-2">Tasarımınızı Seçin</h3>
              <p className="text-muted-foreground text-sm">
                Hazır şablonlardan seçin veya kendi tasarımınızı oluşturun.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                3
              </div>
              <h3 className="font-semibold text-lg mb-2">Yayınlayın & Paylaşın</h3>
              <p className="text-muted-foreground text-sm">Tek tıkla yayınlayın ve müşterilerinizle paylaşın.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center bg-primary rounded-2xl p-12 md:p-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Hemen başlamaya hazır mısınız?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
              14 gün ücretsiz deneyin, kredi kartı gerektirmez. İstediğiniz zaman iptal edin.
            </p>
            <Link href="/auth?tab=signup">
              <Button size="lg" variant="secondary" className="h-12 px-8 text-base">
                Ücretsiz Hesap Oluştur
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">CatalogPro</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Gizlilik
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Şartlar
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                İletişim
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">© 2025 CatalogPro. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
