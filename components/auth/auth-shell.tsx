import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"

export function AuthBackLink({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="group absolute left-4 top-4 z-20 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:left-6 sm:top-6"
        >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            <span>{label}</span>
        </Link>
    )
}

const ICON_TONES = {
    brand: "bg-brand-soft text-brand",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning-soft-foreground",
    muted: "bg-muted text-foreground",
} as const

interface AuthShellProps {
    title: ReactNode
    description?: ReactNode
    icon?: ReactNode
    iconTone?: keyof typeof ICON_TONES
    back?: { href: string; label: string }
    children?: ReactNode
}

/** Şifre sıfırlama, e-posta doğrulama, hata gibi tek amaçlı auth sayfalarının kabuğu */
export function AuthShell({ title, description, icon, iconTone = "muted", back, children }: AuthShellProps) {
    return (
        <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-background px-4 py-16">
            {back && <AuthBackLink href={back.href} label={back.label} />}

            <div className="relative z-10 w-full max-w-[400px]">
                <Link href="/" className="mx-auto mb-10 flex w-fit items-center transition-opacity hover:opacity-80">
                    <Logo size="lg" />
                </Link>

                <div className="mb-8 text-center">
                    {icon && (
                        <div className={cn("mx-auto mb-5 flex size-12 items-center justify-center rounded-xl [&_svg]:size-6", ICON_TONES[iconTone])}>
                            {icon}
                        </div>
                    )}
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
                    {description && <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
                </div>

                {children}
            </div>
        </main>
    )
}
