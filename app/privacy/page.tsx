import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ana Sayfaya Dön
          </Link>
        </Button>

        <h1 className="text-4xl font-bold mb-8">Gizlilik Politikası</h1>
        <p className="text-muted-foreground mb-8">Son güncelleme: 4 Aralık 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Giriş</h2>
            <p className="text-muted-foreground leading-relaxed">
              CatalogPro ("biz", "bizim" veya "bize") gizliliğinizi korumaya kararlıdır. Bu Gizlilik Politikası,
              hizmetimizi kullandığınızda bilgilerinizi nasıl topladığımızı, kullandığımızı, açıkladığımızı ve
              koruduğumuzu açıklar.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Topladığımız Bilgiler</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Bize doğrudan sağladığınız bilgileri topluyoruz:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Hesap bilgileri (ad, e-posta adresi, şifre)</li>
              <li>Profil bilgileri (şirket adı, sektör)</li>
              <li>Oluşturduğunuz ürün ve katalog verileri</li>
              <li>Ödeme bilgileri (Stripe aracılığıyla güvenli şekilde işlenir)</li>
              <li>Bizimle iletişimleriniz</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Bilgilerinizi Nasıl Kullanıyoruz</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Topladığımız bilgileri şu amaçlarla kullanıyoruz:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Hizmetlerimizi sunmak, sürdürmek ve geliştirmek</li>
              <li>İşlemleri gerçekleştirmek ve ilgili bilgileri göndermek</li>
              <li>Teknik bildirimler ve destek mesajları göndermek</li>
              <li>Yorumlarınıza, sorularınıza ve taleplerinize yanıt vermek</li>
              <li>Eğilimleri, kullanımı ve aktiviteleri izlemek ve analiz etmek</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Veri Güvenliği</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kişisel bilgilerinizi korumak için uygun teknik ve organizasyonel güvenlik önlemleri uyguluyoruz. Tüm
              veriler aktarım sırasında ve beklemede şifrelenir. Satır düzeyinde güvenlik politikaları ile güvenli veri
              depolama için Supabase kullanıyoruz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Veri Saklama</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kişisel bilgilerinizi hesabınız aktif olduğu sürece veya size hizmet vermek için gerekli olduğu sürece
              saklıyoruz. Hesabınızı istediğiniz zaman silebilirsiniz, bu tüm verilerinizi sistemlerimizden
              kaldıracaktır.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Haklarınız</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">Şu haklara sahipsiniz:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Kişisel verilerinize erişim</li>
              <li>Yanlış verileri düzeltme</li>
              <li>Verilerinizi silme</li>
              <li>Verilerinizi dışa aktarma</li>
              <li>Onayı geri çekme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. İletişim</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bu Gizlilik Politikası hakkında sorularınız varsa, lütfen{" "}
              <a href="mailto:gizlilik@catalogpro.com" className="text-primary hover:underline">
                gizlilik@catalogpro.com
              </a>{" "}
              adresinden bizimle iletişime geçin.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
