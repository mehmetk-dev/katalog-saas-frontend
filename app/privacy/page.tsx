import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <main className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3">Gizlilik Politikası</h1>
          <p className="text-slate-500 mb-12">Son güncelleme: 25 Ocak 2026</p>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-10 space-y-10">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Toplanan Veriler ve Kullanım Amacı</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                FogCatalog ("Platform") hizmetlerini sunarken aşağıdaki veri türlerini işlemekteyiz:
              </p>
              <ul className="space-y-3 text-slate-600">
                <li className="flex gap-3">
                  <span className="text-violet-500 font-bold">•</span>
                  <div>
                    <strong>Kimlik ve İletişim Verileri:</strong> Ad, soyad, e-posta adresi, telefon numarası gibi kayıt ve faturalama işlemleri için gerekli bilgiler.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-violet-500 font-bold">•</span>
                  <div>
                    <strong>Log ve Sistem Kayıtları:</strong> IP adresiniz, tarayıcı türünüz, erişim zamanınız ve platform üzerindeki hareketleriniz. Bu veriler 5651 sayılı kanun gereği ve sistem güvenliği amacıyla yasal süreler boyunca saklanmaktadır.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-violet-500 font-bold">•</span>
                  <div>
                    <strong>Müşteri İçerikleri:</strong> Platforma yüklediğiniz ürün görselleri, açıklamaları ve katalog verileri.
                  </div>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Veri Güvenliği ve Şifreleme</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Verilerinizin güvenliği bizim için en öncelikli konudur.
              </p>
              <ul className="space-y-2 text-slate-600">
                <li className="flex gap-3"><span className="text-violet-500">•</span>Tüm veri transferleri <strong>256-bit SSL/TLS</strong> şifreleme ile korunmaktadır.</li>
                <li className="flex gap-3"><span className="text-violet-500">•</span>Veritabanlarımızda hassas bilgiler (şifreler vb.) hashlenmiş (kriptolanmış) olarak saklanır.</li>
                <li className="flex gap-3"><span className="text-violet-500">•</span>Verileriniz, düzenli yedeklemeler ile veri kaybına karşı korunmaktadır.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">3. Üçüncü Taraflarla Paylaşım</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Kişisel verilerinizi asla pazarlama amacıyla satmıyoruz. Ancak hizmetin ifası için zorunlu olan aşağıdaki durumlar haricinde üçüncü şahıslarla paylaşım yapılmamaktadır:
              </p>
              <ul className="space-y-3 text-slate-600">
                <li className="flex gap-3">
                  <span className="text-violet-500 font-bold">•</span>
                  <div>
                    <strong>Ödeme Altyapısı:</strong> Kredi kartı bilgileriniz sunucularımızda tutulmaz, doğrudan ödeme hizmet sağlayıcısı (örn: Iyzico, Stripe) tarafından işlenir.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-violet-500 font-bold">•</span>
                  <div>
                    <strong>Analiz ve İyileştirme:</strong> Anonimleştirilmiş kullanım verileri, hizmet kalitesini artırmak amacıyla Google Analytics gibi analiz araçlarıyla paylaşılabilir.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-violet-500 font-bold">•</span>
                  <div>
                    <strong>Yasal Zorunluluklar:</strong> Varsa mahkeme kararı veya yasal talepler doğrultusunda yetkili makamlarla paylaşım yapılabilir.
                  </div>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">4. KVKK Kapsamındaki Haklarınız</h2>
              <p className="text-slate-600 leading-relaxed mb-4">6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca;</p>
              <ul className="space-y-2 text-slate-600">
                <li className="flex gap-3"><span className="text-violet-500">•</span>Verilerinizin işlenip işlenmediğini öğrenme,</li>
                <li className="flex gap-3"><span className="text-violet-500">•</span>Yanlış veya eksik verilerin düzeltilmesini isteme,</li>
                <li className="flex gap-3"><span className="text-violet-500">•</span>Verilerin silinmesini veya yok edilmesini talep etme hakkına sahipsiniz.</li>
              </ul>
            </section>

            <section className="pt-6 border-t border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">5. İletişim</h2>
              <p className="text-slate-600 leading-relaxed">
                Gizlilik politikamız veya veri güvenliği ile ilgili sorularınız için{' '}
                <a href="mailto:privacy@fogcatalog.com" className="text-violet-600 hover:underline">
                  privacy@fogcatalog.com
                </a>{' '}
                adresinden Veri Koruma Görevlimize ulaşabilirsiniz.
              </p>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
