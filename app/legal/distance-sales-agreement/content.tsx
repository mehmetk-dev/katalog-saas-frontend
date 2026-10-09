"use client"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { LegalDocument } from "@/components/marketing"
import { AlertTriangle, Check, FileText } from "lucide-react"

export function DistanceSalesContent() {
    const { t } = useTranslation()
    const sellerAddressRaw = t("legal.distanceSales.parties.seller.address")
    const sellerAddressSafe = String(sellerAddressRaw)
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]*>/g, "")

    return (
        <LegalDocument header={<PublicHeader />} footer={<PublicFooter />} title={t("legal.distanceSales.title")} meta={<>{t("legal.distanceSales.effectiveDateLabel")} {t("legal.distanceSales.effectiveDate")}</>}>


                {/* Özet Kutusu */}
                <div className="bg-muted border border-border rounded-xl p-7 not-italic font-normal text-left">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-base font-bold text-foreground">{t("legal.distanceSales.summary.title")}</h2>
                    </div>
                    <ul className="space-y-2.5">
                        {(t("legal.distanceSales.summary.items", { returnObjects: true }) as string[]).map((item, i) => (
                            <li key={i} className="flex gap-3 items-start">
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 shrink-0" />
                                <span className="text-foreground text-sm leading-relaxed">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 1. Taraflar / Parties */}
                <section>
                    <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                        {t("legal.distanceSales.parties.title")}
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="mb-4 border-b border-border pb-2 text-sm font-semibold text-foreground">
                                {t("legal.distanceSales.parties.seller.title")}
                            </h3>
                            <div className="space-y-2 text-muted-foreground text-xs">
                                <div className="flex justify-between border-b border-dashed border-border pb-1">
                                    <span className="text-muted-foreground">{t("legal.distanceSales.parties.seller.nameLabel")}</span>
                                    <span className="font-medium text-right">{t("legal.distanceSales.parties.seller.name")}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-border pb-1">
                                    <span className="text-muted-foreground">{t("legal.distanceSales.parties.seller.taxOfficeLabel")}</span>
                                    <span className="font-medium text-right">{t("legal.distanceSales.parties.seller.taxOffice")}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-border pb-1">
                                    <span className="text-muted-foreground">{t("legal.distanceSales.parties.seller.emailLabel")}</span>
                                    <span className="font-medium text-right">{t("legal.distanceSales.parties.seller.email")}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-border pb-1">
                                    <span className="text-muted-foreground">{t("legal.distanceSales.parties.seller.phoneLabel")}</span>
                                    <span className="font-medium text-right">{t("legal.distanceSales.parties.seller.phone")}</span>
                                </div>
                                <div className="pt-2 text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                                    {sellerAddressSafe}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="mb-4 border-b border-border pb-2 text-sm font-semibold text-foreground">
                                {t("legal.distanceSales.parties.buyer.title")}
                            </h3>
                            <div className="space-y-1 text-muted-foreground">
                                <span className="block text-xs font-medium text-muted-foreground">
                                    {t("legal.distanceSales.parties.buyer.scope")}
                                </span>
                                <div>
                                    <p>
                                        {t("legal.distanceSales.parties.buyer.desc")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Konu / Subject */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.distanceSales.subject.title")}
                    </h2>
                    <p className="text-muted-foreground">
                        {t("legal.distanceSales.subject.desc")}
                    </p>
                </section>

                {/* 3. Hizmet Detayları / Service Details */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.distanceSales.service.title")}
                    </h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-border bg-card p-4">
                            <span className="mb-1 block text-xs font-medium text-muted-foreground">
                                {t("legal.distanceSales.service.item1.label")}
                            </span>
                            <p className="text-foreground">
                                {t("legal.distanceSales.service.item1.desc")}
                            </p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                            <span className="mb-1 block text-xs font-medium text-muted-foreground">
                                {t("legal.distanceSales.service.item2.label")}
                            </span>
                            <p className="text-foreground">
                                {t("legal.distanceSales.service.item2.desc")}
                            </p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                            <span className="mb-1 block text-xs font-medium text-muted-foreground">
                                {t("legal.distanceSales.service.item3.label")}
                            </span>
                            <p className="text-foreground">
                                {t("legal.distanceSales.service.item3.desc")}
                            </p>
                        </div>
                    </div>
                </section>

                {/* 4. Genel Hükümler / General Provisions */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.distanceSales.general.title")}
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                        <div className="flex gap-3">
                            <span className="font-bold text-foreground min-w-[24px]">4.1.</span>
                            <p>
                                {t("legal.distanceSales.general.item1")}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-foreground min-w-[24px]">4.2.</span>
                            <p>
                                {t("legal.distanceSales.general.item2")}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-foreground min-w-[24px]">4.3.</span>
                            <p>
                                {t("legal.distanceSales.general.item3")}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-foreground min-w-[24px]">4.4.</span>
                            <p>
                                {t("legal.distanceSales.general.item4")}
                            </p>
                        </div>
                    </div>
                </section>

                {/* 5. Cayma Hakkı / Right of Withdrawal */}
                <section className="rounded-xl border border-warning/40 bg-warning-soft p-6 sm:p-8">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight text-warning-soft-foreground">
                        <AlertTriangle className="size-5 shrink-0" />
                        {t("legal.distanceSales.withdrawal.title")}
                    </h2>
                    <div className="space-y-4 text-sm text-foreground">
                        <div className="flex gap-3">
                            <span className="min-w-[24px] font-bold text-warning-soft-foreground">5.1.</span>
                            <p>
                                {t("legal.distanceSales.withdrawal.item1Part1")}
                                <strong>
                                    {t("legal.distanceSales.withdrawal.item1Strong")}
                                </strong>
                                {t("legal.distanceSales.withdrawal.item1Part2")}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <span className="min-w-[24px] font-bold text-warning-soft-foreground">5.2.</span>
                            <p>
                                {t("legal.distanceSales.withdrawal.item2Part1")}
                                <strong className="font-semibold text-warning-soft-foreground">
                                    {t("legal.distanceSales.withdrawal.item2Badge")}
                                </strong>
                                {t("legal.distanceSales.withdrawal.item2Part2")}
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <span className="min-w-[24px] font-bold text-warning-soft-foreground">5.3.</span>
                            <div>
                                <strong>{t("legal.distanceSales.withdrawal.item3Label")}</strong>
                                {t("legal.distanceSales.withdrawal.item3Desc")}
                                <ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">
                                    <li>{t("legal.distanceSales.withdrawal.list1")}</li>
                                    <li>{t("legal.distanceSales.withdrawal.list2")}</li>
                                    <li>{t("legal.distanceSales.withdrawal.list3")}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-12 md:grid-cols-2">
                    {/* 6. Gizlilik ve KVKK / Privacy */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.distanceSales.privacy.title")}
                        </h2>
                        <p className="text-muted-foreground">
                            {t("legal.distanceSales.privacy.desc")}
                        </p>
                    </section>

                    {/* 7. Yetkili Mahkeme / Jurisdiction */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.distanceSales.jurisdiction.title")}
                        </h2>
                        <div>
                            <p className="mb-3 text-muted-foreground">
                                {t("legal.distanceSales.jurisdiction.desc")}
                            </p>
                            <div className="rounded-xl border border-border bg-card py-3 text-center font-semibold text-foreground">
                                {t("legal.distanceSales.jurisdiction.court")}
                                <div className="mt-1 text-xs font-normal text-muted-foreground">
                                    {t("legal.distanceSales.jurisdiction.office")}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* 8. Yürürlük / Enforcement */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
{t("legal.distanceSales.enforcement.title")}
                    </h2>
                    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-soft text-success-soft-foreground">
                            <Check className="size-4" strokeWidth={3} />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                            {t("legal.distanceSales.enforcement.desc")}
                        </p>
                    </div>
                </section>
        </LegalDocument>
    )
}
