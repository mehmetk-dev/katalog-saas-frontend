export const GARANTI_PAYMENT_CALLBACK_PATH = '/api/v1/billing/payments/garanti/callback'

export function isGarantiPaymentCallbackPath(path: string, method: string): boolean {
    return method.toUpperCase() === 'POST' && path === GARANTI_PAYMENT_CALLBACK_PATH
}
