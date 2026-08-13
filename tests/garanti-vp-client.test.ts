import { describe, expect, it } from 'vitest'

import { buildGarantiVpHash } from '../backend/src/services/payments/garanti-crypto'
import {
    buildGarantiVpRequestXml,
    classifyGarantiOrderInquiry,
    findConfirmedGarantiReversal,
    parseGarantiVpConfig,
    parseGarantiVpResponse,
    type GarantiVpConfig,
} from '../backend/src/services/payments/garanti-vp-client'

const config: GarantiVpConfig = {
    mode: 'TEST',
    apiVersion: '512',
    merchantId: '7000679',
    terminalId: '30691297',
    endpoint: 'https://sanalposprovtest.garantibbva.com.tr/VPServlet',
    userId: 'PROVAUT',
    inquiryProvisionUserId: 'PROVAUT',
    inquiryProvisionPassword: '123qweASD/',
    refundProvisionUserId: 'PROVRFN',
    refundProvisionPassword: '123qweASD/',
    timeoutMs: 10_000,
    maxResponseBytes: 128 * 1024,
}

describe('Garanti VP hash vectors', () => {
    it.each([
        {
            name: 'order inquiry',
            orderId: '64fae2fefe604721a082650873865e45',
            expected:
                '3255D0F62BE0691F4D454A2B047325638E9ACAF71BF6BD511D4EF34ABD7D50563513046A76B7B0BFA2BAA7A7C7E3FAA902473D35CA57E94D40487544E03F4000',
        },
        {
            name: 'void',
            orderId: '981fb46e0d464dab9de9f392f090a892',
            expected:
                'F1C66A60A57F9DB0657A52708BFDD84BBD17E0CC5B00A0E5DEA2417EAD76058A9F2B97DF232D9918CAC917EDA4C99E8FA971EBC0395CD37879AD689689E2C9EF',
        },
        {
            name: 'refund',
            orderId: 'ec2e065b7e32496a8986a18957a7e60e',
            expected:
                'F252824795D1128797922A61320819721E5D178BDF6401C09EF742DF5833A88559978CCC164B8161FD4424DBB77D80BAC470991A549E774A8F490C47EC717B38',
        },
    ])('matches the official $name example', ({ orderId, expected }) => {
        expect(
            buildGarantiVpHash({
                provisionPassword: '123qweASD/',
                terminalId: '30691297',
                orderId,
                amount: '10000',
                currencyCode: '949',
            })
        ).toBe(expected)
    })
})

describe('Garanti VP configuration and XML', () => {
    it('rejects TEST/PROD endpoint mismatches', () => {
        expect(() =>
            parseGarantiVpConfig({
                GARANTI_OPERATIONS_ENABLED: 'true',
                GARANTI_POS_MODE: 'PROD',
                GARANTI_POS_API_VERSION: '512',
                GARANTI_POS_MERCHANT_ID: '7000679',
                GARANTI_POS_TERMINAL_ID: '30691297',
                GARANTI_POS_VP_URL: 'https://sanalposprovtest.garantibbva.com.tr/VPServlet',
                GARANTI_VP_USER_ID: 'PROVAUT',
                GARANTI_INQUIRY_PROV_USER_ID: 'PROVAUT',
                GARANTI_INQUIRY_PROVISION_PASSWORD: 'secret',
                GARANTI_REFUND_PROV_USER_ID: 'PROVRFN',
                GARANTI_REFUND_PROVISION_PASSWORD: 'secret',
            })
        ).toThrow('GARANTI_VP_CONFIG_INVALID')
    })

    it('reuses the hosted-payment terminal user when no separate VP user is set', () => {
        expect(
            parseGarantiVpConfig({
                GARANTI_OPERATIONS_ENABLED: 'true',
                GARANTI_POS_MODE: 'TEST',
                GARANTI_POS_API_VERSION: '512',
                GARANTI_POS_MERCHANT_ID: '7000679',
                GARANTI_POS_TERMINAL_ID: '30691297',
                GARANTI_POS_VP_URL: 'https://sanalposprovtest.garantibbva.com.tr/VPServlet',
                GARANTI_POS_TERMINAL_USER_ID: 'TERMINALUSER',
                GARANTI_INQUIRY_PROV_USER_ID: 'PROVAUT',
                GARANTI_INQUIRY_PROVISION_PASSWORD: 'secret',
                GARANTI_REFUND_PROV_USER_ID: 'PROVRFN',
                GARANTI_REFUND_PROVISION_PASSWORD: 'secret',
            }).userId
        ).toBe('TERMINALUSER')
    })

    it('builds a refund request without card data and escapes customer values', () => {
        const xml = buildGarantiVpRequestXml(config, 'refund', {
            orderId: 'ec2e065b7e32496a8986a18957a7e60e',
            amount: '10000',
            currencyCode: '949',
            customerEmail: 'ops+test&safe@example.com',
            customerIp: '192.168.0.1',
        })

        expect(xml).toContain('<ProvUserID>PROVRFN</ProvUserID>')
        expect(xml).toContain('<Type>refund</Type>')
        expect(xml).toContain('ops+test&amp;safe@example.com')
        expect(xml).not.toMatch(/<Card>|<Number>|<CVV2>/i)
        expect(xml).not.toContain(config.refundProvisionPassword)
    })
})

