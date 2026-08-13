"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizePaymentAlertDetails = sanitizePaymentAlertDetails;
const blockedDetailKey = /password|secret|token|store.?key|hash|card|pan|cvc|email|phone|xml|payload/i;
function sanitizePaymentAlertDetails(details) {
    const safe = {};
    for (const [key, value] of Object.entries(details ?? {}).slice(0, 20)) {
        if (!/^[A-Za-z][A-Za-z0-9_]{0,49}$/.test(key) || blockedDetailKey.test(key))
            continue;
        if (value === null || typeof value === 'boolean' || typeof value === 'number') {
            safe[key] = value;
        }
        else if (typeof value === 'string') {
            safe[key] = value.slice(0, 200);
        }
    }
    return safe;
}
