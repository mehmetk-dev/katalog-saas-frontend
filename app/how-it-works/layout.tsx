import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Nasıl Çalışır? | FogCatalog - 3 Adımda Katalog Oluşturun",
    description: "FogCatalog ile 3 adımda profesyonel ürün katalogları oluşturun. Ürünlerinizi ekleyin, şablon seçin ve paylaşın. Dakikalar içinde hazır!",
    keywords: ["katalog nasıl oluşturulur", "dijital katalog yapımı", "ürün kataloğu hazırlama", "FogCatalog kullanımı"],
    openGraph: {
        title: "Nasıl Çalışır? | FogCatalog",
        description: "3 adımda profesyonel katalog oluşturun: Ürün ekle, şablon seç, paylaş!",
        type: "website",
        locale: "tr_TR",
    },
    alternates: {
        canonical: "/how-it-works",
    },
}

export default function HowItWorksLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
