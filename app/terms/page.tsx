import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"

export const metadata = {
  title: "Kullanım Şartları | CatalogPro",
  description: "CatalogPro kullanım şartları ve koşulları.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <main className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3">Kullanım Şartları</h1>
          <p className="text-slate-500 mb-12">Son güncelleme: 13 Aralık 2025</p>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-10 space-y-10">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Hizmet Kullanımı</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                CatalogPro platformunu kullanarak aşağıdaki şartları kabul etmiş sayılırsınız:
              </p>
              <ul className="space-y-2 text-slate-600">
                <li className="flex gap-3"><span className="text-violet-500">•</span>Hizmetleri yalnızca yasal amaçlarla kullanacaksınız</li>
                <li className="flex gap-3"><span className="text-violet-500">•</span>Hesap güvenliğinizden siz sorumlusunuz</li>
                <li className="flex gap-3"><span className="text-violet-500">•</span>Yüklediğiniz içeriklerden siz sorumlusunuz</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Fikri Mülkiyet</h2>
              <p className="text-slate-600 leading-relaxed">
                Platform tasarımı ve kodları CatalogPro'ya aittir. Yüklediğiniz içerikler üzerindeki
                haklar size ait olmaya devam eder. Başkalarının fikri mülkiyet haklarını ihlal eden
                içerik yüklemek yasaktır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">3. Ödeme ve Abonelik</h2>
              <ul className="space-y-2 text-slate-600">
                <li className="flex gap-3"><span className="text-violet-500">•</span>Ödemeler aylık veya yıllık olarak alınır</li>
                <li className="flex gap-3"><span className="text-violet-500">•</span>Aboneliğinizi istediğiniz zaman iptal edebilirsiniz</li>
                <li className="flex gap-3"><span className="text-violet-500">•</span>İade talepleri için destek ekibimize başvurun</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">4. Yasaklanan Kullanımlar</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Aşağıdaki davranışlar kesinlikle yasaktır:
              </p>
              <ul className="space-y-2 text-slate-600">
                <li className="flex gap-3"><span className="text-red-500">•</span>Yasadışı veya zararlı içerik yayınlamak</li>
                <li className="flex gap-3"><span className="text-red-500">•</span>Sisteme zarar vermeye çalışmak</li>
                <li className="flex gap-3"><span className="text-red-500">•</span>Diğer kullanıcıların haklarını ihlal etmek</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">5. Sorumluluk</h2>
              <p className="text-slate-600 leading-relaxed">
                CatalogPro, hizmet kesintileri veya veri kayıplarından kaynaklanan dolaylı zararlardan
                sorumlu tutulamaz. Hizmetler "olduğu gibi" sunulmaktadır. Bu şartlar Türkiye Cumhuriyeti
                yasalarına tabidir.
              </p>
            </section>

            <section className="pt-6 border-t border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">6. İletişim</h2>
              <p className="text-slate-600 leading-relaxed">
                Sorularınız için{' '}
                <a href="mailto:destek@catalogpro.app" className="text-violet-600 hover:underline">
                  destek@catalogpro.app
                </a>{' '}
                adresinden bize ulaşabilirsiniz.
              </p>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
