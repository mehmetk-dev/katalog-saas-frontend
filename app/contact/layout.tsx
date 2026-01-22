import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "İletişim | FogCatalog - Bize Ulaşın",
    description: "FogCatalog ekibi ile iletişime geçin. Sorularınız, önerileriniz veya destek talepleriniz için 7/24 yanıtlıyoruz. E-posta: destek@fogcatalog.app",
    keywords: ["FogCatalog iletişim", "katalog destek", "müşteri hizmetleri", "teknik destek"],
    openGraph: {
        title: "İletişim | FogCatalog",
        description: "Sorularınız için bize ulaşın. 24 saat içinde yanıt garantisi.",
        type: "website",
        locale: "tr_TR",
    },
    alternates: {
        canonical: "/contact",
    },
}

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
