import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Fiyatlandırma | FogCatalog - Ürün Katalog Oluşturucu",
    description: "FogCatalog fiyatlandırma planlarını inceleyin. Ücretsiz, Plus ve Pro planlar arasından işletmenize uygun olanı seçin. Sınırsız katalog ve ürün ekleme imkanı.",
    keywords: ["katalog fiyatlandırma", "FogCatalog fiyat", "dijital katalog ücreti", "e-ticaret katalog fiyat"],
    openGraph: {
        title: "Fiyatlandırma | FogCatalog",
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
