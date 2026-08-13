"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentReceiptDocument = createPaymentReceiptDocument;
exports.getBillingDocument = getBillingDocument;
exports.downloadBillingDocument = downloadBillingDocument;
exports.getBillingDocumentRenderData = getBillingDocumentRenderData;
const zod_1 = require("zod");
const billing_document_queue_1 = require("../services/billing-document-queue");
const billing_merchant_config_1 = require("../services/billing-merchant-config");
const billing_document_token_1 = require("../services/billing-document-token");
const pdf_export_storage_1 = require("../services/pdf-export-storage");
const supabase_1 = require("../services/supabase");
const uuidSchema = zod_1.z.string().uuid();
function getRequestUserId(req) {
    return req.user.id;
}
function documentResponse(row) {
    return {
        id: row.id,
        orderId: row.order_id,
        type: row.document_type,
        number: row.document_number,
        status: row.status,
        fileSizeBytes: row.file_size_bytes,
        attempts: row.attempts,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
async function getOwnedDocument(documentId, userId) {
    const { data, error } = await supabase_1.supabase
        .from('billing_documents')
        .select('id,order_id,user_id,document_type,document_number,status,file_path,file_size_bytes,file_sha256,error_message,attempts,started_at,completed_at,created_at,updated_at')
        .eq('id', documentId)
        .eq('user_id', userId)
        .maybeSingle();
    if (error || !data)
        return null;
    return data;
}
async function createPaymentReceiptDocument(req, res) {
    const orderId = uuidSchema.safeParse(req.params.orderId);
    if (!orderId.success) {
        return res.status(400).json({ error: 'Geçersiz sipariş kimliği.' });
    }
    if (!(0, billing_document_queue_1.isBillingDocumentQueueConfigured)()) {
        return res.status(503).json({ error: 'Dekont oluşturma servisi henüz hazır değil.' });
    }
    let merchant;
    try {
        merchant = (0, billing_merchant_config_1.getBillingMerchantSnapshot)();
    }
    catch {
        return res.status(503).json({ error: 'Satıcı fatura bilgileri henüz yapılandırılmadı.' });
    }
    try {
        const userId = getRequestUserId(req);
        const { data, error } = await supabase_1.supabase.rpc('create_payment_receipt_document', {
            p_user_id: userId,
            p_order_id: orderId.data,
            p_merchant: merchant,
        });
        if (error) {
            if (error.message.includes('verified paid order')) {
                return res.status(409).json({
                    error: 'Ödeme bankadan doğrulanmadan dekont oluşturulamaz.',
                });
            }
            if (error.message.includes('not found')) {
                return res.status(404).json({ error: 'Ödeme siparişi bulunamadı.' });
            }
            console.error('[billing-documents] receipt record creation failed', {
                code: error.code,
            });
            return res.status(500).json({ error: 'Dekont kaydı oluşturulamadı.' });
        }
        const row = (Array.isArray(data) ? data[0] : data);
        if (!row) {
            return res.status(500).json({ error: 'Dekont kaydı oluşturulamadı.' });
        }
        let documentStatus = row.document_status;
        let shouldEnqueue = !row.reused || row.document_status === 'queued';
        if (row.reused && row.document_status === 'failed') {
            const { error: retryError } = await supabase_1.supabase
                .from('billing_documents')
                .update({ status: 'queued', error_message: null })
                .eq('id', row.document_id)
                .eq('status', 'failed');
            if (retryError) {
                return res.status(500).json({ error: 'Dekont yeniden sıraya alınamadı.' });
            }
            documentStatus = 'queued';
            shouldEnqueue = true;
        }
        if (shouldEnqueue) {
            try {
                await (0, billing_document_queue_1.enqueueBillingDocument)({ documentId: row.document_id, userId });
            }
            catch {
                await supabase_1.supabase
                    .from('billing_documents')
                    .update({ status: 'failed', error_message: 'Document queue unavailable' })
                    .eq('id', row.document_id);
                return res.status(503).json({ error: 'Dekont oluşturma kuyruğuna ulaşılamadı.' });
            }
        }
        return res.status(shouldEnqueue ? 202 : 200).json({
            document: {
                id: row.document_id,
                orderId: orderId.data,
                type: 'payment_receipt',
                number: row.receipt_number,
                status: documentStatus,
                createdAt: row.document_created_at,
            },
            reused: row.reused,
        });
    }
    catch {
        return res.status(500).json({ error: 'Dekont kaydı oluşturulamadı.' });
    }
}
async function getBillingDocument(req, res) {
    const documentId = uuidSchema.safeParse(req.params.id);
    if (!documentId.success) {
        return res.status(400).json({ error: 'Geçersiz belge kimliği.' });
    }
    try {
        const document = await getOwnedDocument(documentId.data, getRequestUserId(req));
        if (!document)
            return res.status(404).json({ error: 'Dekont bulunamadı.' });
        return res.json({ document: documentResponse(document) });
    }
    catch {
        return res.status(500).json({ error: 'Dekont bilgisi alınamadı.' });
    }
}
async function downloadBillingDocument(req, res) {
    const documentId = uuidSchema.safeParse(req.params.id);
    if (!documentId.success) {
        return res.status(400).json({ error: 'Geçersiz belge kimliği.' });
    }
    try {
        const document = await getOwnedDocument(documentId.data, getRequestUserId(req));
        if (!document)
            return res.status(404).json({ error: 'Dekont bulunamadı.' });
        if (document.status !== 'completed' || !document.file_path) {
            return res.status(409).json({ error: 'Dekont henüz hazır değil.' });
        }
        const url = await (0, pdf_export_storage_1.getBillingDocumentSignedUrl)(document.file_path, {
            ttlSeconds: 10 * 60,
            downloadFilename: `fogcatalog-odeme-dekontu-${document.document_number}.pdf`,
        });
        return res.redirect(302, url);
    }
    catch {
        return res.status(500).json({ error: 'Dekont indirme bağlantısı oluşturulamadı.' });
    }
}
async function getBillingDocumentRenderData(req, res) {
    const documentId = uuidSchema.safeParse(req.params.id);
    if (!documentId.success || !(0, billing_document_token_1.verifyBillingDocumentToken)(req.params.id, req.query.token)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const { data, error } = await supabase_1.supabase
            .from('billing_documents')
            .select('id,document_number,status,document_payload')
            .eq('id', documentId.data)
            .maybeSingle();
        if (error || !data)
            return res.status(404).json({ error: 'Dekont bulunamadı.' });
        if (!['queued', 'processing'].includes(data.status)) {
            return res.status(409).json({ error: 'Dekont render için uygun durumda değil.' });
        }
        return res.json({
            document: {
                id: data.id,
                number: data.document_number,
                payload: data.document_payload,
            },
        });
    }
    catch {
        return res.status(500).json({ error: 'Dekont render verisi alınamadı.' });
    }
}
