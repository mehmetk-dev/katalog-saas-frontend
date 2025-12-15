import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"

export const metadata = {
  title: "Gizlilik Politikası | CatalogPro",
  description: "CatalogPro gizlilik politikası ve kişisel verilerin korunması.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <main className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3">Gizlilik Politikası</h1>
          <p className="text-slate-500 mb-12">Son güncelleme: 13 Aralık 2025</p>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-10 space-y-10">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Toplanan Veriler</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                CatalogPro olarak, hizmetlerimizi sunabilmek için bazı kişisel verilerinizi topluyoruz.
              </p>
              <ul className="space-y-2 text-slate-600">
                <li className="flex gap-3">
                  <span className="text-violet-500">•</span>
                  <span><strong>Hesap Bilgileri:</strong> Ad, soyad, e-posta adresi</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-violet-500">•</span>
                  <span><strong>Kullanım Verileri:</strong> Platform kullanım istatistikleri</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-violet-500">•</span>
                  <span><strong>İçerik:</strong> Yüklediğiniz ürün bilgileri ve görseller</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Verilerin Kullanımı</h2>
              <p className="text-slate-600 leading-relaxed mb-4">Topladığımız verileri şu amaçlarla kullanıyoruz:</p>
              <ul className="space-y-2 text-slate-600">
                <li className="flex gap-3"><span className="text-violet-500">•</span>Hizmetlerimizi sunmak ve iyileştirmek</li>
                <li className="flex gap-3"><span className="text-violet-500">•</span>Hesabınızın güvenliğini sağlamak</li>
                <li className="flex gap-3"><span className="text-violet-500">•</span>Sizinle iletişim kurmak ve destek sağlamak</li>
                <li className="flex gap-3"><span className="text-violet-500">•</span>Yasal yükümlülüklerimizi yerine getirmek</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">3. Veri Güvenliği</h2>
              <p className="text-slate-600 leading-relaxed">
                Verileriniz 256-bit SSL şifreleme ile korunur ve güvenli veri merkezlerinde saklanır.
                Düzenli güvenlik denetimleri yaparak verilerinizin güvende kalmasını sağlıyoruz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">4. Haklarınız</h2>
              <p className="text-slate-600 leading-relaxed mb-4">6698 sayılı KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
              <ul className="space-y-2 text-slate-600">
                <li className="flex gap-3"><span className="text-violet-500">•</span>Verilerinizin işlenip işlenmediğini öğrenme</li>
                <li className="flex gap-3"><span className="text-violet-500">•</span>Verilerinize erişim talep etme</li>
                <li className="flex gap-3"><span className="text-violet-500">•</span>Düzeltme veya silme talep etme</li>
              </ul>
            </section>

            <section className="pt-6 border-t border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">5. İletişim</h2>
              <p className="text-slate-600 leading-relaxed">
                Gizlilik ile ilgili sorularınız için{' '}
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
