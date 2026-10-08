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
        <CheckCircle2 className="size-9 text-success" />
    ) : isPending ? (
        <Clock3 className="size-9 text-warning-soft-foreground" />
    ) : (
        <AlertCircle className="size-9 text-destructive" />
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
        <section className="w-full max-w-xl border border-border bg-card p-6 shadow-xl shadow-black/5 sm:p-9">
            <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted/50">
                    {icon}
                </div>
                <div>
                    <p className="text-xs font-bold tracking-[0.18em] text-brand uppercase">
                        FogCatalog Checkout
                    </p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        {title}
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
            </div>

            <dl className="mt-7 grid gap-3 border-y border-border py-5 text-sm">
                <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{t('checkout.result.plan')}</dt>
                    <dd className="font-bold text-foreground">{planName}</dd>
                </div>
                {formattedTotal && (
                    <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{t('checkout.result.total')}</dt>
                        <dd className="font-bold text-foreground">{formattedTotal}</dd>
                    </div>
                )}
                <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{t('checkout.result.order')}</dt>
                    <dd className="max-w-[220px] truncate font-mono text-xs text-foreground">
                        {payment.orderId}
                    </dd>
                </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {isPaid ? (
                    <Link
                        href="/dashboard"
                        className="inline-flex min-h-12 flex-1 items-center justify-center bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-brand/90"
                    >
                        {t('checkout.result.dashboard')}
                    </Link>
                ) : isPending ? (
                    <Link
                        href={`/checkout/result?order=${payment.orderId}`}
                        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-brand/90"
                    >
                        <RefreshCw className="size-4" />
                        {t('checkout.result.refresh')}
                    </Link>
                ) : (
                    <Link
                        href={`/checkout?plan=${payment.planId}&billing=${payment.billingCycle}`}
                        className="inline-flex min-h-12 flex-1 items-center justify-center bg-brand px-5 text-sm font-bold text-brand-foreground hover:bg-primary/90"
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
        <section className="w-full max-w-xl border border-border bg-card p-6 shadow-xl shadow-black/5 sm:p-9">
            <AlertCircle className="size-10 text-warning-soft-foreground" />
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
                {t('checkout.result.unavailableTitle')}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t('checkout.result.unavailableDescription')}
            </p>
            <Link
                href="/dashboard"
                className="mt-6 inline-flex min-h-12 items-center justify-center bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-brand/90"
            >
                {t('checkout.result.dashboard')}
            </Link>
        </section>
    )
}
