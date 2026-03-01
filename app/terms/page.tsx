import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { FileText, Upload, ShieldCheck, CreditCard, Scale, Mail } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <main className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3">Kullanım Koşulları</h1>
          <p className="text-slate-500 mb-10">Son güncelleme: 25 Ocak 2026</p>

          {/* Özet Kutusu */}
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200/60 rounded-2xl p-8 mb-10">
            <div className="flex items-center gap-2 mb-5">
              <FileText className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-900">Kısaca</h2>
            </div>
            <ul className="space-y-3">
              {[
                { icon: Upload, text: "Platforma yüklediğiniz tüm içeriklerden (görseller, metinler) siz sorumlusunuz. Telif hakkı size ait veya izinli olmalıdır." },
                { icon: ShieldCheck, text: "Hesabınızın güvenliğinden (şifre vb.) siz sorumlusunuz. Kuralların ihlali durumunda hesap askıya alınabilir." },
                { icon: CreditCard, text: "Hizmet abonelik modeliyle sunulur. Fiyat değişiklikleri bir sonraki dönemden itibaren geçerlidir." },
                { icon: Scale, text: "Uyuşmazlıklarda İstanbul Mahkemeleri yetkilidir." },
                { icon: Mail, text: "Sorularınız için: legal@fogcatalog.com" },
              ].map(({ icon: Icon, text }, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <Icon className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                  <span className="text-slate-700 text-sm leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Detaylı Hukuki Metin — Açılır/Kapanır */}
          <details className="group bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <summary className="flex items-center justify-between cursor-pointer px-8 py-5 hover:bg-slate-50 transition-colors select-none">
              <span className="text-sm font-semibold text-slate-700">Detaylı Hukuki Metin</span>
              <svg className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>

            <div className="px-8 md:px-10 pb-8 md:pb-10 pt-2 space-y-10 border-t border-slate-100">
              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Taraflar ve Amaç</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Bu sözleşme, FogCatalog (&quot;Sağlayıcı&quot;) ile Platform&apos;a üye olan kullanıcı (&quot;Kullanıcı&quot;) arasında, kullanıcının platformdan faydalanma şartlarını düzenlemek amacıyla akdedilmiştir.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">2. İçerik ve Sorumluluk Reddi</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  FogCatalog bir yer sağlayıcıdır. Kullanıcıların platforma yüklediği kataloglar, görseller ve metinlerden (&quot;İçerik&quot;) doğan tüm hukuki ve cezai sorumluluk tamamen Kullanıcı&apos;ya aittir.
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
          </details>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
