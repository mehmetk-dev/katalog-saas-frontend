import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Demo Oluştur | FogCatalog",
    description:
        "FogCatalog ile hemen ücretsiz demo katalog oluşturun. Kayıt gerektirmez, saniyeler içinde profesyonel dijital kataloğunuzu deneyimleyin.",
    robots: { index: true, follow: true },
}

export default function CreateDemoLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
