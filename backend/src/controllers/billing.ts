import type { Request, Response } from 'express'

import type { AuthUser } from '../middlewares/auth'
import { supabase } from '../services/supabase'
import { buildBillingDraftRpcParams, checkoutDraftSchema } from './billing/schema'

interface BillingDraftRow {
    order_id: string
    order_status: 'draft'
    order_created_at: string
    order_updated_at: string
}

function getRequestUserId(req: Request): string {
    return (req as Request & { user: AuthUser }).user.id
}

export async function saveCheckoutDraft(req: Request, res: Response) {
    try {
        const parsed = checkoutDraftSchema.safeParse(req.body)
        if (!parsed.success) {
            return res.status(422).json({
                code: 'VALIDATION_ERROR',
                error: 'Fatura bilgilerini kontrol edin.',
                fields: parsed.error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                })),
            })
        }

        const userId = getRequestUserId(req)
        const { data, error } = await supabase.rpc(
            'save_billing_checkout_draft',
            buildBillingDraftRpcParams(userId, parsed.data)
        )

        if (error) {
            // Never log invoice input, identity/tax numbers or addresses.
            console.error('[billing] checkout draft could not be saved', { code: error.code })
            return res.status(500).json({
                code: 'BILLING_DRAFT_SAVE_FAILED',
                error: 'Fatura bilgileri kaydedilemedi. Lütfen tekrar deneyin.',
            })
        }

        const row = (Array.isArray(data) ? data[0] : data) as BillingDraftRow | null
        if (!row) {
            return res.status(500).json({
                code: 'BILLING_DRAFT_SAVE_FAILED',
                error: 'Ödeme taslağı oluşturulamadı. Lütfen tekrar deneyin.',
            })
        }

        return res.status(200).json({
            draft: {
                id: row.order_id,
                status: row.order_status,
                createdAt: row.order_created_at,
                updatedAt: row.order_updated_at,
            },
        })
    } catch {
        return res.status(500).json({
            code: 'BILLING_DRAFT_SAVE_FAILED',
            error: 'Fatura bilgileri kaydedilemedi. Lütfen tekrar deneyin.',
        })
    }
}
