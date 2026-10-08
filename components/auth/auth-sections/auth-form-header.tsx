import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AuthMode, TranslateFn } from "./types"
import { Logo } from "@/components/ui/logo"

interface AuthFormHeaderProps {
    mode: AuthMode
    t: TranslateFn
}

export function AuthFormBackButton({ t }: { t: TranslateFn }) {
    return (
        <div className="absolute top-6 left-6 z-20">
            <Link
                href="/"
                className={cn(
                    "group flex items-center gap-2 text-sm font-medium",
                    "text-muted-foreground hover:text-primary transition-colors"
                )}
            >
                <div className={cn(
                    "w-8 h-8 rounded-full border border-border",
                    "flex items-center justify-center",
                    "group-hover:border-primary group-hover:bg-accent",
                    "transition-all bg-background/80 backdrop-blur-sm"
                )}>
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                </div>
                <span className="hidden sm:inline">{t("auth.backToHome")}</span>
            </Link>
        </div>
    )
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

export function BackgroundDecorations() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <svg
                className="absolute -top-1 left-0 w-full h-56"
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#a855f7" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#d946ef" stopOpacity="0.2" />
                    </linearGradient>
                </defs>
                <path
                    fill="url(#waveGradient)"
                    d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
                />
            </svg>
            <div className="absolute top-20 right-6 w-24 h-24 rounded-full border-[3px] border-border/60" />
        </div>
    )
}
