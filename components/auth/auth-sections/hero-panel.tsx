import Link from "next/link"
import NextImage from "next/image"
import { CheckCircle2 } from "lucide-react"
import type { TranslateFn } from "./types"

interface HeroPanelProps {
    t: TranslateFn
}

export function HeroPanel({ t }: HeroPanelProps) {
    return (
        <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col p-12 text-white">
            <div className="absolute inset-0 z-0">
                <NextImage
                    src="/auth-hero-bg.webp"
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
                <div className="absolute inset-0 bg-violet-900/20 mix-blend-overlay" />
            </div>

            <div className="relative z-20">
                <Link href="/" className="flex items-center group">
                    <span className="font-montserrat text-3xl tracking-tighter flex items-center">
                        <span className="font-black text-[#cf1414] uppercase">Fog</span>
                        <span className="font-light text-white">Catalog</span>
                    </span>
                </Link>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
                <h2 className="text-4xl font-bold tracking-tight mb-4 leading-tight">
                    {t('marketing.authHeroTitle')}
                </h2>
                <p className="text-lg text-white/70 mb-10 leading-relaxed">
                    {t('landing.heroSubtitle')}
                </p>
                <ul className="space-y-5">
                    {[
                        t('marketing.feature1'),
                        t('marketing.feature2'),
                        t('marketing.feature3'),
                        t('marketing.feature4'),
                        t('marketing.feature5')
                    ].map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-white/90">
                            <div className="w-6 h-6 rounded-full bg-[#cf1414] flex items-center justify-center shadow-lg shadow-red-900/20">
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="font-medium text-[17px]">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
