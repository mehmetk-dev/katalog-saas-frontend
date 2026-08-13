import { Router } from 'express'

import { saveCheckoutDraft } from '../controllers/billing'
import {
    getBillingPaymentStatus,
    handleGarantiPaymentCallback,
    initiateGarantiPayment,
} from '../controllers/billing/payments'
import {
    createPaymentReceiptDocument,
    downloadBillingDocument,
    getBillingDocument,
    getBillingDocumentRenderData,
} from '../controllers/billing-documents'
import { requireAuth } from '../middlewares/auth'
import {
    billingMutationLimiter,
    bankPaymentCallbackLimiter,
    publicPdfLimiter,
} from '../middlewares/rate-limiters'

const router = Router()

router.get('/documents/:id/render-data', publicPdfLimiter, getBillingDocumentRenderData)
router.post('/payments/garanti/callback', bankPaymentCallbackLimiter, handleGarantiPaymentCallback)

router.use(requireAuth)
router.put('/checkout-draft', billingMutationLimiter, saveCheckoutDraft)
router.post('/payments/garanti', billingMutationLimiter, initiateGarantiPayment)
router.get('/orders/:orderId/payment-status', getBillingPaymentStatus)
router.post('/orders/:orderId/receipt', billingMutationLimiter, createPaymentReceiptDocument)
router.get('/documents/:id/download', downloadBillingDocument)
router.get('/documents/:id', getBillingDocument)

export default router
