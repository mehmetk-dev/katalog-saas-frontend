"use client"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { LegalDocument } from "@/components/marketing"
import { FileText } from "lucide-react"

export function CancellationContent() {
    const { t } = useTranslation()

    return (
        <LegalDocument header={<PublicHeader />} footer={<PublicFooter />} title={t("legal.cancellationPolicy.title")} meta={<>{t("legal.effectiveDateLabel")}: 25.01.2026</>}>


                {/* Summary */}
                <div className="bg-muted border border-border rounded-xl p-7 not-italic font-normal text-left">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-base font-bold text-foreground">{t("legal.cancellationPolicy.summary.title")}</h2>
                    </div>
                    <ul className="space-y-2.5">
                        {(t("legal.cancellationPolicy.summary.items", { returnObjects: true }) as string[]).map((item, i) => (
                            <li key={i} className="flex gap-3 items-start">
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 shrink-0" />
                                <span className="text-foreground text-sm leading-relaxed">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 1. Refund Policy */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.cancellationPolicy.refundPolicy.title")}
                    </h2>
                    <p className="text-muted-foreground mb-4">
                        {t("legal.cancellationPolicy.refundPolicy.desc")}
                    </p>
                    <div >
                        <div className="p-4 bg-background border border-border border-l-2 border-l-foreground">
                            <strong className="block text-xs uppercase mb-2 text-foreground">{t("legal.cancellationPolicy.warning")}</strong>
                            <p className="text-xs text-muted-foreground">{t("legal.cancellationPolicy.refundPolicy.importantInfo")}</p>
                        </div>
                    </div>
                </section>

                {/* 2. Cancellation Process */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.cancellationPolicy.cancellationProcess.title")}
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        {t("legal.cancellationPolicy.cancellationProcess.desc")}
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 ">
                        <div className="bg-card p-4 border border-border">
                            <span className="block text-[10px] uppercase text-muted-foreground mb-2 font-bold tracking-widest">
                                {t("legal.cancellationPolicy.cancellationProcess.howTo.title")}
                            </span>
                            <p className="text-foreground">
                                {t("legal.cancellationPolicy.cancellationProcess.howTo.desc")}
                            </p>
                        </div>
                        <div className="bg-card p-4 border border-border">
                            <span className="block text-[10px] uppercase text-muted-foreground mb-2 font-bold tracking-widest">
                                {t("legal.cancellationPolicy.cancellationProcess.rights.title")}
                            </span>
                            <p className="text-foreground">
                                {t("legal.cancellationPolicy.cancellationProcess.rights.desc")}
                            </p>
                        </div>
                        <div className="bg-card p-4 border border-border">
                            <span className="block text-[10px] uppercase text-muted-foreground mb-2 font-bold tracking-widest">
                                {t("legal.cancellationPolicy.cancellationProcess.expiry.title")}
                            </span>
                            <p className="text-foreground">
                                {t("legal.cancellationPolicy.cancellationProcess.expiry.desc")}
                            </p>
                        </div>
                        <div className="bg-card p-4 border border-border">
                            <span className="block text-[10px] uppercase text-muted-foreground mb-2 font-bold tracking-widest">
                                {t("legal.cancellationPolicy.cancellationProcess.data.title")}
                            </span>
                            <p className="text-foreground">
                                {t("legal.cancellationPolicy.cancellationProcess.data.desc")}
                            </p>
                        </div>
                    </div>
                </section>

                {/* 3. Exceptions */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.cancellationPolicy.exceptions.title")}
                    </h2>
                    <p className="text-muted-foreground ">
                        {t("legal.cancellationPolicy.exceptions.desc")}
                    </p>
                </section>
        </LegalDocument>
    )
}
