import { describe, expect, it } from 'vitest'

import {
    buildGarantiThreeDHash,
    classifyGarantiCallback,
    computeGarantiCallbackHash,
    verifyGarantiCallbackHash,
} from '../backend/src/services/payments/garanti-crypto'
import {
    buildGarantiPaymentResultUrl,
    buildGarantiHostedPaymentForm,
    parseGarantiPaymentConfig,
} from '../backend/src/services/payments/garanti-gateway'
import { getTrustedBillingAmounts } from '../backend/src/controllers/billing/pricing'
import { isGarantiPaymentCallbackPath } from '../backend/src/middlewares/public-payment-callback'

describe('Garanti BBVA payment cryptography', () => {
    it('builds the API v512 3D request hash with the documented field order', () => {
        expect(
            buildGarantiThreeDHash({
                terminalId: '30691297',
                orderId: 'ORDER123',
                amount: '10000',
                currencyCode: '949',
                successUrl: 'https://api.fogcatalog.com/api/v1/billing/payments/garanti/callback',
                errorUrl: 'https://api.fogcatalog.com/api/v1/billing/payments/garanti/callback',
                transactionType: 'sales',
                installmentCount: '',
                storeKey: '12345678',
                provisionPassword: 'provPass',
            })
        ).toBe(
            '5D867ADBC783CADE7BF55D15399DF7AEB20720DFB15C0F870B39DF26C4A700977575CB5C359DA89CDF92485E8066B7B7381E950478403AFCFFDE00CEB76D4517'
        )
    })

    it('uses ISO-8859-9 and the bank-provided hashparams order for callbacks', () => {
        const payload = {
            hashparams: 'response:procreturncode:oid:',
            response: 'Başarılı',
            procreturncode: '00',
            oid: 'Sipariş',
        }

        expect(computeGarantiCallbackHash(payload, 'StoreKey123')).toBe(
            '4F975ABB778B9487F623809F28EA731A2F8F2E3090DD2C4E2BAFD94AC6D3367BB827F9D0474F029E15E2D6B83543DCABD588B77201450CE53630166B50F5C2AF'
        )
    })

    it('rejects a callback when a signed field is changed', () => {
        const payload = {
            hashparams: 'oid:txnamount:procreturncode:',
            oid: 'ORDER123',
            txnamount: '50000',
            procreturncode: '00',
        }
        const hash = computeGarantiCallbackHash(payload, 'StoreKey123')

        expect(verifyGarantiCallbackHash({ ...payload, txnamount: '1', hash }, 'StoreKey123')).toBe(
            false
        )
    })
})

describe('Garanti BBVA callback classification', () => {
    const expected = {
        orderId: 'ORDER123',
        amount: '50000',
        currencyCode: '949',
        terminalId: '30691297',
    }

    it('approves only a signed 00 response matching the pending order', () => {
        expect(
            classifyGarantiCallback(
                {
                    oid: 'ORDER123',
                    txnamount: '50000',
                    txncurrencycode: '949',
                    clientid: '30691297',
                    procreturncode: '00',
                    response: 'Approved',
                },
                expected,
                true
            )
        ).toEqual({ status: 'approved', reason: 'approved' })
    })

    it('treats signed bank declines as declined, not as invalid callbacks', () => {
        expect(
            classifyGarantiCallback(
                {
                    oid: 'ORDER123',
                    txnamount: '50000',
                    txncurrencycode: '949',
                    clientid: '30691297',
                    procreturncode: '51',
                    response: 'Declined',
                },
                expected,
                true
            )
        ).toEqual({ status: 'declined', reason: 'bank_declined' })
    })

    it.each([
        ['invalid hash', false, { ...expected }],
        ['wrong order', true, { ...expected, orderId: 'OTHER' }],
        ['changed amount', true, { ...expected, amount: '1' }],
        ['wrong terminal', true, { ...expected, terminalId: '00000000' }],
    ])('rejects %s', (_label, hashValid, callbackValues) => {
        expect(
            classifyGarantiCallback(
                {
                    oid: callbackValues.orderId,
                    txnamount: callbackValues.amount,
                    txncurrencycode: callbackValues.currencyCode,
                    clientid: callbackValues.terminalId,
                    procreturncode: '00',
                    response: 'Approved',
                },
                expected,
                hashValid
            ).status
        ).toBe('invalid')
    })
})

