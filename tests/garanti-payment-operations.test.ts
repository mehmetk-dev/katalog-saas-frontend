import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { sanitizePaymentAlertDetails } from '../backend/src/services/payment-alert-sanitizer'

const migration = readFileSync(
    resolve('supabase/migrations/20260813193000_garanti_payment_operations.sql'),
    'utf8'
)
const worker = readFileSync(resolve('backend/src/workers/payment-operation-worker.ts'), 'utf8')
const queue = readFileSync(resolve('backend/src/services/payment-operation-queue.ts'), 'utf8')
const paymentController = readFileSync(
    resolve('backend/src/controllers/billing/payments.ts'),
    'utf8'
)

describe('Garanti payment operations migration', () => {
    it('keeps operations and alerts backend-only with RLS enabled', () => {
        for (const table of [
            'billing_subscription_grants',
            'billing_payment_operations',
            'billing_payment_alerts',
        ]) {
            expect(migration).toMatch(
                new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, 'i')
            )
            expect(migration).toMatch(
                new RegExp(`REVOKE ALL ON public\\.${table} FROM PUBLIC, anon, authenticated`, 'i')
            )
        }
        expect(migration).not.toMatch(/SECURITY DEFINER/i)
    })

    it('provides idempotent reconciliation and reversal RPCs', () => {
        expect(migration).toContain('billing_payment_operations_idempotency_unique')
        expect(migration).toContain('billing_payment_operations_one_reconciliation_idx')
        expect(migration).toContain('ensure_garanti_reconciliation')
        expect(migration).toContain('create_garanti_reversal_operation')
        expect(migration).toContain('complete_garanti_reconciliation')
        expect(migration).toContain('complete_garanti_reversal')
        expect(migration).toMatch(/IF v_operation\.status = 'succeeded' THEN RETURN; END IF;/)
    })

    it('stores the validated transaction customer IP for later bank operations', () => {
        expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS customer_ip inet/i)
        expect(paymentController).toMatch(/isIP\(candidate\)/)
        expect(paymentController).toMatch(/customer_ip: customerIp/)
    })

    it('voids only an untouched same-day full payment', () => {
        expect(migration).toMatch(/v_order\.refunded_amount_minor = 0/)
        expect(migration).toMatch(/p_amount_minor = v_attempt\.amount_minor/)
        expect(migration).toContain("AT TIME ZONE 'Europe/Istanbul'")
    })

    it('does not let an old refund overwrite a newer entitlement', () => {
        expect(migration).toContain('billing_subscription_grants')
        expect(migration).toMatch(/newer\.created_at > v_grant\.created_at/)
        expect(migration).toMatch(/subscription_end = v_grant\.granted_subscription_end/)
    })
})

describe('payment worker safety', () => {
    it('does not let BullMQ blindly retry financial mutations', () => {
        expect(queue).toMatch(/attempts:\s*1/)
        expect(worker).toContain('verification_pending')
        expect(worker).toContain('orderHistoryInquiry')
        expect(worker).toContain('Never resend it')
        expect(worker).toContain('RECONCILIATION_DELAYS_SECONDS = [120, 180, 600, 2700]')
    })

    it('removes secrets and personal data from alert details', () => {
        expect(
            sanitizePaymentAlertDetails({
                bankCode: '00',
                retryCount: 2,
                provisionPassword: 'secret',
                storeKey: 'secret',
                rawXml: '<xml />',
                customerEmail: 'person@example.com',
                cardNumber: '4111111111111111',
            })
        ).toEqual({ bankCode: '00', retryCount: 2 })
    })
})
