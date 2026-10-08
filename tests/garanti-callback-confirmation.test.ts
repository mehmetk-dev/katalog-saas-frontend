import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    rpc: vi.fn(async () => ({ data: null, error: null })),
    orderInquiry: vi.fn(),
    classify: vi.fn(),
    ensureReconciliation: vi.fn(async () => 'op-1'),
    alert: vi.fn(async () => undefined),
    vpConfig: vi.fn(() => ({ terminalId: '30691297', merchantId: '7000679' })),
}))

const attempt = {
    id: 'attempt-1',
    order_id: '11111111-1111-4111-8111-111111111111',
    user_id: 'user-1',
    provider_order_id: 'ORDER12345',
    amount_minor: 50000,
    currency_code: '949',
    status: 'redirected',
    customer_ip: '203.0.113.5',
}

vi.mock('../backend/src/services/supabase', () => ({
    supabase: {
        from: (table: string) => ({
            select: () => {
                const chain = {
                    eq: () => chain,
                    single: async () =>
                        table === 'billing_payment_attempts'
                            ? { data: attempt, error: null }
                            : { data: { email: 'buyer@example.com' }, error: null },
                }
                return chain
            },
        }),
        rpc: mocks.rpc,
    },
}))

vi.mock('../backend/src/services/payments/garanti-gateway', () => ({
    getGarantiPaymentConfig: () => ({ storeKey: 'KEY', terminalId: '30691297' }),
    buildGarantiPaymentResultUrl: () => 'https://app.example.com/checkout/result',
    buildGarantiHostedPaymentForm: vi.fn(),
}))

vi.mock('../backend/src/services/payments/garanti-crypto', () => ({
    verifyGarantiCallbackHash: () => true,
    classifyGarantiCallback: () => ({ status: 'approved', reason: 'approved' }),
}))

vi.mock('../backend/src/services/payments/garanti-vp-client', () => ({
    getGarantiVpConfig: mocks.vpConfig,
    createGarantiVpClient: () => ({ orderInquiry: mocks.orderInquiry }),
    classifyGarantiOrderInquiry: mocks.classify,
}))

vi.mock('../backend/src/services/payment-operations', () => ({ ensurePaymentReconciliation: mocks.ensureReconciliation }))
vi.mock('../backend/src/services/payment-alerts', () => ({ recordPaymentAlert: mocks.alert }))

import { handleGarantiPaymentCallback } from '../backend/src/controllers/billing/payments'

function callback() {
    const res = {
        statusCode: 200,
        location: '',
        status(code: number) { this.statusCode = code; return this },
        send() { return this },
        redirect(code: number, url: string) { this.statusCode = code; this.location = url; return this },
    }
    const req = { body: { oid: 'ORDER12345', procreturncode: '00', hashparams: 'oid:procreturncode:' } }
    return handleGarantiPaymentCallback(req as never, res as never).then(() => res)
}

describe('Garanti approved callback', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.orderInquiry.mockResolvedValue({})
    })

    it('finalizes only after the bank inquiry confirms the approval', async () => {
        mocks.classify.mockReturnValue({ status: 'approved', bankReferenceNumber: 'REF-1', authorizationCode: 'AUTH-1' })

        const res = await callback()

        expect(res.statusCode).toBe(303)
        expect(mocks.rpc).toHaveBeenCalledWith('finalize_garanti_payment', expect.objectContaining({
            p_attempt_id: 'attempt-1',
            p_result_status: 'approved',
            p_bank_reference_number: 'REF-1',
            p_authorization_code: 'AUTH-1',
        }))
    })

    it('does not grant the plan when the bank does not confirm the approval', async () => {
        mocks.classify.mockReturnValue({ status: 'declined', bankCode: '51' })

        const res = await callback()

        expect(res.statusCode).toBe(303)
        expect(mocks.rpc).not.toHaveBeenCalled()
        expect(mocks.ensureReconciliation).toHaveBeenCalledWith('attempt-1', 0)
        expect(mocks.alert).toHaveBeenCalledWith(expect.objectContaining({ code: 'PAYMENT_CALLBACK_NOT_CONFIRMED' }))
    })

    it('leaves the order pending for reconciliation when the bank cannot be reached', async () => {
        mocks.orderInquiry.mockRejectedValue(new Error('timeout'))

        await callback()

        expect(mocks.rpc).not.toHaveBeenCalled()
        expect(mocks.ensureReconciliation).toHaveBeenCalledWith('attempt-1', 0)
        expect(mocks.alert).not.toHaveBeenCalled()
    })
})
