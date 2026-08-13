"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrustedBillingAmounts = getTrustedBillingAmounts;
const VAT_RATE = 0.2;
const TOTALS = {
    plus: { monthly: 500, yearly: 5000 },
    pro: { monthly: 1000, yearly: 10000 },
};
function roundCurrency(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
function getTrustedBillingAmounts(planId, cycle) {
    const total = TOTALS[planId][cycle];
    const subtotal = roundCurrency(total / (1 + VAT_RATE));
    const vat = roundCurrency(total - subtotal);
    return {
        subtotal,
        vatRate: VAT_RATE,
        vat,
        total,
        amountMinor: Math.round(total * 100),
    };
}
