import { generateSEO } from "@/lib/services/seo"

export const metadata = generateSEO({
    title: "Privacy Policy | Gizlilik Politikası",
    description: "FogCatalog privacy policy, data security and GDPR compliance information.",
    url: "/privacy",
    keywords: ["gizlilik politikası", "privacy policy", "data protection", "KVKK"]
})

export default function PrivacyLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