describe('Garanti BBVA hosted payment gateway', () => {
    const configValues = {
        GARANTI_POS_ENABLED: 'true',
        GARANTI_POS_MODE: 'TEST',
        GARANTI_POS_API_VERSION: '512',
        GARANTI_POS_MERCHANT_ID: '7000679',
        GARANTI_POS_TERMINAL_ID: '30691297',
        GARANTI_POS_TERMINAL_USER_ID: 'GARANTI',
        GARANTI_POS_PROV_USER_ID: 'PROVOOS',
        GARANTI_POS_PROVISION_PASSWORD: 'provPass',
        GARANTI_POS_STORE_KEY: '12345678',
        GARANTI_POS_SECURITY_LEVEL: '3D_OOS_PAY',
        GARANTI_POS_PAYMENT_URL: 'https://sanalposprovtest.garantibbva.com.tr/servlet/gt3dengine',
        GARANTI_POS_CALLBACK_URL:
            'https://api.fogcatalog.com/api/v1/billing/payments/garanti/callback',
        GARANTI_POS_RESULT_URL: 'https://fogcatalog.com/checkout/result',
        GARANTI_POS_COMPANY_NAME: 'FogCatalog',
    }

    it('fails closed when bank credentials are incomplete', () => {
        expect(() => parseGarantiPaymentConfig({ GARANTI_POS_MODE: 'TEST' })).toThrow(
            'GARANTI_POS_CONFIG_INVALID'
        )
    })

    it('builds a bank-hosted form without any card fields', () => {
        const config = parseGarantiPaymentConfig(configValues)
        const result = buildGarantiHostedPaymentForm(config, {
            orderId: 'ORDER123',
            amount: '10000',
            customerEmail: 'customer@example.com',
            customerIp: '203.0.113.10',
            timestamp: new Date('2026-08-13T12:00:00.000Z'),
        })

        expect(result.action).toBe(configValues.GARANTI_POS_PAYMENT_URL)
        expect(result.fields).toMatchObject({
            mode: 'TEST',
            apiversion: '512',
            secure3dsecuritylevel: '3D_OOS_PAY',
            terminalprovuserid: 'PROVOOS',
            terminalmerchantid: '7000679',
            terminalid: '30691297',
            orderid: 'ORDER123',
            txnamount: '10000',
            txncurrencycode: '949',
            txntype: 'sales',
            txninstallmentcount: '',
            txntimestamp: '2026-08-13T12:00:00Z',
        })
        expect(Object.keys(result.fields)).not.toContain('cardnumber')
        expect(Object.keys(result.fields)).not.toContain('cardcvv2')
        expect(result.fields.secure3dhash).toMatch(/^[A-F0-9]{128}$/)
    })

    it('does not allow merchant-page 3D_PAY in the hosted-card adapter', () => {
        expect(() =>
            parseGarantiPaymentConfig({
                ...configValues,
                GARANTI_POS_SECURITY_LEVEL: '3D_PAY',
            })
        ).toThrow('GARANTI_POS_CONFIG_INVALID')
    })

    it('does not allow non-3D OOS payments', () => {
        expect(() =>
            parseGarantiPaymentConfig({
                ...configValues,
                GARANTI_POS_SECURITY_LEVEL: 'OOS_PAY',
            })
        ).toThrow('GARANTI_POS_CONFIG_INVALID')
    })

    it('rejects a hosted-payment endpoint outside the Garanti domains', () => {
        expect(() =>
            parseGarantiPaymentConfig({
                ...configValues,
                GARANTI_POS_PAYMENT_URL: 'https://payments.example.com/gt3dengine',
            })
        ).toThrow('GARANTI_POS_CONFIG_INVALID')
    })

    it('does not allow TEST and PROD endpoint modes to be mixed', () => {
        expect(() =>
            parseGarantiPaymentConfig({
                ...configValues,
                GARANTI_POS_MODE: 'PROD',
            })
        ).toThrow('GARANTI_POS_CONFIG_INVALID')

        expect(() =>
            parseGarantiPaymentConfig({
                ...configValues,
                GARANTI_POS_PAYMENT_URL:
                    'https://sanalposprov.garantibbva.com.tr/servlet/gt3dengine',
            })
        ).toThrow('GARANTI_POS_CONFIG_INVALID')
    })

    it('rejects provider order IDs and amounts outside the bank contract', () => {
        const config = parseGarantiPaymentConfig(configValues)

        expect(() =>
            buildGarantiHostedPaymentForm(config, {
                orderId: 'short',
                amount: '10000',
                customerEmail: 'customer@example.com',
                customerIp: '203.0.113.10',
            })
        ).toThrow('GARANTI_INVALID_ORDER_ID')
        expect(() =>
            buildGarantiHostedPaymentForm(config, {
                orderId: 'ORDER123',
                amount: '0',
                customerEmail: 'customer@example.com',
                customerIp: '203.0.113.10',
            })
        ).toThrow('GARANTI_INVALID_AMOUNT')
    })

    it('builds a fixed application result URL without trusting callback input', () => {
        const config = parseGarantiPaymentConfig(configValues)

        expect(buildGarantiPaymentResultUrl(config, 'billing-order-id')).toBe(
            'https://fogcatalog.com/checkout/result?order=billing-order-id'
        )
    })
})

describe('trusted backend billing prices', () => {
    it.each([
        ['plus', 'monthly', 50000],
        ['plus', 'yearly', 500000],
        ['pro', 'monthly', 100000],
        ['pro', 'yearly', 1000000],
    ] as const)('prices %s/%s in integer kuruş', (planId, cycle, amountMinor) => {
        const amounts = getTrustedBillingAmounts(planId, cycle)

        expect(amounts.amountMinor).toBe(amountMinor)
        expect(amounts.total).toBe(amountMinor / 100)
        expect(amounts.subtotal + amounts.vat).toBe(amounts.total)
        expect(amounts.vatRate).toBe(0.2)
    })
})

describe('public bank callback boundary', () => {
    it('allows only the exact Garanti callback path through the no-origin guard', () => {
        expect(
            isGarantiPaymentCallbackPath('/api/v1/billing/payments/garanti/callback', 'POST')
        ).toBe(true)
        expect(
            isGarantiPaymentCallbackPath('/api/v1/billing/payments/garanti/callback/extra', 'POST')
        ).toBe(false)
        expect(
            isGarantiPaymentCallbackPath('/api/v1/billing/payments/garanti/callback', 'GET')
        ).toBe(false)
    })
})
