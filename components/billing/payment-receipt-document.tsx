'use client'

import { useEffect } from 'react'

import type { PaymentReceiptPayload } from '@/lib/billing/payment-receipt'

interface PaymentReceiptDocumentProps {
    payload: PaymentReceiptPayload
}

const A4_WIDTH = 794
const A4_HEIGHT = 1123

function formatMoney(amount: number, currency: string): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('tr-TR', {
        timeZone: 'Europe/Istanbul',
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(new Date(value))
}

function getPlanLabel(payload: PaymentReceiptPayload): string {
    const plan = payload.planId === 'pro' ? 'Pro' : 'Plus'
    const cycle = payload.billingCycle === 'yearly' ? 'Yıllık' : 'Aylık'
    return `FogCatalog ${plan} - ${cycle}`
}

function getBillingCycleLabel(payload: PaymentReceiptPayload): string {
    return payload.billingCycle === 'yearly' ? 'Yıllık abonelik' : 'Aylık abonelik'
}

function getPaymentMethod(payload: PaymentReceiptPayload): string {
    if (payload.payment.methodType === 'bank_transfer') return 'Banka havalesi'
    if (payload.payment.methodType === 'wallet') return 'Dijital cüzdan'
    return 'Kartlı ödeme'
}

export function PaymentReceiptDocument({ payload }: PaymentReceiptDocumentProps) {
    useEffect(() => {
        let cancelled = false

        async function markReady() {
            await document.fonts.ready.catch(() => undefined)
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
            if (!cancelled) {
                ;(
                    window as typeof window & { __BILLING_DOCUMENT_READY?: boolean }
                ).__BILLING_DOCUMENT_READY = true
            }
        }

        void markReady()
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <main className="bg-white text-[#111827] print:bg-white">
            <article
                className="relative overflow-hidden bg-white font-sans"
                style={{ width: A4_WIDTH, height: A4_HEIGHT }}
                lang="tr"
            >
                <div className="absolute inset-x-0 top-0 h-1.5 bg-[#172033]" aria-hidden="true" />
                <div
                    className="absolute top-1.5 right-0 h-0.5 w-36 bg-[#cf1414]"
                    aria-hidden="true"
                />

                <div className="flex h-full flex-col px-16 pt-11 pb-10">
                    <header className="grid grid-cols-[1fr_260px] gap-10 border-b-2 border-[#172033] pb-5">
                        <div className="min-w-0">
                            <p
                                className="text-[10px] font-bold tracking-[0.18em] text-[#cf1414] uppercase"
                                translate="no"
                            >
                                FogCatalog
                            </p>
                            <p className="mt-2 text-[9px] font-semibold text-[#172033]">
                                {payload.merchant.legalName}
                            </p>
                            <p className="mt-1 text-[8px] leading-[1.45] text-slate-500">
                                {payload.merchant.taxOffice} / {payload.merchant.taxNumber}
                                <br />
                                {payload.merchant.supportEmail} · {payload.merchant.website}
                            </p>
                        </div>

                        <div className="text-right">
                            <h1 className="text-[16px] leading-none font-bold tracking-[0.04em] text-[#172033] uppercase text-balance">
                                Ödeme Dekontu
                            </h1>
                            <p className="mt-2 text-[8px] text-slate-500">
                                Elektronik tahsilat kayıt belgesi
                            </p>
                            <dl className="mt-3 space-y-1 text-[8px] tabular-nums">
                                <DocumentLine
                                    label="Belge No"
                                    value={payload.documentNumber}
                                    noTranslate
                                />
                                <DocumentLine label="Düzenlenme" value={formatDate(payload.paidAt)} />
                            </dl>
                        </div>
                    </header>

                    <section className="mt-5 border border-slate-300">
                        <SectionHeader>Belge Bilgileri</SectionHeader>
                        <dl className="grid grid-cols-3">
                            <MetaCell label="Ödeme tarihi" value={formatDate(payload.paidAt)} />
                            <MetaCell
                                label="Sipariş numarası"
                                value={payload.orderId}
                                bordered
                                noTranslate
                            />
                            <MetaCell label="Ödeme durumu" value="Tamamlandı" bordered status />
                        </dl>
                    </section>

                    <section className="mt-4 border border-slate-300">
                        <SectionHeader>Tahsilat Özeti</SectionHeader>
                        <dl className="grid grid-cols-[1.35fr_1fr_1fr]">
                            <SummaryCell label="Hizmet" value={getPlanLabel(payload)} />
                            <SummaryCell
                                label="Dönem"
                                value={getBillingCycleLabel(payload)}
                                bordered
                            />
                            <SummaryCell
                                label="Tahsil edilen tutar"
                                value={formatMoney(payload.totalAmount, payload.currency)}
                                bordered
                                amount
                            />
                        </dl>
                    </section>

                    <section className="mt-4 border border-slate-300">
                        <SectionHeader>Taraf Bilgileri</SectionHeader>
                        <div className="grid grid-cols-2">
                            <PartyColumn
                                title="Tahsilatı Yapan"
                                name={payload.merchant.legalName}
                                lines={[
                                    `${payload.merchant.taxOffice} / ${payload.merchant.taxNumber}`,
                                    payload.merchant.address,
                                    payload.merchant.phone,
                                    payload.merchant.supportEmail,
                                    payload.merchant.website,
                                ]}
                            />
                            <PartyColumn
                                title="Ödemeyi Yapan"
                                name={payload.customer.displayName}
                                lines={[
                                    payload.customer.email,
                                    payload.customer.phone,
                                    `${payload.customer.district} / ${payload.customer.city}`,
                                ]}
                                right
                            />
                        </div>
                    </section>

                    <section className="mt-4 border border-slate-300">
                        <SectionHeader>Ödeme Bilgileri</SectionHeader>
                        <dl>
                            <InfoRow label="Ödeme yöntemi" value={getPaymentMethod(payload)} />
                            <InfoRow label="Ödeme kuruluşu" value={payload.payment.provider} />
                            <InfoRow
                                label="Banka işlem referansı"
                                value={payload.payment.reference}
                                last={!payload.payment.installmentCount}
                                noTranslate
                            />
                            {payload.payment.installmentCount && (
                                <InfoRow
                                    label="Taksit"
                                    value={`${payload.payment.installmentCount} taksit`}
                                    last
                                />
                            )}
                        </dl>
                    </section>

                    <section className="mt-4 border border-slate-300 bg-slate-50 px-4 py-3 text-[8px] leading-[1.5] text-slate-600">
                        <p className="font-semibold text-slate-800">
                            Bu belge ödeme kaydını gösterir; fatura veya e-Arşiv fatura yerine
                            geçmez.
                        </p>
                        <p className="mt-1.5">
                            Kart numarası, son kullanma tarihi ve güvenlik kodu FogCatalog
                            sistemlerine iletilmez veya kaydedilmez.
                        </p>
                    </section>

                    <footer className="mt-auto grid grid-cols-[1fr_auto] items-end gap-8 border-t border-slate-300 pt-3 text-[8px] leading-3.5 text-slate-500">
                        <p>
                            Bu belge, doğrulanmış ödeme kaydından elektronik olarak
                            oluşturulmuştur.
                        </p>
                        <div className="text-right">
                            <p className="font-semibold text-slate-700">www.fogcatalog.com</p>
                            <p>Sayfa 1 / 1</p>
                        </div>
                    </footer>
                </div>
            </article>
        </main>
    )
}

function SectionHeader({ children }: { children: string }) {
    return (
        <h2 className="border-b border-slate-300 bg-[#eef1f5] px-4 py-2 text-[8px] font-bold tracking-[0.1em] text-[#27364d] uppercase">
            {children}
        </h2>
    )
}

function DocumentLine({
    label,
    value,
    noTranslate = false,
}: {
    label: string
    value: string
    noTranslate?: boolean
}) {
    return (
        <div className="grid grid-cols-[70px_1fr] gap-3">
            <dt className="text-slate-500">{label}</dt>
            <dd
                className="min-w-0 break-all font-semibold text-[#172033]"
                translate={noTranslate ? 'no' : undefined}
            >
                {value}
            </dd>
        </div>
    )
}

function MetaCell({
    label,
    value,
    bordered = false,
    noTranslate = false,
    status = false,
}: {
    label: string
    value: string
    bordered?: boolean
    noTranslate?: boolean
    status?: boolean
}) {
    return (
        <div className={`min-w-0 px-4 py-3 ${bordered ? 'border-l border-slate-200' : ''}`}>
            <dt className="text-[8px] font-medium text-slate-500">{label}</dt>
            <dd
                className={`mt-1.5 break-all text-[9px] font-semibold tabular-nums ${status ? 'text-emerald-700' : 'text-slate-800'}`}
                translate={noTranslate ? 'no' : undefined}
            >
                {value}
            </dd>
        </div>
    )
}

function SummaryCell({
    label,
    value,
    bordered = false,
    amount = false,
}: {
    label: string
    value: string
    bordered?: boolean
    amount?: boolean
}) {
    return (
        <div className={`min-w-0 px-4 py-3.5 ${bordered ? 'border-l border-slate-200' : ''}`}>
            <dt className="text-[8px] font-medium text-slate-500">{label}</dt>
            <dd
                className={`mt-2 break-words font-semibold text-[#172033] tabular-nums ${amount ? 'text-[13px]' : 'text-[9px]'}`}
            >
                {value}
            </dd>
        </div>
    )
}

function InfoRow({
    label,
    value,
    last = false,
    noTranslate = false,
}: {
    label: string
    value: string
    last?: boolean
    noTranslate?: boolean
}) {
    return (
        <div
            className={`grid grid-cols-[165px_1fr] text-[9px] ${last ? '' : 'border-b border-slate-200'}`}
        >
            <dt className="bg-slate-50 px-4 py-2 font-medium text-slate-600">{label}</dt>
            <dd
                className="break-all px-4 py-2 text-right font-medium text-slate-800 tabular-nums"
                translate={noTranslate ? 'no' : undefined}
            >
                {value}
            </dd>
        </div>
    )
}

function PartyColumn({
    title,
    name,
    lines,
    right = false,
}: {
    title: string
    name: string
    lines: Array<string | undefined>
    right?: boolean
}) {
    return (
        <div className={`min-h-28 min-w-0 p-4 ${right ? 'border-l border-slate-300' : ''}`}>
            <p className="text-[8px] font-semibold tracking-[0.08em] text-slate-500 uppercase">
                {title}
            </p>
            <h3 className="mt-2 break-words text-[10px] font-semibold text-pretty">{name}</h3>
            <div className="mt-2 space-y-0.5 break-words text-[8px] leading-[1.45] text-slate-600">
                {lines.filter(Boolean).map((line) => (
                    <p key={line}>{line}</p>
                ))}
            </div>
        </div>
    )
}
