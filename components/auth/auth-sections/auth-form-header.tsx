import Link from "next/link"

import { AuthBackLink } from "@/components/auth/auth-shell"
import { cn } from "@/lib/utils"
import type { AuthMode, TranslateFn } from "./types"
import { Logo } from "@/components/ui/logo"

interface AuthFormHeaderProps {
    mode: AuthMode
    t: TranslateFn
}

export function AuthFormBackButton({ t }: { t: TranslateFn }) {
    return <AuthBackLink href="/" label={t("auth.backToHome")} />
}

export function AuthFormHeader({ mode, t }: AuthFormHeaderProps) {
    return (
        <div className="mb-8 lg:mb-10 text-center lg:text-left">
            <div className="lg:hidden mb-6">
                <Link href="/" className="flex items-center justify-center">
                    <Logo size="xl" />
                </Link>
            </div>
            <h1 className={cn(
                "text-3xl lg:text-4xl font-semibold",
                "tracking-tight text-foreground mb-3"
            )}>
                {mode === 'signup'
                    ? (t("auth.signup"))
                    : mode === 'forgot-password'
                        ? (t("auth.forgotPasswordTitle"))
                        : (t("auth.welcomeBack"))
                }
            </h1>
            <p className="text-muted-foreground text-[15px] leading-relaxed">
                {mode === 'signup'
                    ? (t("auth.signupDesc"))
                    : mode === 'forgot-password'
                        ? (t("auth.forgotPasswordSubtitle"))
                        : (t("auth.signinDesc"))
                }
            </p>
        </div>
    )
}

