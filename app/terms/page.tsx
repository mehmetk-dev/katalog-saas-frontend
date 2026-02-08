import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <main className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3">Kullanım Koşulları</h1>
          <p className="text-slate-500 mb-12">Son güncelleme: 25 Ocak 2026</p>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-10 space-y-10">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Taraflar ve Amaç</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Bu sözleşme, FogCatalog ("Sağlayıcı") ile Platform'a üye olan kullanıcı ("Kullanıcı") arasında, kullanıcının platformdan faydalanma şartlarını düzenlemek amacıyla akdedilmiştir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">2. İçerik ve Sorumluluk Reddi</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                FogCatalog bir yer sağlayıcıdır. Kullanıcıların platforma yüklediği kataloglar, görseller ve metinlerden ("İçerik") doğan tüm hukuki ve cezai sorumluluk tamamen Kullanıcı'ya aittir.
              </p>
              <ul className="space-y-3 text-slate-600">
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">•</span>
                  <div>
                    <strong>Telif Hakları:</strong> Kullanıcı, platforma yüklediği tüm materyallerin (ör: ürün fotoğrafları) telif haklarına sahip olduğunu veya kullanım hakkını aldığını beyan eder. Başkasına ait görsellerin izinsiz kullanımı durumunda doğacak zararlardan FogCatalog sorumlu tutulamaz.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">•</span>
                  <div>
                    <strong>Yasaklı İçerik:</strong> Yasadışı, ahlaka aykırı, yanıltıcı veya üçüncü şahısların haklarını ihlal eden içerik yayınlamak kesinlikle yasaktır.
                  </div>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">3. Hesap Güvenliği ve Kapatma</h2>
              <ul className="space-y-2 text-slate-600">
                <li className="flex gap-3"><span className="text-violet-500">•</span>Hesap bilgilerinizin güvenliğinden siz sorumlusunuz.</li>
                <li className="flex gap-3"><span className="text-violet-500">•</span>Şüpheli aktivite durumunda FogCatalog hesabı askıya alma hakkını saklı tutar.</li>
                <li className="flex gap-3"><span className="text-violet-500">•</span>Kullanım koşullarına aykırı davranış tespit edildiğinde, FogCatalog tek taraflı olarak üyeliği sonlandırma ve içerikleri silme hakkına sahiptir.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">4. Ödeme ve Abonelik</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Hizmetler abonelik modeline göre sunulur. Ödeme yapılmayan dönemler için hizmet erişimi kısıtlanabilir. Fiyat değişiklikleri bir sonraki abonelik döneminden itibaren geçerli olur.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">5. Uyuşmazlık Çözümü</h2>
              <p className="text-slate-600 leading-relaxed">
                Bu sözleşmeden doğabilecek ihtilaflarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
              </p>
            </section>

            <section className="pt-6 border-t border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">6. İletişim</h2>
              <p className="text-slate-600 leading-relaxed">
                Yasal bildirimler ve sorularınız için{' '}
                <a href="mailto:legal@fogcatalog.com" className="text-violet-600 hover:underline">
                  legal@fogcatalog.com
                </a>{' '}
                adresine yazabilirsiniz.
              </p>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
