import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { Shield, Eye, Lock, Trash2, Mail } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-muted/50">
      <PublicHeader />

      <main className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">Gizlilik Politikası</h1>
          <p className="text-muted-foreground mb-10">Son güncelleme: 25 Ocak 2026</p>

          {/* Özet Kutusu */}
          <div className="bg-muted border border-border/60 rounded-2xl p-8 mb-10">
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Kısaca</h2>
            </div>
            <ul className="space-y-3">
              {[
                { icon: Eye, text: "Sadece hizmet için gerekli verilerinizi topluyoruz (ad, e-posta, yüklediğiniz içerikler)." },
                { icon: Lock, text: "Tüm verileriniz 256-bit SSL ile şifrelenir, şifreleriniz hashlenmiş saklanır." },
                { icon: Shield, text: "Verilerinizi asla pazarlama amacıyla satmıyoruz. Üçüncü partilerle yalnızca ödeme işlemi ve yasal zorunluluk durumunda paylaşılır." },
                { icon: Trash2, text: "KVKK kapsamında verilerinizin silinmesini, düzeltilmesini veya taşınmasını talep edebilirsiniz." },
                { icon: Mail, text: "Sorularınız için: privacy@fogcatalog.com" },
              ].map(({ icon: Icon, text }, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground text-sm leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Detaylı Hukuki Metin — Açılır/Kapanır */}
          <details className="group bg-card rounded-2xl border border-border overflow-hidden">
            <summary className="flex items-center justify-between cursor-pointer px-8 py-5 hover:bg-muted/50 transition-colors select-none">
              <span className="text-sm font-semibold text-foreground">Detaylı Hukuki Metin</span>
              <svg className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>

            <div className="px-8 md:px-10 pb-8 md:pb-10 pt-2 space-y-10 border-t border-border">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">1. Toplanan Veriler ve Kullanım Amacı</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  FogCatalog (&quot;Platform&quot;) hizmetlerini sunarken aşağıdaki veri türlerini işlemekteyiz:
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    <div>
                      <strong>Kimlik ve İletişim Verileri:</strong> Ad, soyad, e-posta adresi, telefon numarası gibi kayıt ve faturalama işlemleri için gerekli bilgiler.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    <div>
                      <strong>Log ve Sistem Kayıtları:</strong> IP adresiniz, tarayıcı türünüz, erişim zamanınız ve platform üzerindeki hareketleriniz. Bu veriler 5651 sayılı kanun gereği ve sistem güvenliği amacıyla yasal süreler boyunca saklanmaktadır.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    <div>
                      <strong>Ödeme İşlem Verileri:</strong> Sipariş durumu, tahsilat tutarı ve banka/POS işlem referansı saklanır. Kart numarası, son kullanma tarihi, CVC ve kartın son 4 hanesi yalnızca ödeme kuruluşu tarafından işlenir; FogCatalog sistemlerine iletilmez ve kaydedilmez.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    <div>
                      <strong>Müşteri İçerikleri:</strong> Platforma yüklediğiniz ürün görselleri, açıklamaları ve katalog verileri.
                    </div>
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">2. Veri Güvenliği ve Şifreleme</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Verilerinizin güvenliği bizim için en öncelikli konudur.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex gap-3"><span className="text-primary">•</span>Tüm veri transferleri <strong>256-bit SSL/TLS</strong> şifreleme ile korunmaktadır.</li>
                  <li className="flex gap-3"><span className="text-primary">•</span>Veritabanlarımızda hassas bilgiler (şifreler vb.) hashlenmiş (kriptolanmış) olarak saklanır.</li>
                  <li className="flex gap-3"><span className="text-primary">•</span>Verileriniz, düzenli yedeklemeler ile veri kaybına karşı korunmaktadır.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">3. Üçüncü Taraflarla Paylaşım</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Kişisel verilerinizi asla pazarlama amacıyla satmıyoruz. Ancak hizmetin ifası için zorunlu olan aşağıdaki durumlar haricinde üçüncü şahıslarla paylaşım yapılmamaktadır:
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    <div>
                      <strong>Ödeme Altyapısı:</strong> Kredi kartı bilgileriniz sunucularımızda tutulmaz, doğrudan ödeme hizmet sağlayıcısı (örn: Iyzico, Stripe) tarafından işlenir.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    <div>
                      <strong>Analiz ve İyileştirme:</strong> Anonimleştirilmiş kullanım verileri, hizmet kalitesini artırmak amacıyla Google Analytics gibi analiz araçlarıyla paylaşılabilir.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    <div>
                      <strong>Yasal Zorunluluklar:</strong> Varsa mahkeme kararı veya yasal talepler doğrultusunda yetkili makamlarla paylaşım yapılabilir.
                    </div>
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">4. KVKK Kapsamındaki Haklarınız</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca;</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex gap-3"><span className="text-primary">•</span>Verilerinizin işlenip işlenmediğini öğrenme,</li>
                  <li className="flex gap-3"><span className="text-primary">•</span>Yanlış veya eksik verilerin düzeltilmesini isteme,</li>
                  <li className="flex gap-3"><span className="text-primary">•</span>Verilerin silinmesini veya yok edilmesini talep etme hakkına sahipsiniz.</li>
                </ul>
              </section>

              <section className="pt-6 border-t border-border">
                <h2 className="text-xl font-semibold text-foreground mb-4">5. İletişim</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Gizlilik politikamız veya veri güvenliği ile ilgili sorularınız için{' '}
                  <a href="mailto:privacy@fogcatalog.com" className="text-primary hover:underline">
                    privacy@fogcatalog.com
                  </a>{' '}
                  adresinden Veri Koruma Görevlimize ulaşabilirsiniz.
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
