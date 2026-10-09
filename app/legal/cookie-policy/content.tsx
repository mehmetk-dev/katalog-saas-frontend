"use client"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { LegalDocument } from "@/components/marketing"
import { FileText } from "lucide-react"

export function CookiePolicyContent() {
    const { t } = useTranslation()

    return (
        <LegalDocument header={<PublicHeader />} footer={<PublicFooter />} title={t("legal.cookiePolicy.title")} meta={<>{t("legal.effectiveDateLabel")}: 25.01.2026</>}>


                <p className="text-muted-foreground mb-6">
                    {t("legal.cookiePolicy.intro")}
                </p>

                {/* Summary */}
                <div className="bg-muted border border-border rounded-xl p-7 not-italic font-normal text-left">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-base font-bold text-foreground">{t("legal.cookiePolicy.summary.title")}</h2>
                    </div>
                    <ul className="space-y-2.5">
                        {(t("legal.cookiePolicy.summary.items", { returnObjects: true }) as string[]).map((item, i) => (
                            <li key={i} className="flex gap-3 items-start">
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 shrink-0" />
                                <span className="text-foreground text-sm leading-relaxed">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 1. What Is Cookie */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.cookiePolicy.whatIsCookie.title")}
                    </h2>
                    <p className="text-muted-foreground ">
                        {t("legal.cookiePolicy.whatIsCookie.desc")}
                    </p>
                </section>

                {/* 2. Types Of Cookies */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.cookiePolicy.types.title")}
                    </h2>

                    <div className="grid md:grid-cols-3 gap-4 ">
                        <div className="bg-card p-4 border border-border">
                            <span className="block text-[10px] uppercase text-muted-foreground mb-2 font-bold tracking-widest">
                                {t("legal.cookiePolicy.types.mandatory.label")}
                            </span>
                            <p className="text-foreground">
                                {t("legal.cookiePolicy.types.mandatory.desc")}
                            </p>
                        </div>
                        <div className="bg-card p-4 border border-border">
                            <span className="block text-[10px] uppercase text-muted-foreground mb-2 font-bold tracking-widest">
                                {t("legal.cookiePolicy.types.analytic.label")}
                            </span>
                            <p className="text-foreground">
                                {t("legal.cookiePolicy.types.analytic.desc")}
                            </p>
                        </div>
                        <div className="bg-card p-4 border border-border">
                            <span className="block text-[10px] uppercase text-muted-foreground mb-2 font-bold tracking-widest">
                                {t("legal.cookiePolicy.types.functional.label")}
                            </span>
                            <p className="text-foreground">
                                {t("legal.cookiePolicy.types.functional.desc")}
                            </p>
                        </div>
                    </div>
                </section>

                {/* 3. Management */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.cookiePolicy.management.title")}
                    </h2>
                    <div className="space-y-4">
                        <p className="text-muted-foreground">
                            {t("legal.cookiePolicy.management.desc")}
                        </p>
                        <p className="text-muted-foreground font-medium">
                            {t("legal.cookiePolicy.management.instruction")}
                        </p>
                        <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                            {(t("legal.cookiePolicy.management.browsers", { returnObjects: true }) as Array<{ name: string; path: string }>).map((browser, i) => (
                                <li key={i}>
                                    <strong>{browser.name}:</strong> <span className="text-muted-foreground">{browser.path}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* 4. Contact */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.cookiePolicy.contact.title")}
                    </h2>
                    <p className="text-muted-foreground ">
                        {t("legal.cookiePolicy.contact.desc")}
                    </p>
                </section>
        </LegalDocument>
    )
}
