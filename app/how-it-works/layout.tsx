import { SEO_CONFIG } from "@/lib/seo"

export const metadata = SEO_CONFIG.howItWorks

export default function HowItWorksLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
