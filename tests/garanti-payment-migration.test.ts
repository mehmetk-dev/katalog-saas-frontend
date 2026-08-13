import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = join(
    process.cwd(),
    'supabase/migrations/20260813152000_garanti_payment_flow.sql'
)
const billingFoundationPath = join(
    process.cwd(),
    'supabase/migrations/20260804112823_billing_foundation.sql'
)
const billingConflictRepairPath = join(
    process.cwd(),
    'supabase/migrations/20260813170000_fix_billing_checkout_draft_conflict.sql'
)

describe('Garanti payment migration', () => {
    const migration = readFileSync(migrationPath, 'utf8')

    it('keeps payment attempts backend-only with RLS and explicit grants', () => {
        expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS public\.billing_payment_attempts/i)
        expect(migration).toMatch(
            /ALTER TABLE public\.billing_payment_attempts ENABLE ROW LEVEL SECURITY/i
        )
        expect(migration).toMatch(
            /REVOKE ALL ON public\.billing_payment_attempts FROM PUBLIC, anon, authenticated/i
        )
        expect(migration).toMatch(
            /GRANT SELECT, INSERT, UPDATE ON public\.billing_payment_attempts TO service_role/i
        )
    })

    it('locks and reuses pending attempts so duplicate clicks cannot create charges', () => {
        expect(migration).toMatch(/CREATE OR REPLACE FUNCTION public\.start_garanti_payment/i)
        expect(migration).toMatch(/FOR UPDATE/i)
        expect(migration).toMatch(/payment_pending/i)
        expect(migration).toMatch(/reused boolean/i)
        expect(migration).toMatch(/provider_order_id/i)
    })

    it('finalizes payment and plan activation in the same database transaction', () => {
        expect(migration).toMatch(/CREATE OR REPLACE FUNCTION public\.finalize_garanti_payment/i)
        expect(migration).toMatch(/UPDATE public\.billing_orders/i)
        expect(migration).toMatch(/UPDATE public\.users/i)
        expect(migration).toMatch(/subscription_status = 'active'/i)
        expect(migration).toMatch(/interval '1 month'/i)
        expect(migration).toMatch(/interval '1 year'/i)
    })

    it('does not expose payment RPCs to browser roles', () => {
        expect(migration).toMatch(
            /REVOKE EXECUTE ON FUNCTION public\.start_garanti_payment[\s\S]*FROM PUBLIC, anon, authenticated/i
        )
        expect(migration).toMatch(
            /GRANT EXECUTE ON FUNCTION public\.start_garanti_payment[\s\S]*TO service_role/i
        )
        expect(migration).toMatch(/SECURITY INVOKER/i)
    })
})

describe('Billing checkout migration', () => {
    const billingFoundation = readFileSync(billingFoundationPath, 'utf8')
    const billingConflictRepair = readFileSync(billingConflictRepairPath, 'utf8')

    it('uses the primary-key constraint as the conflict target to avoid PL/pgSQL ambiguity', () => {
        expect(billingFoundation).toMatch(
            /ON CONFLICT ON CONSTRAINT billing_order_details_pkey DO UPDATE SET/i
        )
        expect(billingConflictRepair).toMatch(
            /ON CONFLICT ON CONSTRAINT billing_order_details_pkey DO UPDATE SET/i
        )
        expect(billingFoundation).not.toMatch(/ON CONFLICT \(order_id\) DO UPDATE SET/i)
    })
})
