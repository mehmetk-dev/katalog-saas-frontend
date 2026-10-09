'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Clock3, RefreshCw } from 'lucide-react'

import type { BillingPaymentStatus } from '@/lib/actions/billing'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/contexts/i18n-provider'

interface PaymentResultCardProps {
    payment: BillingPaymentStatus
}

const PENDING_REFRESH_INTERVAL_MS = 4000
const PENDING_REFRESH_MAX_MS = 3 * 60 * 1000

/**
 * Banka sonucu teyit edilene kadar sipariş "beklemede" kalabilir (callback banka sorgusuyla doğrulanır,
 * gerekirse mutabakat worker'ı tamamlar). Kullanıcı elle yenilemek zorunda kalmasın.
 */
function usePendingAutoRefresh(isPending: boolean) {
    const router = useRouter()
    useEffect(() => {
        if (!isPending) return
        const startedAt = Date.now()
        const timer = setInterval(() => {
            if (Date.now() - startedAt > PENDING_REFRESH_MAX_MS) {
                clearInterval(timer)
                return
            }
            router.refresh()
        }, PENDING_REFRESH_INTERVAL_MS)
        return () => clearInterval(timer)
    }, [isPending, router])
}

export function PaymentResultCard({ payment }: PaymentResultCardProps) {
    const { t, language } = useTranslation()
    const isPaid = payment.status === 'paid'
    const isPending = payment.status === 'draft' || payment.status === 'payment_pending'
    usePendingAutoRefresh(isPending)
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
        <CheckCircle2 className="text-success size-9" />
    ) : isPending ? (
        <Clock3 className="text-warning-soft-foreground size-9" />
    ) : (
        <AlertCircle className="text-destructive size-9" />
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
        <section className="border-border bg-card w-full max-w-xl rounded-xl border p-6 shadow-sm sm:p-9">
            <div className="flex items-start gap-4">
                <div className="bg-muted/50 flex size-14 shrink-0 items-center justify-center rounded-full">
                    {icon}
                </div>
                <div>
                    <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                        {title}
                    </h1>
                    <p className="text-muted-foreground mt-3 text-sm leading-6">{description}</p>
                </div>
            </div>

            <dl className="border-border mt-7 grid gap-3 border-y py-5 text-sm">
                <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{t('checkout.result.plan')}</dt>
                    <dd className="text-foreground font-bold">{planName}</dd>
                </div>
                {formattedTotal && (
                    <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{t('checkout.result.total')}</dt>
                        <dd className="text-foreground font-bold">{formattedTotal}</dd>
                    </div>
                )}
                <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{t('checkout.result.order')}</dt>
                    <dd className="text-foreground max-w-[220px] truncate font-mono text-xs">
                        {payment.orderId}
                    </dd>
                </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {isPaid ? (
                    <Button asChild size="xl" className="flex-1">
                        <Link href="/dashboard">{t('checkout.result.dashboard')}</Link>
                    </Button>
                ) : isPending ? (
                    <Button asChild size="xl" className="flex-1">
                        <Link href={`/checkout/result?order=${payment.orderId}`}>
                            <RefreshCw />
                            {t('checkout.result.refresh')}
                        </Link>
                    </Button>
                ) : (
                    <Button asChild size="xl" variant="brand" className="flex-1">
                        <Link
                            href={`/checkout?plan=${payment.planId}&billing=${payment.billingCycle}`}
                        >
                            {t('checkout.result.retry')}
                        </Link>
                    </Button>
                )}
            </div>
        </section>
    )
}

export function PaymentResultUnavailable() {
    const { t } = useTranslation()

    return (
        <section className="border-border bg-card w-full max-w-xl rounded-xl border p-6 shadow-sm sm:p-9">
            <AlertCircle className="text-warning-soft-foreground size-10" />
            <h1 className="text-foreground mt-5 text-2xl font-bold tracking-tight">
                {t('checkout.result.unavailableTitle')}
            </h1>
            <p className="text-muted-foreground mt-3 text-sm leading-6">
                {t('checkout.result.unavailableDescription')}
            </p>
            <Button asChild size="xl" className="mt-6">
                <Link href="/dashboard">{t('checkout.result.dashboard')}</Link>
            </Button>
        </section>
    )
}
