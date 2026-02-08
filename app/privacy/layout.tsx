import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
    title: "Privacy Policy | Gizlilik Politikası",
    description: "FogCatalog privacy policy, data security and GDRP compliance information.",
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
