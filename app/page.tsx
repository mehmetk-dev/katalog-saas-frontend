import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle2, LayoutGrid, Zap, Share2, Sparkles, Users, FileText, Star, ShieldCheck, QrCode } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/10 supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <LayoutGrid className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">CatalogPro</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Özellikler
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Nasıl Çalışır
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Fiyatlandırma
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/auth" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="hover:bg-primary/5">
                Giriş Yap
              </Button>
            </Link>
            <Link href="/auth?tab=signup">
              <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-500/20 border-0 transition-all hover:scale-105">
                Ücretsiz Dene
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none -z-10" />
        <div className="absolute top-20 right-0 -mr-20 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 left-0 -ml-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -z-10" />

        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wide">Yapay Zeka Destekli Katalog Oluşturucu</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-slate-900 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              Ürün kataloglarınızı <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 animate-text-gradient bg-300%">
                sanata dönüştürün
              </span>
            </h1>

            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              Dakikalar içinde profesyonel, etkileşimli ve satış odaklı kataloglar oluşturun. Tasarımcıya ihtiyaç duymadan, markanızı en iyi şekilde yansıtın.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
              <Link href="/auth?tab=signup">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all hover:scale-105 active:scale-95">
                  Hemen Başla — Ücretsiz
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all">
                  Örnekleri İncele
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Kredi kartı gerekmez
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                14 gün Pro deneme
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                İstediğiniz zaman iptal
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mt-20 relative max-w-6xl mx-auto animate-in fade-in zoom-in duration-1000 delay-500">
            <div className="relative rounded-2xl border border-white/20 shadow-2xl overflow-hidden bg-slate-950 ring-1 ring-slate-900/5 aspect-[16/10] md:aspect-[21/9]">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent z-10" />
              <img
                src="/hero-dashboard.webp"
                alt="CatalogPro Dashboard Arayüzü"
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
              />
            </div>
            {/* Floating Badges */}
            <div className="absolute -left-12 top-1/4 p-4 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 hidden md:block animate-bounce-slow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Performans</p>
                  <p className="font-bold text-slate-900">%100 Hızlı</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-8 bottom-1/3 p-4 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 hidden md:block animate-bounce-slow delay-1000">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Share2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Paylaşım</p>
                  <p className="font-bold text-slate-900">Tek Tıkla</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-10 border-y border-slate-100 bg-slate-50/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">2,000+ İşletme Tarafından Güveniliyor</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Replace with actual logos nicely styled */}
            <h3 className="text-xl font-bold font-serif text-slate-800">VOGUE</h3>
            <h3 className="text-xl font-bold font-sans text-slate-800">Forbes</h3>
            <h3 className="text-xl font-bold font-mono text-slate-800">WIRED</h3>
            <h3 className="text-xl font-bold font-serif italic text-slate-800">Elle</h3>
            <h3 className="text-xl font-bold font-sans tracking-tighter text-slate-800">TechCrunch</h3>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <Badge variant="secondary" className="mb-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100">
              Neden CatalogPro?
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">Tüm ürün süreçleriniz tek bir yerde</h2>
            <p className="text-lg text-slate-600">
              Karmaşık excel dosyalarından ve pahalı tasarımcılardan kurtulun. Modern e-ticaret için tasarlanmış özelliklerle tanışın.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <LayoutGrid className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Akıllı Tasarım Sistemi</h3>
              <p className="text-slate-600 leading-relaxed">
                Sürükle-bırak editör ve profesyonel şablonlarla dakikalar içinde kurumsal kimliğinize uygun kataloglar oluşturun.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-violet-100 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-7 h-7 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Sihirli AI Asistanı</h3>
              <p className="text-slate-600 leading-relaxed">
                Sadece ürün ismini girin, entegre yapay zeka (Magic Writer) saniyeler içinde satış odaklı, profesyonel açıklamalar yazsın.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <QrCode className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">QR Kod & Dijital Erişim</h3>
              <p className="text-slate-600 leading-relaxed">
                Her kataloğunuz için otomatik QR kod oluşturulur. Müşterileriniz tek bir tarama ile ürünlerinize anında ulaşır.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Features Split View */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-violet-600 rounded-full blur-[100px] opacity-30" />
                <img src="/feature-mobile.webp" alt="Mobil Uyumlu Katalog" className="relative rounded-2xl shadow-2xl border border-white/10 w-full hover:-rotate-2 transition-transform duration-500" />
              </div>
            </div>
            <div className="w-full md:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Müşteri Deneyimi</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">Her cihazda kusursuz görünüm</h2>
              <p className="text-lg text-slate-400">
                Müşterileriniz kataloglarınızı telefon, tablet veya bilgisayardan sorunsuz bir şekilde görüntüleyebilir. Mobil uyumlu tasarımımız ile satışlarınızı artırın.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span>Retina ekran desteği ile kristal netliğinde görseller</span>
                </li>
                <li className="flex items-center gap-3 text-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span>Dokunmatik dostu arayüz ve navigasyon</span>
                </li>
                <li className="flex items-center gap-3 text-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span>Hızlı yükleme ve offline erişim</span>
                </li>
              </ul>
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 border-0 h-12 mt-4">
                Detaylı İncele <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row-reverse items-center gap-16">
            <div className="w-full md:w-1/2">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full blur-[100px] opacity-20" />
                <img src="/feature-print.webp" alt="Baskı Kalitesinde Çıktı" className="relative rounded-2xl shadow-2xl border border-slate-100 w-full hover:rotate-2 transition-transform duration-500" />
              </div>
            </div>
            <div className="w-full md:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Print-Ready</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight text-slate-900">Dijitalden baskıya, kaliteden ödün vermeyin</h2>
              <p className="text-lg text-slate-600">
                Sadece dijital değil, fiziksel dünyada da yanınızdayız. Kataloglarınızı yüksek çözünürlüklü (300 DPI) PDF formatında indirip doğrudan matbaaya gönderebilirsiniz.
              </p>
              <ul className="space-y-4 text-slate-700">
                <li className="flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-blue-600">1</span>
                  </div>
                  <span>Otomatik sayfa düzeni ve kros payları</span>
                </li>
                <li className="flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-blue-600">2</span>
                  </div>
                  <span>CMYK renk profili uyumluluğu</span>
                </li>
                <li className="flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-blue-600">3</span>
                  </div>
                  <span>A4, A5 ve özel boyut seçenekleri</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 tracking-tight">
              Katalog hazırlamayı <br /> keyifli hale getirin
            </h2>
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
              Binlerce mutlu kullanıcının arasına katılın. İlk kataloğunuzu oluşturmak sadece birkaç dakikanızı alacak.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth?tab=signup">
                <Button size="lg" className="h-16 px-10 text-xl font-semibold rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all hover:scale-105">
                  Ücretsiz Başlayın
                  <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
              </Link>
            </div>

            <p className="mt-8 text-sm text-slate-500">
              14 gün deneme süresi • Kredi kartı gerekmez • 7/24 Destek
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <LayoutGrid className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">CatalogPro</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Modern işletmeler için yeni nesil katalog oluşturma platformu. Ürünlerinizi dünyaya açın.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Ürün</h4>
              <ul className="space-y-4 text-slate-500">
                <li><Link href="#" className="hover:text-indigo-600 transition-colors">Özellikler</Link></li>
                <li><Link href="#" className="hover:text-indigo-600 transition-colors">Şablonlar</Link></li>
                <li><Link href="#" className="hover:text-indigo-600 transition-colors">Entegrasyonlar</Link></li>
                <li><Link href="#" className="hover:text-indigo-600 transition-colors">Fiyatlandırma</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Kaynaklar</h4>
              <ul className="space-y-4 text-slate-500">
                <li><Link href="#" className="hover:text-indigo-600 transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-indigo-600 transition-colors">Yardım Merkezi</Link></li>
                <li><Link href="#" className="hover:text-indigo-600 transition-colors">Akademi</Link></li>
                <li><Link href="#" className="hover:text-indigo-600 transition-colors">Topluluk</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Şirket</h4>
              <ul className="space-y-4 text-slate-500">
                <li><Link href="#" className="hover:text-indigo-600 transition-colors">Hakkımızda</Link></li>
                <li><Link href="#" className="hover:text-indigo-600 transition-colors">Kariyer</Link></li>
                <li><Link href="#" className="hover:text-indigo-600 transition-colors">Yasal</Link></li>
                <li><Link href="#" className="hover:text-indigo-600 transition-colors">İletişim</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>© 2025 CatalogPro Inc. Tüm hakları saklıdır.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="hover:text-slate-900">Gizlilik Politikası</Link>
              <Link href="#" className="hover:text-slate-900">Kullanım Şartları</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
