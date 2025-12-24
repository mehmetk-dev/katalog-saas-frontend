import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Fiyatlandırma | CatalogPro - Ürün Katalog Oluşturucu",
    description: "CatalogPro fiyatlandırma planlarını inceleyin. Ücretsiz, Plus ve Pro planlar arasından işletmenize uygun olanı seçin. Sınırsız katalog ve ürün ekleme imkanı.",
    keywords: ["katalog fiyatlandırma", "CatalogPro fiyat", "dijital katalog ücreti", "e-ticaret katalog fiyat"],
    openGraph: {
        title: "Fiyatlandırma | CatalogPro",
        description: "İşletmenize uygun planı seçin. Ücretsiz başlayın, ihtiyacınıza göre yükseltin.",
        type: "website",
        locale: "tr_TR",
    },
    alternates: {
        canonical: "/pricing",
    },
}

export default function PricingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
