import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ana Sayfaya Dön
          </Link>
        </Button>

        <h1 className="text-4xl font-bold mb-8">Kullanım Şartları</h1>
        <p className="text-muted-foreground mb-8">Son güncelleme: 4 Aralık 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Şartların Kabulü</h2>
            <p className="text-muted-foreground leading-relaxed">
              CatalogPro'ya erişerek ve kullanarak bu Kullanım Şartlarına bağlı olmayı kabul ediyorsunuz. Bu şartları
              kabul etmiyorsanız, lütfen hizmetimizi kullanmayın.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Hizmet Açıklaması</h2>
            <p className="text-muted-foreground leading-relaxed">
              CatalogPro, kullanıcıların ürün katalogları oluşturmasını, yönetmesini ve paylaşmasını sağlayan bir SaaS
              platformudur. Hizmetimiz ürün yönetimi, katalog oluşturma, şablon seçimi ve katalog yayınlama
              özelliklerini içerir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Kullanıcı Hesapları</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">CatalogPro'yu kullanmak için:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Doğru bilgilerle hesap oluşturmalısınız</li>
              <li>Hesap kimlik bilgilerinizin güvenliğini sağlamalısınız</li>
              <li>En az 18 yaşında olmalı veya ebeveyn onayına sahip olmalısınız</li>
              <li>Hesabınızı başkalarıyla paylaşmamalısınız</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Abonelik Planları</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">Aşağıdaki planları sunuyoruz:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>Ücretsiz Plan:</strong> 50 ürüne kadar, ayda 1 katalog dışa aktarma
              </li>
              <li>
                <strong>Pro Plan:</strong> Sınırsız ürün ve dışa aktarma, premium şablonlar, öncelikli destek
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Ödeme Koşulları</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pro abonelikleri aylık veya yıllık olarak faturalandırılır. Tüm ödemeler Stripe aracılığıyla güvenli
              şekilde işlenir. Aboneliğinizi istediğiniz zaman iptal edebilirsiniz ve fatura döneminin sonuna kadar
              erişiminiz devam eder.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Kabul Edilebilir Kullanım</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">Şunları yapmamayı kabul ediyorsunuz:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Yasadışı, zararlı veya rahatsız edici içerik yüklemek</li>
              <li>Fikri mülkiyet haklarını ihlal etmek</li>
              <li>Hizmetimizi hacklemeye veya bozmaya çalışmak</li>
              <li>Hizmeti spam veya kimlik avı için kullanmak</li>
              <li>İzin almadan hizmeti yeniden satmak veya dağıtmak</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Fikri Mülkiyet</h2>
            <p className="text-muted-foreground leading-relaxed">
              İçeriğinizin sahipliği size aittir. Hizmetimizi kullanarak, içeriğinizi barındırmak ve görüntülemek için
              bize lisans veriyorsunuz. CatalogPro platformu, şablonları ve markalaması bizim fikri mülkiyetimizdir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Sorumluluk Sınırlaması</h2>
            <p className="text-muted-foreground leading-relaxed">
              CatalogPro garanti olmaksızın "olduğu gibi" sunulmaktadır. Hizmeti kullanımınızdan kaynaklanan dolaylı,
              arızi veya sonuçsal zararlardan sorumlu değiliz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Şartlardaki Değişiklikler</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bu şartları zaman zaman güncelleyebiliriz. Önemli değişiklikler hakkında e-posta veya hizmet aracılığıyla
              sizi bilgilendireceğiz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. İletişim</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bu Şartlar hakkında sorularınız için{" "}
              <a href="mailto:hukuk@catalogpro.com" className="text-primary hover:underline">
                hukuk@catalogpro.com
              </a>{" "}
              adresinden bizimle iletişime geçin.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
