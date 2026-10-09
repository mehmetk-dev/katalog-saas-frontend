import Script from "next/script"

import { SEO_CONFIG } from "@/lib/services/seo"
import { translations } from "@/lib/translations"

export const metadata = SEO_CONFIG.faq

// FAQ Schema for SEO (Google Rich Results) — sayfada gösterilen Türkçe soru/cevaplardan üretilir,
// böylece arama sonuçlarında sayfayla çelişen bilgi çıkmaz.
const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: Object.values(translations.tr.faqPage.items).flat().map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
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
