export type PaidPlanId = 'plus' | 'pro'
export type BillingCycle = 'monthly' | 'yearly'

export interface CheckoutPlan {
    id: PaidPlanId
    monthlyPrice: number
    yearlyPrice: number
}

export const VAT_RATE = 0.2

export const CHECKOUT_PLANS: Record<PaidPlanId, CheckoutPlan> = {
    plus: {
        id: 'plus',
        monthlyPrice: 500,
        yearlyPrice: 5000,
    },
    pro: {
        id: 'pro',
        monthlyPrice: 1000,
        yearlyPrice: 10000,
    },
}

export function normalizePaidPlan(value: string | string[] | undefined): PaidPlanId {
    const plan = Array.isArray(value) ? value[0] : value
    return plan === 'plus' ? 'plus' : 'pro'
}

export function normalizeBillingCycle(value: string | string[] | undefined): BillingCycle {
    const cycle = Array.isArray(value) ? value[0] : value
    return cycle === 'monthly' ? 'monthly' : 'yearly'
}

export function getCheckoutTotals(planId: PaidPlanId, cycle: BillingCycle) {
    const plan = CHECKOUT_PLANS[planId]
    const subtotal = cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
    const vat = subtotal * VAT_RATE
    const total = subtotal + vat
    const monthlyEquivalent = cycle === 'yearly' ? subtotal / 12 : subtotal
    const savings = cycle === 'yearly' ? plan.monthlyPrice * 12 - plan.yearlyPrice : 0

    return {
        subtotal,
        vat,
        total,
        monthlyEquivalent,
        savings,
    }
}

export function buildCheckoutHref(planId: PaidPlanId, cycle: BillingCycle) {
    return `/checkout?plan=${planId}&billing=${cycle}`
}
