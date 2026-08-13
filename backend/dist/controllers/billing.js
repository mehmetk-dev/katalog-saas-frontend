"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCheckoutDraft = saveCheckoutDraft;
const supabase_1 = require("../services/supabase");
const schema_1 = require("./billing/schema");
function getRequestUserId(req) {
    return req.user.id;
}
async function saveCheckoutDraft(req, res) {
    try {
        const parsed = schema_1.checkoutDraftSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(422).json({
                code: 'VALIDATION_ERROR',
                error: 'Fatura bilgilerini kontrol edin.',
                fields: parsed.error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                })),
            });
        }
        const userId = getRequestUserId(req);
        const { data, error } = await supabase_1.supabase.rpc('save_billing_checkout_draft', (0, schema_1.buildBillingDraftRpcParams)(userId, parsed.data));
        if (error) {
            // Never log invoice input, identity/tax numbers or addresses.
            console.error('[billing] checkout draft could not be saved', { code: error.code });
            return res.status(500).json({
                code: 'BILLING_DRAFT_SAVE_FAILED',
                error: 'Fatura bilgileri kaydedilemedi. Lütfen tekrar deneyin.',
            });
        }
        const row = (Array.isArray(data) ? data[0] : data);
        if (!row) {
            return res.status(500).json({
                code: 'BILLING_DRAFT_SAVE_FAILED',
                error: 'Ödeme taslağı oluşturulamadı. Lütfen tekrar deneyin.',
            });
        }
        return res.status(200).json({
            draft: {
                id: row.order_id,
                status: row.order_status,
                createdAt: row.order_created_at,
                updatedAt: row.order_updated_at,
            },
        });
    }
    catch {
        return res.status(500).json({
            code: 'BILLING_DRAFT_SAVE_FAILED',
            error: 'Fatura bilgileri kaydedilemedi. Lütfen tekrar deneyin.',
        });
    }
}
