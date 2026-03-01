import { SEO_CONFIG } from "@/lib/services/seo"
import Script from "next/script"

export const metadata = SEO_CONFIG.faq

// FAQ Schema for SEO (Google Rich Results)
const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'FogCatalog tam olarak nedir ve işletmeme nasıl değer katar?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'FogCatalog, klasik PDF katalogların hantallığını ortadan kaldıran yeni nesil bir SaaS çözümüdür. Ürünlerinizi saniyeler içinde dijital, güncellenebilir ve etkileşimli bir mikrositeye dönüştürür. Müşterileriniz ürünleri incelerken tek tıkla WhatsApp üzerinden sipariş verebilir, bu da satış dönüşüm oranlarınızı (conversion rate) ciddi ölçüde artırır.'
            }
        },
        {
            '@type': 'Question',
            name: 'Ücretsiz planda herhangi bir süre sınırı var mı?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Hayır, Starter paketimiz tamamen ücretsizdir ve sonsuza kadar kullanabilirsiniz. Deneme süresi bitince otomatik ödeme alma gibi sürprizler yoktur. İşletmeniz büyüdüğünde dilediğiniz zaman üst paketlere geçiş yapabilirsiniz.'
            }
        },
        {
            '@type': 'Question',
            name: 'Toplu ürün yükleme yapabilir miyim?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Evet! Yüzlerce ürün fotoğrafını sürükle-bırak yöntemiyle tek seferde yükleyebilirsiniz. Akıllı sistemimiz, görsel isimlerinden ürün adlarını otomatik olarak oluşturmaya çalışır, size sadece fiyatları ve detayları girmek kalır.'
            }
        },
        {
            '@type': 'Question',
            name: 'WhatsApp sipariş butonu nasıl çalışır?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Müşteriniz kataloğunuzda beğendiği ürünleri sepete ekler ve Siparişi Tamamla butonuna bastığında, sistem otomatik olarak sipariş detaylarını içeren hazır bir WhatsApp mesajı oluşturur. Bu mesaj, tanımladığınız işletme WhatsApp hattına yönlendirilir.'
            }
        },
        {
            '@type': 'Question',
            name: 'QR kodum değişecek mi?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Hayır. Size özel oluşturulan QR kod Statik değil Dinamik bir yapıdadır. Yani kataloğunuzun içeriğini, fiyatlarını veya resimlerini ne kadar değiştirirseniz değiştirin, QR kodunuz her zaman aynı kalır ve güncel kataloğunuza yönlendirir.'
            }
        },
        {
            '@type': 'Question',
            name: 'Fatura kesiyor musunuz? KDV dahil mi?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Tüm fiyatlarımız KDV hariçtir. Ödemeniz başarıyla alındıktan sonra, şirket bilgilerinizle oluşturulan yasal e-faturanız (KDV dahil tutar üzerinden) sistemde kayıtlı e-posta adresinize otomatik olarak gönderilir.'
            }
        }
    ]
}

export default function FAQLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <Script
                id="faq-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            {children}
        </>
    )
}

