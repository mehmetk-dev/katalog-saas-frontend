"use client"

import { AlertTriangle, Power, CheckCircle2, Clock, FileText } from "lucide-react"
import { useTranslation } from "@/lib/i18n-provider"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { cn } from "@/lib/utils"

function StepCard({ icon, iconColor, titleKey, descKey, t }: {
    icon: React.ReactNode
    iconColor: string
    titleKey: string
    descKey: string
    t: (key: string) => string
}) {
    return (
        <div className={cn(
            "bg-slate-50 p-6 rounded-lg border border-slate-100",
            "hover:border-blue-100 transition-colors"
        )}>
            <div className={cn(
                "w-8 h-8 bg-white rounded-full flex items-center justify-center",
                "shadow-sm mb-3", iconColor
            )}>
                {icon}
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-2">
                {t(titleKey)}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
                {t(descKey)}
            </p>
        </div>
    )
}

export function CancellationContent() {
    const { t } = useTranslation()

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-[#1a1a1a]">
            <PublicHeader />

            <main className="flex-1 pt-32 pb-20 px-4 md:px-6">

                {/* Main Card Container - Slightly wider than A4 for a modern web look but constrained */}
                <div className="max-w-[800px] mx-auto bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">

                    {/* Header Section with Brand Accent */}
                    <div className="bg-slate-900 text-white p-8 md:p-12 relative overflow-hidden">
                        <div className={cn(
                            "absolute top-0 right-0 w-64 h-64 bg-slate-800",
                            "rounded-full mix-blend-multiply filter blur-3xl",
                            "opacity-20 -translate-y-1/2 translate-x-1/2"
                        )} />

                        <div className={cn(
                            "relative z-10 flex flex-col md:flex-row",
                            "md:items-end justify-between gap-6"
                        )}>
                            <div>
                                <div className={cn(
                                    "text-xs font-bold tracking-[0.3em]",
                                    "text-blue-400 mb-2 uppercase"
                                )}>
                                    FogCatalog
                                </div>
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                                    {t("legal.cancellationPolicy.title")}
                                </h1>
                            </div>
                            <div className="text-right">
                                <div className={cn(
                                    "text-[10px] font-mono text-slate-400",
                                    "border border-slate-700 px-3 py-1 rounded",
                                    "inline-block bg-slate-800/50"
                                )}>
                                    {t("legal.cancellationPolicy.ref")}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-8 md:p-12 space-y-12">

                        {/* 1. Refund Policy Section */}
                        <section>
                            <h2 className="text-lg font-bold text-slate-900 border-l-4 border-blue-600 pl-4 mb-6">
                                {t("legal.cancellationPolicy.refundPolicy.title")}
                            </h2>
                            <p className="text-sm text-slate-600 leading-relaxed mb-6">
                                {t("legal.cancellationPolicy.refundPolicy.desc")}
                            </p>

                            {/* Important Info Box */}
                            <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-lg">
                                <div className="flex items-start gap-3">
                                    <div className="shrink-0 text-amber-500 mt-0.5">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className={cn(
                                            "text-xs font-bold text-amber-800",
                                            "uppercase tracking-wider mb-1"
                                        )}>
                                            {t("legal.cancellationPolicy.warning")}
                                        </h3>
                                        <p className="text-xs text-amber-900/80 leading-relaxed">
                                            {t("legal.cancellationPolicy.refundPolicy.importantInfo")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. Cancellation Process Section */}
                        <section>
                            <h2 className="text-lg font-bold text-slate-900 border-l-4 border-blue-600 pl-4 mb-6">
                                {t("legal.cancellationPolicy.cancellationProcess.title")}
                            </h2>
                            <p className="text-sm text-slate-600 mb-8">
                                {t("legal.cancellationPolicy.cancellationProcess.desc")}
                            </p>

                            <div className="grid md:grid-cols-2 gap-6">
                                <StepCard
                                    icon={<Power className="w-4 h-4" />}
                                    iconColor="text-blue-600"
                                    titleKey="legal.cancellationPolicy.cancellationProcess.howTo.title"
                                    descKey="legal.cancellationPolicy.cancellationProcess.howTo.desc"
                                    t={t}
                                />
                                <StepCard
                                    icon={<CheckCircle2 className="w-4 h-4" />}
                                    iconColor="text-emerald-600"
                                    titleKey="legal.cancellationPolicy.cancellationProcess.rights.title"
                                    descKey="legal.cancellationPolicy.cancellationProcess.rights.desc"
                                    t={t}
                                />
                                <StepCard
                                    icon={<Clock className="w-4 h-4" />}
                                    iconColor="text-slate-600"
                                    titleKey="legal.cancellationPolicy.cancellationProcess.expiry.title"
                                    descKey="legal.cancellationPolicy.cancellationProcess.expiry.desc"
                                    t={t}
                                />
                                <StepCard
                                    icon={<FileText className="w-4 h-4" />}
                                    iconColor="text-slate-600"
                                    titleKey="legal.cancellationPolicy.cancellationProcess.data.title"
                                    descKey="legal.cancellationPolicy.cancellationProcess.data.desc"
                                    t={t}
                                />
                            </div>
                        </section>

                        {/* 3. Exceptions Section */}
                        <section>
                            <h2 className="text-lg font-bold text-slate-900 border-l-4 border-blue-600 pl-4 mb-6">
                                {t("legal.cancellationPolicy.exceptions.title")}
                            </h2>
                            <div className="bg-white border border-dashed border-slate-300 rounded-lg p-6">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {t("legal.cancellationPolicy.exceptions.desc")}
                                </p>
                            </div>
                        </section>

                    </div>

                    {/* Footer Strip */}
                    <div className={cn(
                        "bg-slate-50 border-t border-slate-100 p-6",
                        "text-center text-[10px] text-slate-400",
                        "font-mono uppercase tracking-widest"
                    )}>
                        FOGCATALOG &bull; LEGAL DEPARTMENT
                    </div>

                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
