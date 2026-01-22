import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Giriş Yap | FogCatalog - Hesabınıza Erişin",
    description: "FogCatalog hesabınıza giriş yapın veya ücretsiz hesap oluşturun. Google ile hızlı giriş yapabilirsiniz.",
    robots: "noindex, nofollow", // Auth sayfaları indexlenmemeli
    openGraph: {
        title: "Giriş Yap | FogCatalog",
        description: "Hesabınıza giriş yapın veya ücretsiz kaydolun.",
        type: "website",
        locale: "tr_TR",
    },
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
