import Link from "next/link"
import { Check } from "lucide-react"

import { Logo } from "@/components/ui/logo"
import type { TranslateFn } from "./types"

interface HeroPanelProps {
    t: TranslateFn
}

const FEATURE_KEYS = ["feature1", "feature2", "feature3", "feature4", "feature5"] as const

/** Giriş/kayıt ekranının sol paneli — public site ile aynı sade dil */
export function HeroPanel({ t }: HeroPanelProps) {
    return (
        <div className="relative hidden w-1/2 flex-col border-r border-border bg-muted/40 p-12 lg:flex">
            <Link href="/" className="inline-flex w-fit">
                <Logo size="lg" />
            </Link>

            <div className="flex max-w-md flex-1 flex-col justify-center">
                <h2 className="text-balance text-4xl font-semibold tracking-tight text-foreground">
                    {t("marketing.authHeroTitle")}
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t("landing.heroSubtitle")}</p>
                <ul className="mt-10 space-y-4">
                    {FEATURE_KEYS.map((key) => (
                        <li key={key} className="flex items-center gap-3 text-foreground">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                                <Check className="size-3.5 text-success" aria-hidden />
                            </span>
                            {t(`marketing.${key}`)}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
