import type { Metadata } from 'next'

import {
    PaymentResultCard,
    PaymentResultUnavailable,
} from '@/components/billing/payment-result-card'
import { PublicFooter } from '@/components/layout/public-footer'
import { PublicHeader } from '@/components/layout/public-header'
import { getBillingPaymentStatus } from '@/lib/actions/billing'

export const metadata: Metadata = {
    title: 'Ödeme Sonucu',
    robots: { index: false, follow: false },
}

interface PaymentResultPageProps {
    searchParams: Promise<{ order?: string | string[] }>
}

export default async function PaymentResultPage({ searchParams }: PaymentResultPageProps) {
    const params = await searchParams
    const orderId = Array.isArray(params.order) ? params.order[0] : params.order
    const payment = orderId ? await getBillingPaymentStatus(orderId) : null

    return (
        <div className="min-h-screen bg-[#f6f7f9] text-slate-950">
            <PublicHeader />
            <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 pt-24 pb-16 sm:px-6 sm:pt-28">
                {payment ? <PaymentResultCard payment={payment} /> : <PaymentResultUnavailable />}
            </main>
            <PublicFooter />
        </div>
    )
}
