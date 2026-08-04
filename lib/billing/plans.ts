export type PaidPlanId = 'plus' | 'pro'
export type BillingCycle = 'monthly' | 'yearly'

export interface CheckoutPlan {
    id: PaidPlanId
    /** Customer-facing, VAT-inclusive monthly price. */
    monthlyPrice: number
    /** Customer-facing, VAT-inclusive yearly price. */
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
    const total = cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
    const subtotal = roundCurrency(total / (1 + VAT_RATE))
    const vat = roundCurrency(total - subtotal)
    const monthlyEquivalent = roundCurrency(cycle === 'yearly' ? total / 12 : total)
    const savings = cycle === 'yearly' ? plan.monthlyPrice * 12 - plan.yearlyPrice : 0

    return {
        subtotal,
        vat,
        total,
        monthlyEquivalent,
        savings,
    }
}

function roundCurrency(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100
}

export function buildCheckoutHref(planId: PaidPlanId, cycle: BillingCycle) {
    return `/checkout?plan=${planId}&billing=${cycle}`
}
