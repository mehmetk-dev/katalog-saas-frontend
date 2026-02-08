import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
    title: "Terms of Service | Kullanım Koşulları",
    description: "FogCatalog user agreement and terms of service.",
    url: "/terms",
    keywords: ["kullanım koşulları", "terms of service", "user agreement"]
})

export default function TermsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
