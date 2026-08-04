import type { Metadata } from 'next'

import { CheckoutPageClient } from '@/components/billing/checkout-page-client'
import { normalizeBillingCycle, normalizePaidPlan } from '@/lib/billing/plans'

export const metadata: Metadata = {
    title: 'Güvenli Ödeme',
    description: 'FogCatalog Plus veya Pro planınız için güvenli ödeme adımı.',
    robots: {
        index: false,
        follow: false,
    },
}

interface CheckoutPageProps {
    searchParams: Promise<{
        plan?: string | string[]
        billing?: string | string[]
    }>
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
    const params = await searchParams

    return (
        <CheckoutPageClient
            initialPlan={normalizePaidPlan(params.plan)}
            initialBillingCycle={normalizeBillingCycle(params.billing)}
        />
    )
}
