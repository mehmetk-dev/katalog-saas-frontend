'use client'

import Link from 'next/link'
import { AlertCircle, CheckCircle2, Clock3, RefreshCw } from 'lucide-react'

import type { BillingPaymentStatus } from '@/lib/actions/billing'
import { useTranslation } from '@/lib/contexts/i18n-provider'

interface PaymentResultCardProps {
    payment: BillingPaymentStatus
}

export function PaymentResultCard({ payment }: PaymentResultCardProps) {
    const { t, language } = useTranslation()
    const isPaid = payment.status === 'paid'
    const isPending = payment.status === 'draft' || payment.status === 'payment_pending'
    const planName = payment.planId === 'pro' ? 'Pro' : 'Plus'
    const formattedTotal =
        payment.total === null
            ? null
            : new Intl.NumberFormat(language === 'en' ? 'en-US' : 'tr-TR', {
                  style: 'currency',
                  currency: payment.currency,
                  maximumFractionDigits: 2,
              }).format(payment.total)

    const icon = isPaid ? (
        <CheckCircle2 className="size-9 text-emerald-600" />
    ) : isPending ? (
        <Clock3 className="size-9 text-amber-600" />
    ) : (
        <AlertCircle className="size-9 text-red-600" />
    )
    const title = isPaid
        ? t('checkout.result.paidTitle')
        : isPending
          ? t('checkout.result.pendingTitle')
          : t('checkout.result.failedTitle')
    const description = isPaid
        ? t('checkout.result.paidDescription').replace('{plan}', planName)
        : isPending
          ? t('checkout.result.pendingDescription')
          : t('checkout.result.failedDescription')

    return (
        <section className="w-full max-w-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 sm:p-9">
            <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-slate-50">
                    {icon}
                </div>
                <div>
                    <p className="text-xs font-black tracking-[0.18em] text-[#cf1414] uppercase">
                        FogCatalog Checkout
                    </p>
                    <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                        {title}
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
                </div>
            </div>

            <dl className="mt-7 grid gap-3 border-y border-slate-200 py-5 text-sm">
                <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">{t('checkout.result.plan')}</dt>
                    <dd className="font-black text-slate-950">{planName}</dd>
                </div>
                {formattedTotal && (
                    <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">{t('checkout.result.total')}</dt>
                        <dd className="font-black text-slate-950">{formattedTotal}</dd>
                    </div>
                )}
                <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">{t('checkout.result.order')}</dt>
                    <dd className="max-w-[220px] truncate font-mono text-xs text-slate-700">
                        {payment.orderId}
                    </dd>
                </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {isPaid ? (
                    <Link
                        href="/dashboard"
                        className="inline-flex min-h-12 flex-1 items-center justify-center bg-slate-950 px-5 text-sm font-black text-white hover:bg-[#cf1414]"
                    >
                        {t('checkout.result.dashboard')}
                    </Link>
                ) : isPending ? (
                    <Link
                        href={`/checkout/result?order=${payment.orderId}`}
                        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 bg-slate-950 px-5 text-sm font-black text-white hover:bg-[#cf1414]"
                    >
                        <RefreshCw className="size-4" />
                        {t('checkout.result.refresh')}
                    </Link>
                ) : (
                    <Link
                        href={`/checkout?plan=${payment.planId}&billing=${payment.billingCycle}`}
                        className="inline-flex min-h-12 flex-1 items-center justify-center bg-[#cf1414] px-5 text-sm font-black text-white hover:bg-slate-950"
                    >
                        {t('checkout.result.retry')}
                    </Link>
                )}
            </div>
        </section>
    )
}

export function PaymentResultUnavailable() {
    const { t } = useTranslation()

    return (
        <section className="w-full max-w-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 sm:p-9">
            <AlertCircle className="size-10 text-amber-600" />
            <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
                {t('checkout.result.unavailableTitle')}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
                {t('checkout.result.unavailableDescription')}
            </p>
            <Link
                href="/auth"
                className="mt-6 inline-flex min-h-12 items-center justify-center bg-slate-950 px-6 text-sm font-black text-white hover:bg-[#cf1414]"
            >
                {t('checkout.payment.signIn')}
            </Link>
        </section>
    )
}
