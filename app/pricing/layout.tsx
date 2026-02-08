import { SEO_CONFIG } from "@/lib/seo"

export const metadata = SEO_CONFIG.pricing

export default function PricingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
