"use client"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { FileText } from "lucide-react"

export function DistanceSalesContent() {
    const { t } = useTranslation()
    const sellerAddressRaw = t("legal.distanceSales.parties.seller.address")
    const sellerAddressSafe = String(sellerAddressRaw)
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]*>/g, "")

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
            <PublicHeader />

            <main className="flex-1 pt-32 pb-20 px-4 md:px-6">
                {/* Paper / Catalog Container */}
                <div className="max-w-[794px] mx-auto bg-white shadow-2xl min-h-[1123px] relative flex flex-col transform transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]">

                    {/* Catalog Header Style */}
                    <div className="h-[80px] px-8 md:px-12 border-b border-[#f0f0f0] flex items-center justify-between shrink-0 bg-white">
                        <div className="text-[10px] tracking-[0.4em] text-[#a0a0a0] uppercase font-medium">
                            FOGCATALOG
                        </div>
                        <div className="text-[10px] font-mono text-[#d0d0d0]">
                            {t("legal.distanceSales.ref")}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 px-8 md:px-12 py-12 md:py-16">

                        {/* Document Title */}
                        <div className="text-center mb-16">
                            <h1 className="text-xl md:text-2xl font-light tracking-[0.3em] text-black uppercase mb-6">
                                {t("legal.distanceSales.title")}
                            </h1>
                            <div className="w-12 h-[1px] bg-black mx-auto mb-6"></div>
                            <p className="text-[10px] tracking-widest text-[#888] uppercase">
                                {t("legal.distanceSales.effectiveDateLabel")} {t("legal.distanceSales.effectiveDate")}
                            </p>
                        </div>

                        {/* Contract Text */}
                        <div className="space-y-12 text-[#333] text-[13px] leading-relaxed font-light text-justify">

                            {/* Özet Kutusu */}
                            <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 rounded-xl p-7 not-italic font-normal text-left">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileText className="w-5 h-5 text-slate-600" />
                                    <h2 className="text-base font-bold text-slate-900">{t("legal.distanceSales.summary.title")}</h2>
                                </div>
                                <ul className="space-y-2.5">
                                    {(t("legal.distanceSales.summary.items", { returnObjects: true }) as string[]).map((item, i) => (
                                        <li key={i} className="flex gap-3 items-start">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-2 shrink-0" />
                                            <span className="text-slate-700 text-sm leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* 1. Taraflar / Parties */}
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-3 text-black">
                                    <span className="w-4 h-[1px] bg-black"></span>
                                    {t("legal.distanceSales.parties.title")}
                                </h2>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="p-6 bg-[#fafafa] border border-[#f0f0f0]">
                                        <h3 className="font-bold tracking-wider text-black text-xs mb-4 uppercase text-center border-b border-[#e5e5e5] pb-2">
                                            {t("legal.distanceSales.parties.seller.title")}
                                        </h3>
                                        <div className="space-y-2 text-[#555] text-xs">
                                            <div className="flex justify-between border-b border-dashed border-[#e0e0e0] pb-1">
                                                <span className="text-[#999]">{t("legal.distanceSales.parties.seller.nameLabel")}</span>
                                                <span className="font-medium text-right">{t("legal.distanceSales.parties.seller.name")}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-dashed border-[#e0e0e0] pb-1">
                                                <span className="text-[#999]">{t("legal.distanceSales.parties.seller.taxOfficeLabel")}</span>
                                                <span className="font-medium text-right">{t("legal.distanceSales.parties.seller.taxOffice")}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-dashed border-[#e0e0e0] pb-1">
                                                <span className="text-[#999]">{t("legal.distanceSales.parties.seller.emailLabel")}</span>
                                                <span className="font-medium text-right">{t("legal.distanceSales.parties.seller.email")}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-dashed border-[#e0e0e0] pb-1">
                                                <span className="text-[#999]">{t("legal.distanceSales.parties.seller.phoneLabel")}</span>
                                                <span className="font-medium text-right">{t("legal.distanceSales.parties.seller.phone")}</span>
                                            </div>
                                            <div className="pt-2 text-[11px] leading-tight text-[#777] text-center whitespace-pre-line">
                                                {sellerAddressSafe}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-[#fafafa] border border-[#f0f0f0] flex flex-col justify-center">
                                        <h3 className="font-bold tracking-wider text-black text-xs mb-4 uppercase text-center border-b border-[#e5e5e5] pb-2">
                                            {t("legal.distanceSales.parties.buyer.title")}
                                        </h3>
                                        <div className="space-y-4 text-[#555] text-center">
                                            <div className="bg-white p-3 border border-[#eee] rounded-sm relative">
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#fafafa] px-2 text-[10px] text-[#999]">
                                                    {t("legal.distanceSales.parties.buyer.scope")}
                                                </div>
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
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-3 text-black">
                                    <span className="w-4 h-[1px] bg-black"></span>
                                    {t("legal.distanceSales.subject.title")}
                                </h2>
                                <p className="text-[#555] pl-7">
                                    {t("legal.distanceSales.subject.desc")}
                                </p>
                            </section>

                            {/* 3. Hizmet Detayları / Service Details */}
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-3 text-black">
                                    <span className="w-4 h-[1px] bg-black"></span>
                                    {t("legal.distanceSales.service.title")}
                                </h2>
                                <div className="grid md:grid-cols-3 gap-4 pl-7">
                                    <div className="bg-white p-4 border border-[#f0f0f0] hover:border-[#ddd] transition-colors">
                                        <span className="block text-[10px] uppercase text-[#bbb] mb-2 font-bold tracking-widest">
                                            {t("legal.distanceSales.service.item1.label")}
                                        </span>
                                        <p className="text-[#333]">
                                            {t("legal.distanceSales.service.item1.desc")}
                                        </p>
                                    </div>
                                    <div className="bg-white p-4 border border-[#f0f0f0] hover:border-[#ddd] transition-colors">
                                        <span className="block text-[10px] uppercase text-[#bbb] mb-2 font-bold tracking-widest">
                                            {t("legal.distanceSales.service.item2.label")}
                                        </span>
                                        <p className="text-[#333]">
                                            {t("legal.distanceSales.service.item2.desc")}
                                        </p>
                                    </div>
                                    <div className="bg-white p-4 border border-[#f0f0f0] hover:border-[#ddd] transition-colors">
                                        <span className="block text-[10px] uppercase text-[#bbb] mb-2 font-bold tracking-widest">
                                            {t("legal.distanceSales.service.item3.label")}
                                        </span>
                                        <p className="text-[#333]">
                                            {t("legal.distanceSales.service.item3.desc")}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* 4. Genel Hükümler / General Provisions */}
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-3 text-black">
                                    <span className="w-4 h-[1px] bg-black"></span>
                                    {t("legal.distanceSales.general.title")}
                                </h2>
                                <div className="space-y-4 pl-7 text-[#555]">
                                    <div className="flex gap-3">
                                        <span className="font-bold text-black min-w-[24px]">4.1.</span>
                                        <p>
                                            {t("legal.distanceSales.general.item1")}
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="font-bold text-black min-w-[24px]">4.2.</span>
                                        <p>
                                            {t("legal.distanceSales.general.item2")}
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="font-bold text-black min-w-[24px]">4.3.</span>
                                        <p>
                                            {t("legal.distanceSales.general.item3")}
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="font-bold text-black min-w-[24px]">4.4.</span>
                                        <p>
                                            {t("legal.distanceSales.general.item4")}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* 5. Cayma Hakkı / Right of Withdrawal */}
                            <section className="bg-[#fffcfc] p-8 border border-red-100 relative overflow-hidden group hover:border-red-200 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-red-600">
                                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                    </svg>
                                </div>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-6 text-red-600 flex items-center gap-3">
                                    <span className="w-4 h-[1px] bg-red-600"></span>
                                    {t("legal.distanceSales.withdrawal.title")}
                                </h2>
                                <div className="space-y-4 text-[#444] text-[13px] relative z-10 pl-7">
                                    <div className="flex gap-3">
                                        <span className="font-bold text-red-700 min-w-[24px]">5.1.</span>
                                        <p>
                                            {t("legal.distanceSales.withdrawal.item1Part1")}
                                            <strong>
                                                {t("legal.distanceSales.withdrawal.item1Strong")}
                                            </strong>
                                            {t("legal.distanceSales.withdrawal.item1Part2")}
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="font-bold text-red-700 min-w-[24px]">5.2.</span>
                                        <p>
                                            {t("legal.distanceSales.withdrawal.item2Part1")}
                                            <span className="bg-red-50 text-red-700 font-medium px-1">
                                                {t("legal.distanceSales.withdrawal.item2Badge")}
                                            </span>
                                            {t("legal.distanceSales.withdrawal.item2Part2")}
                                        </p>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <span className="font-bold text-red-700 min-w-[24px]">5.3.</span>
                                        <div>
                                            <strong>{t("legal.distanceSales.withdrawal.item3Label")}</strong>
                                            {t("legal.distanceSales.withdrawal.item3Desc")}
                                            <ul className="list-disc pl-4 mt-1 space-y-1 text-[#666] text-xs">
                                                <li>{t("legal.distanceSales.withdrawal.list1")}</li>
                                                <li>{t("legal.distanceSales.withdrawal.list2")}</li>
                                                <li>{t("legal.distanceSales.withdrawal.list3")}</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="grid md:grid-cols-2 gap-12">
                                {/* 6. Gizlilik ve KVKK / Privacy */}
                                <section>
                                    <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-3 text-black">
                                        <span className="w-4 h-[1px] bg-black"></span>
                                        {t("legal.distanceSales.privacy.title")}
                                    </h2>
                                    <p className="text-[#555] text-xs pl-7 mb-4">
                                        {t("legal.distanceSales.privacy.desc")}
                                    </p>
                                </section>

                                {/* 7. Yetkili Mahkeme / Jurisdiction */}
                                <section>
                                    <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-3 text-black">
                                        <span className="w-4 h-[1px] bg-black"></span>
                                        {t("legal.distanceSales.jurisdiction.title")}
                                    </h2>
                                    <div className="pl-7">
                                        <p className="text-[#555] text-xs mb-3">
                                            {t("legal.distanceSales.jurisdiction.desc")}
                                        </p>
                                        <div className="text-center py-3 font-bold text-black border border-black/10 bg-[#fafafa]">
                                            {t("legal.distanceSales.jurisdiction.court")}
                                            <div className="text-[9px] font-normal text-[#999] mt-1">
                                                {t("legal.distanceSales.jurisdiction.office")}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* 8. Yürürlük / Enforcement */}
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-3 text-black">
                                    <span className="w-4 h-[1px] bg-black"></span>
                                    {t("legal.distanceSales.enforcement.title")}
                                </h2>
                                <div className="pl-7 flex items-center gap-4 bg-[#fafafa] p-4 border-l-2 border-black">
                                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center shrink-0">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <p className="text-[#333] font-medium text-xs">
                                        {t("legal.distanceSales.enforcement.desc")}
                                    </p>
                                </div>
                            </section>

                        </div>
                    </div>

                    {/* Catalog Footer Style */}
                    <div className="h-[48px] border-t border-[#f0f0f0] flex items-center justify-center shrink-0 bg-white mt-auto">
                        <div className="flex items-center gap-8">
                            <div className="w-8 h-[1px] bg-[#f0f0f0]" />
                            <span className="text-[9px] tracking-[0.5em] text-[#d0d0d0] uppercase">
                                {t("legal.distanceSales.footer.page")}
                            </span>
                            <div className="w-8 h-[1px] bg-[#f0f0f0]" />
                        </div>
                    </div>

                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
