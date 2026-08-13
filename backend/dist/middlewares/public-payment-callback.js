"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GARANTI_PAYMENT_CALLBACK_PATH = void 0;
exports.isGarantiPaymentCallbackPath = isGarantiPaymentCallbackPath;
exports.GARANTI_PAYMENT_CALLBACK_PATH = '/api/v1/billing/payments/garanti/callback';
function isGarantiPaymentCallbackPath(path, method) {
    return method.toUpperCase() === 'POST' && path === exports.GARANTI_PAYMENT_CALLBACK_PATH;
}
