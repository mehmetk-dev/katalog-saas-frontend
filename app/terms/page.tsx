import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { LegalDocument } from "@/components/marketing"
import { FileText, Upload, ShieldCheck, CreditCard, Scale, Mail } from "lucide-react"

export default function TermsPage() {
  return (
    <LegalDocument header={<PublicHeader />} footer={<PublicFooter />} title="Kullanım Koşulları" meta="Son güncelleme: 25 Ocak 2026">

          {/* Özet Kutusu */}
          <div className="rounded-xl border border-border bg-muted/40 p-6">
            <div className="flex items-center gap-2 mb-5">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-bold text-foreground">Kısaca</h2>
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
                  <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-foreground text-sm leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Detaylı Hukuki Metin */}
          <div className="space-y-10">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">1. Taraflar ve Amaç</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Bu sözleşme, FogCatalog (&quot;Sağlayıcı&quot;) ile Platform&apos;a üye olan kullanıcı (&quot;Kullanıcı&quot;) arasında, kullanıcının platformdan faydalanma şartlarını düzenlemek amacıyla akdedilmiştir.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">2. İçerik ve Sorumluluk Reddi</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  FogCatalog bir yer sağlayıcıdır. Kullanıcıların platforma yüklediği kataloglar, görseller ve metinlerden (&quot;İçerik&quot;) doğan tüm hukuki ve cezai sorumluluk tamamen Kullanıcı&apos;ya aittir.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    <div>
                      <strong>Telif Hakları:</strong> Kullanıcı, platforma yüklediği tüm materyallerin (ör: ürün fotoğrafları) telif haklarına sahip olduğunu veya kullanım hakkını aldığını beyan eder. Başkasına ait görsellerin izinsiz kullanımı durumunda doğacak zararlardan FogCatalog sorumlu tutulamaz.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    <div>
                      <strong>Yasaklı İçerik:</strong> Yasadışı, ahlaka aykırı, yanıltıcı veya üçüncü şahısların haklarını ihlal eden içerik yayınlamak kesinlikle yasaktır.
                    </div>
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">3. Hesap Güvenliği ve Kapatma</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex gap-3"><span className="text-primary">•</span>Hesap bilgilerinizin güvenliğinden siz sorumlusunuz.</li>
                  <li className="flex gap-3"><span className="text-primary">•</span>Şüpheli aktivite durumunda FogCatalog hesabı askıya alma hakkını saklı tutar.</li>
                  <li className="flex gap-3"><span className="text-primary">•</span>Kullanım koşullarına aykırı davranış tespit edildiğinde, FogCatalog tek taraflı olarak üyeliği sonlandırma ve içerikleri silme hakkına sahiptir.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">4. Ödeme ve Abonelik</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Hizmetler abonelik modeline göre sunulur. Ödeme yapılmayan dönemler için hizmet erişimi kısıtlanabilir. Fiyat değişiklikleri bir sonraki abonelik döneminden itibaren geçerli olur.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">5. Uyuşmazlık Çözümü</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Bu sözleşmeden doğabilecek ihtilaflarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
                </p>
              </section>

              <section className="pt-6 border-t border-border">
                <h2 className="text-xl font-semibold text-foreground mb-4">6. İletişim</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Yasal bildirimler ve sorularınız için{' '}
                  <a href="mailto:legal@fogcatalog.com" className="text-primary hover:underline">
                    legal@fogcatalog.com
                  </a>{' '}
                  adresine yazabilirsiniz.
                </p>
              </section>
            </div>
    </LegalDocument>
  )
}
