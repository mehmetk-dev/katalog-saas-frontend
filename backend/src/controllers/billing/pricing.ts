export type PaidPlanId = 'plus' | 'pro'
export type BillingCycle = 'monthly' | 'yearly'

const VAT_RATE = 0.2
const TOTALS: Record<PaidPlanId, Record<BillingCycle, number>> = {
    plus: { monthly: 500, yearly: 5000 },
    pro: { monthly: 1000, yearly: 10000 },
}

function roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100
}

export function getTrustedBillingAmounts(planId: PaidPlanId, cycle: BillingCycle) {
    const total = TOTALS[planId][cycle]
    const subtotal = roundCurrency(total / (1 + VAT_RATE))
    const vat = roundCurrency(total - subtotal)

    return {
        subtotal,
        vatRate: VAT_RATE,
        vat,
        total,
        amountMinor: Math.round(total * 100),
    }
}
