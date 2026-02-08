import { SEO_CONFIG } from "@/lib/seo"

export const metadata = SEO_CONFIG.auth

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
