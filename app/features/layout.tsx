import { SEO_CONFIG } from "@/lib/services/seo"

export const metadata = SEO_CONFIG.features

export default function FeaturesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
