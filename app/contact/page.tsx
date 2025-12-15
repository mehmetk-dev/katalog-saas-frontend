import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { Button } from "@/components/ui/button"
import { Mail, MapPin, Clock } from "lucide-react"

export const metadata = {
  title: "İletişim | CatalogPro",
  description: "CatalogPro ile iletişime geçin.",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <main className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3">İletişim</h1>
          <p className="text-slate-500 text-lg mb-12">Sorularınız için bize ulaşın.</p>

          <div className="grid lg:grid-cols-5 gap-10">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">E-posta</h3>
                    <a href="mailto:destek@catalogpro.app" className="text-violet-600 hover:underline">
                      destek@catalogpro.app
                    </a>
                    <p className="text-sm text-slate-500 mt-1">24 saat içinde yanıt</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Çalışma Saatleri</h3>
                    <p className="text-slate-600">Pazartesi - Cuma</p>
                    <p className="text-sm text-slate-500 mt-1">09:00 - 18:00 (İstanbul)</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Konum</h3>
                    <p className="text-slate-600">İstanbul, Türkiye</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">Mesaj Gönderin</h2>

                <form className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Ad</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                        placeholder="Adınız"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Soyad</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                        placeholder="Soyadınız"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">E-posta</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                      placeholder="ornek@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Konu</label>
                    <select className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white">
                      <option>Genel Soru</option>
                      <option>Teknik Destek</option>
                      <option>Fiyatlandırma</option>
                      <option>İş Birliği</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mesaj</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
                      placeholder="Mesajınızı yazın..."
                    />
                  </div>

                  <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 h-11">
                    Gönder
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
