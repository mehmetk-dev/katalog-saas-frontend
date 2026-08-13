import type { Metadata } from 'next'

import {
    PaymentResultCard,
    PaymentResultUnavailable,
} from '@/components/billing/payment-result-card'
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
        <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center bg-[#f6f7f9] px-1 py-8 text-slate-950 sm:px-4">
            {payment ? <PaymentResultCard payment={payment} /> : <PaymentResultUnavailable />}
        </div>
    )
}
