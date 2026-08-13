import { describe, expect, it } from 'vitest'

import {
    buildBillingDraftRpcParams,
    checkoutDraftSchema,
} from '../backend/src/controllers/billing/schema'

const baseDraft = {
    planId: 'plus' as const,
    billingCycle: 'monthly' as const,
    fullName: 'Test Kullanıcı',
    email: 'TEST@EXAMPLE.COM',
    phone: '05555555555',
    address: 'Test Mahallesi No: 1',
    city: 'Bursa',
    district: 'Nilüfer',
    distanceSalesAccepted: true as const,
    cancellationPolicyAccepted: true as const,
}

describe('billing checkout draft validation', () => {
    it('accepts an individual invoice and clears corporate-only fields', () => {
        const parsed = checkoutDraftSchema.parse({
            ...baseDraft,
            invoiceType: 'individual',
            identityNumber: '11111111111',
            taxNumber: '1234567890',
            companyName: 'Ignored Company',
            taxOffice: 'Ignored Office',
        })

        expect(buildBillingDraftRpcParams('user-1', parsed)).toMatchObject({
            p_user_id: 'user-1',
            p_email: 'test@example.com',
            p_identity_number: '11111111111',
            p_tax_number: null,
            p_company_name: null,
            p_tax_office: null,
        })
    })

    it('accepts a corporate invoice and clears the individual identity number', () => {
        const parsed = checkoutDraftSchema.parse({
            ...baseDraft,
            invoiceType: 'corporate',
            identityNumber: '11111111111',
            taxNumber: '1234567890',
            companyName: 'Fog Teknoloji A.Ş.',
            taxOffice: 'Nilüfer',
        })

        expect(buildBillingDraftRpcParams('user-1', parsed)).toMatchObject({
            p_identity_number: null,
            p_tax_number: '1234567890',
            p_company_name: 'Fog Teknoloji A.Ş.',
            p_tax_office: 'Nilüfer',
        })
    })

    it('rejects invalid invoice identifiers and missing agreement approval', () => {
        const invalidIdentity = checkoutDraftSchema.safeParse({
            ...baseDraft,
            invoiceType: 'individual',
            identityNumber: '123',
        })
        const missingAgreement = checkoutDraftSchema.safeParse({
            ...baseDraft,
            invoiceType: 'corporate',
            taxNumber: '1234567890',
            companyName: 'Fog Teknoloji A.Ş.',
            taxOffice: 'Nilüfer',
            distanceSalesAccepted: false,
        })

        expect(invalidIdentity.success).toBe(false)
        expect(missingAgreement.success).toBe(false)
    })

    it('rejects incomplete phone numbers and non-descriptive billing addresses', () => {
        const incompletePhone = checkoutDraftSchema.safeParse({
            ...baseDraft,
            invoiceType: 'individual',
            identityNumber: '11111111111',
            phone: '0555 55',
        })
        const incompleteAddress = checkoutDraftSchema.safeParse({
            ...baseDraft,
            invoiceType: 'individual',
            identityNumber: '11111111111',
            address: 'Bursa',
        })

        expect(incompletePhone.success).toBe(false)
        expect(incompleteAddress.success).toBe(false)
    })
})
