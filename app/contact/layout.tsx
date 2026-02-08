import { SEO_CONFIG } from "@/lib/seo"

export const metadata = SEO_CONFIG.contact

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
