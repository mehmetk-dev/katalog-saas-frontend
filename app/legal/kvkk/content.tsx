"use client"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { LegalDocument } from "@/components/marketing"
import { Shield } from "lucide-react"

export function KvkkContent() {
    const { t } = useTranslation()

    return (
        <LegalDocument header={<PublicHeader />} footer={<PublicFooter />} title={t("legal.kvkk.title")} meta={<>{t("legal.effectiveDateLabel")}: 25.01.2026</>}>


                {/* Summary */}
                <div className="bg-muted border border-border rounded-xl p-7 not-italic font-normal text-left">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-base font-bold text-foreground">{t("legal.kvkk.summary.title")}</h2>
                    </div>
                    <ul className="space-y-2.5">
                        {(t("legal.kvkk.summary.items", { returnObjects: true }) as string[]).map((item, i) => (
                            <li key={i} className="flex gap-3 items-start">
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 shrink-0" />
                                <span className="text-foreground text-sm leading-relaxed">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 1. Controller */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.kvkk.controller.title")}
                    </h2>
                    <p className="text-muted-foreground ">
                        {t("legal.kvkk.controller.desc")}
                    </p>
                </section>

                {/* 2. Processed Data */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.kvkk.processedData.title")}
                    </h2>
                    <p className="text-muted-foreground mb-4">
                        {t("legal.kvkk.processedData.desc")}
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 ">
                        <div className="rounded-xl border border-border bg-card p-4">
                            <span className="mb-1 block text-xs font-medium text-muted-foreground">
                                {t("legal.kvkk.processedData.identity.label")}
                            </span>
                            <p className="text-foreground">
                                {t("legal.kvkk.processedData.identity.items")}
                            </p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                            <span className="mb-1 block text-xs font-medium text-muted-foreground">
                                {t("legal.kvkk.processedData.contact.label")}
                            </span>
                            <p className="text-foreground">
                                {t("legal.kvkk.processedData.contact.items")}
                            </p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                            <span className="mb-1 block text-xs font-medium text-muted-foreground">
                                {t("legal.kvkk.processedData.transaction.label")}
                            </span>
                            <p className="text-foreground">
                                {t("legal.kvkk.processedData.transaction.items")}
                            </p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                            <span className="mb-1 block text-xs font-medium text-muted-foreground">
                                {t("legal.kvkk.processedData.security.label")}
                            </span>
                            <p className="text-foreground">
                                {t("legal.kvkk.processedData.security.items")}
                            </p>
                        </div>
                    </div>
                </section>

                {/* 3. Purposes */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.kvkk.purposes.title")}
                    </h2>
                    <div className="space-y-4">
                        <p className="text-muted-foreground">
                            {t("legal.kvkk.purposes.desc")}
                        </p>
                        <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                            {(t("legal.kvkk.purposes.items", { returnObjects: true }) as string[]).map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* 4. Transfer */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.kvkk.transfer.title")}
                    </h2>
                    <div className="space-y-4">
                        <p className="text-muted-foreground">
                            {t("legal.kvkk.transfer.desc")}
                        </p>
                        <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                            {(t("legal.kvkk.transfer.items", { returnObjects: true }) as Array<{ label: string; text: string }>).map((item, i) => (
                                <li key={i}>
                                    <strong>{item.label}</strong> {item.text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* 5. Collection */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.kvkk.collection.title")}
                    </h2>
                    <div className="space-y-4">
                        <p className="text-muted-foreground">
                            {t("legal.kvkk.collection.desc")}
                        </p>
                        <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                            {(t("legal.kvkk.collection.reasons", { returnObjects: true }) as string[]).map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                        <p className="text-muted-foreground">
                            {t("legal.kvkk.collection.footer")}
                        </p>
                    </div>
                </section>

                {/* 6. Rights */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.kvkk.rights.title")}
                    </h2>
                    <div className="space-y-4">
                        <p className="text-muted-foreground">
                            {t("legal.kvkk.rights.desc")}
                        </p>
                        <div className="rounded-xl border border-border bg-muted/40 p-4">
                            <p className="text-foreground font-medium">
                                {t("legal.kvkk.rights.contact")}
                            </p>
                        </div>
                    </div>
                </section>
        </LegalDocument>
    )
}
