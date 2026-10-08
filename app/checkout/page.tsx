import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { CheckoutPageClient } from '@/components/billing/checkout-page-client'
import { buildCheckoutHref, normalizeBillingCycle, normalizePaidPlan } from '@/lib/billing/plans'
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

    if (!user) return null

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
    const planId = normalizePaidPlan(params.plan)
    const billingCycle = normalizeBillingCycle(params.billing)

    // Ödeme hesaba bağlı: fatura formunu doldurtup sonra girişe göndermek yerine önce giriş
    // yaptırılır ve aynı plan seçimiyle buraya geri dönülür.
    if (!initialCustomer) {
        redirect(`/auth?next=${encodeURIComponent(buildCheckoutHref(planId, billingCycle))}`)
    }

    return (
        <CheckoutPageClient
            initialPlan={planId}
            initialBillingCycle={billingCycle}
            initialCustomer={initialCustomer}
        />
    )
}
