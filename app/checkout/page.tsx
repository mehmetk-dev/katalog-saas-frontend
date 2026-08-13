import type { Metadata } from 'next'

import { CheckoutPageClient } from '@/components/billing/checkout-page-client'
import { normalizeBillingCycle, normalizePaidPlan } from '@/lib/billing/plans'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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

async function getCheckoutCustomerPrefill() {
    const supabase = await createServerSupabaseClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { fullName: '', email: '' }

    const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()

    const profileName = profile?.full_name?.trim()
    const metadataName =
        typeof user.user_metadata?.full_name === 'string'
            ? user.user_metadata.full_name.trim()
            : ''

    return {
        fullName: profileName || metadataName,
        email: user.email?.trim() || '',
    }
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
    const [params, initialCustomer] = await Promise.all([
        searchParams,
        getCheckoutCustomerPrefill(),
    ])

    return (
        <CheckoutPageClient
            initialPlan={normalizePaidPlan(params.plan)}
            initialBillingCycle={normalizeBillingCycle(params.billing)}
            initialCustomer={initialCustomer}
        />
    )
}
