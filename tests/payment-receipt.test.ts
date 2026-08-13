import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createBillingDocumentToken } from '../backend/src/services/billing-document-token'
import { getBillingMerchantSnapshot } from '../backend/src/services/billing-merchant-config'
import {
    getBillingDocumentRelativePath,
    resolveBillingDocumentObjectKey,
} from '../backend/src/services/pdf-export-storage'
import { paymentReceiptPayloadSchema } from '@/lib/billing/payment-receipt'
import {
    FOGCATALOG_COMPANY,
    FOGCATALOG_LEGAL_ADDRESS,
} from '@/lib/legal/fogcatalog-company'
import { verifyBillingDocumentToken } from '@/lib/server/billing-document-token'

const originalSecret = process.env.WORKER_EXPORT_SECRET
const originalPrefix = process.env.R2_BILLING_DOCUMENT_PREFIX
const merchantEnvNames = [
    'BILLING_MERCHANT_LEGAL_NAME',
    'BILLING_MERCHANT_TAX_NUMBER',
    'BILLING_MERCHANT_TAX_OFFICE',
    'BILLING_MERCHANT_ADDRESS',
    'BILLING_MERCHANT_PHONE',
    'BILLING_MERCHANT_SUPPORT_EMAIL',
    'BILLING_MERCHANT_WEBSITE',
] as const
const originalMerchantEnv = Object.fromEntries(
    merchantEnvNames.map((name) => [name, process.env[name]])
) as Record<(typeof merchantEnvNames)[number], string | undefined>

const validPayload = {
    schemaVersion: 1 as const,
    documentType: 'payment_receipt' as const,
    documentNumber: 'FC-DK-20260804-ABCDEF1234',
    orderId: '0b985d28-a27d-4017-bfb7-4e819decd899',
    planId: 'pro' as const,
    billingCycle: 'yearly' as const,
    currency: 'TRY',
    subtotalAmount: 8333.33,
    vatRate: 0.2,
    vatAmount: 1666.67,
    totalAmount: 10000,
    paidAt: '2026-08-04T12:00:00.000+00:00',
    payment: {
        provider: 'Bank POS',
        reference: 'PAY-123456789',
        methodType: 'card' as const,
        installmentCount: 1,
    },
    customer: {
        invoiceType: 'corporate' as const,
        displayName: 'Örnek Teknoloji A.Ş.',
        email: 'muhasebe@example.com',
        phone: '05555555555',
        city: 'İstanbul',
        district: 'Kadıköy',
    },
    merchant: {
        legalName: FOGCATALOG_COMPANY.legalName,
        taxNumber: FOGCATALOG_COMPANY.taxNumber,
        taxOffice: FOGCATALOG_COMPANY.taxOffice,
        address: FOGCATALOG_LEGAL_ADDRESS,
        phone: FOGCATALOG_COMPANY.phone,
        supportEmail: FOGCATALOG_COMPANY.email,
        website: FOGCATALOG_COMPANY.website,
    },
}

beforeEach(() => {
    process.env.WORKER_EXPORT_SECRET = 'test-worker-secret-that-is-long-enough'
    for (const name of merchantEnvNames) delete process.env[name]
})

afterEach(() => {
    if (originalSecret === undefined) delete process.env.WORKER_EXPORT_SECRET
    else process.env.WORKER_EXPORT_SECRET = originalSecret

    if (originalPrefix === undefined) delete process.env.R2_BILLING_DOCUMENT_PREFIX
    else process.env.R2_BILLING_DOCUMENT_PREFIX = originalPrefix

    for (const name of merchantEnvNames) {
        const value = originalMerchantEnv[name]
        if (value === undefined) delete process.env[name]
        else process.env[name] = value
    }
})

describe('payment receipt foundation', () => {
    it('accepts a paid receipt snapshot without full identity or tax identifiers', () => {
        expect(paymentReceiptPayloadSchema.parse(validPayload)).toEqual(validPayload)

        const withSensitiveIdentity = {
            ...validPayload,
            customer: { ...validPayload.customer, identityNumber: '11111111111' },
        }
        expect(paymentReceiptPayloadSchema.safeParse(withSensitiveIdentity).success).toBe(false)
    })

    it('rejects incomplete payment evidence', () => {
        const invalid = {
            ...validPayload,
            payment: { ...validPayload.payment, reference: '' },
        }
        expect(paymentReceiptPayloadSchema.safeParse(invalid).success).toBe(false)
    })

    it('rejects card PAN, CVC and card fragments from the receipt snapshot', () => {
        const withCardData = {
            ...validPayload,
            payment: {
                ...validPayload.payment,
                cardNumber: '4242424242424242',
                cardLast4: '4242',
                cvc: '123',
            },
        }

        expect(paymentReceiptPayloadSchema.safeParse(withCardData).success).toBe(false)
    })

    it('uses the public legal-page identity for the payment recipient', () => {
        expect(getBillingMerchantSnapshot()).toEqual({
            legalName: FOGCATALOG_COMPANY.legalName,
            taxNumber: FOGCATALOG_COMPANY.taxNumber,
            taxOffice: FOGCATALOG_COMPANY.taxOffice,
            address: FOGCATALOG_LEGAL_ADDRESS,
            phone: FOGCATALOG_COMPANY.phone,
            supportEmail: FOGCATALOG_COMPANY.email,
            website: FOGCATALOG_COMPANY.website,
        })
    })

    it('uses a scope-separated, expiring worker render token', () => {
        const documentId = 'd49fb177-210a-419d-9c95-d894e00e0c4d'
        const token = createBillingDocumentToken(documentId, 60_000)

        expect(verifyBillingDocumentToken(documentId, token)).toBe(true)
        expect(
            verifyBillingDocumentToken('8f875f7f-3823-4e08-9aeb-afb30f59f7f2', token)
        ).toBe(false)
        expect(verifyBillingDocumentToken(documentId, `${documentId}.1.invalid`)).toBe(false)
    })

    it('keeps receipt objects in a private billing-document prefix', () => {
        process.env.R2_BILLING_DOCUMENT_PREFIX = '/billing-receipts/'
        const relativePath = getBillingDocumentRelativePath({
            documentId: 'd49fb177-210a-419d-9c95-d894e00e0c4d',
            documentNumber: 'FC-DK-20260804-ABCDEF1234',
        })

        expect(relativePath).toBe('fc-dk-20260804-abcdef1234-d49fb177-210.pdf')
        expect(resolveBillingDocumentObjectKey(relativePath)).toBe(
            `billing-receipts/${relativePath}`
        )
        expect(() => resolveBillingDocumentObjectKey('../receipt.pdf')).toThrow(
            'Invalid PDF export key'
        )
    })

    it('keeps paid-order gating and snapshot immutability in the migration', () => {
        const migration = readFileSync(
            join(
                process.cwd(),
                'supabase/migrations/20260804112823_billing_foundation.sql'
            ),
            'utf8'
        )

        expect(migration).toContain("v_order.status <> 'paid'")
        expect(migration).toContain('protect_billing_document_snapshot')
        expect(migration).toContain('REVOKE ALL ON public.billing_documents')
        expect(migration).toContain('complete_billing_document')
        expect(migration).not.toMatch(/\bcard_brand\b|\bcard_last4\b/)
    })
})