describe('Garanti VP response classification', () => {
    it('only confirms an inquiry when envelope, amount and bank reference match', () => {
        const response = parseGarantiVpResponse(
            'orderinq',
            `<?xml version="1.0" encoding="iso-8859-9"?>
            <GVPSResponse>
              <Mode>TEST</Mode>
              <Terminal><ProvUserID>PROVAUT</ProvUserID><UserID>PROVAUT</UserID><ID>30691297</ID><MerchantID>7000679</MerchantID></Terminal>
              <Order><OrderID>64fae2fefe604721a082650873865e45</OrderID><OrderInqResult>
                <Status>APPROVED</Status><AuthAmount>10000</AuthAmount><Code>00</Code><ReasonCode>00</ReasonCode>
                <RetrefNum>210707283286</RetrefNum><AuthCode>224386</AuthCode><InstallmentCnt>1</InstallmentCnt>
              </OrderInqResult></Order>
              <Transaction><Response><Code>00</Code><ReasonCode>00</ReasonCode><Message>Approved</Message></Response></Transaction>
            </GVPSResponse>`
        )

        expect(
            classifyGarantiOrderInquiry(response, {
                orderId: '64fae2fefe604721a082650873865e45',
                amount: '10000',
                terminalId: '30691297',
                merchantId: '7000679',
            })
        ).toEqual({
            status: 'approved',
            bankReferenceNumber: '210707283286',
            authorizationCode: '224386',
        })

        expect(
            classifyGarantiOrderInquiry(response, {
                orderId: '64fae2fefe604721a082650873865e45',
                amount: '9999',
                terminalId: '30691297',
                merchantId: '7000679',
            })
        ).toEqual({ status: 'mismatch', reason: 'amount' })
    })

    it('finds a confirmed reversal in order history without exposing raw XML', () => {
        const response = parseGarantiVpResponse(
            'orderhistoryinq',
            `<GVPSResponse>
              <Mode>TEST</Mode>
              <Terminal><ID>30691297</ID><MerchantID>7000679</MerchantID></Terminal>
              <Order><OrderID>981fb46e0d464dab9de9f392f090a892</OrderID><OrderHistInqResult><OrderTxnList>
                <OrderTxn><Type>sales</Type><Status>approved</Status><AuthAmount>10000</AuthAmount><ReturnCode>00</ReturnCode><CurrencyCode>949</CurrencyCode></OrderTxn>
                <OrderTxn><Type>void</Type><Status>approved</Status><AuthAmount>10000</AuthAmount><ReturnCode>00</ReturnCode><CurrencyCode>949</CurrencyCode><RetrefNum>210707283286</RetrefNum></OrderTxn>
              </OrderTxnList></OrderHistInqResult></Order>
              <Transaction><Response><Code>00</Code></Response></Transaction>
            </GVPSResponse>`
        )

        expect(
            findConfirmedGarantiReversal(response, { type: 'void', amount: '10000' })
        ).toMatchObject({
            type: 'void',
            returnCode: '00',
            authAmount: '10000',
        })
    })
})
