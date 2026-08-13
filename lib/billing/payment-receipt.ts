import { z } from 'zod'

const merchantSchema = z
    .object({
        legalName: z.string().min(2).max(200),
        taxNumber: z.string().regex(/^[0-9]{10}$/),
        taxOffice: z.string().min(2).max(120),
        address: z.string().min(5).max(500),
        phone: z.string().min(7).max(20),
        supportEmail: z.string().email().max(254).optional(),
        website: z.string().url().max(300).optional(),
    })
    .strict()

const customerSchema = z
    .object({
        invoiceType: z.enum(['individual', 'corporate']),
        displayName: z.string().min(2).max(200),
        email: z.string().email().max(254),
        phone: z.string().min(7).max(20),
        city: z.string().min(2).max(100),
        district: z.string().min(2).max(100),
    })
    .strict()

const paymentSchema = z
    .object({
        provider: z.string().min(2).max(100),
        reference: z.string().min(2).max(200),
        methodType: z.enum(['card', 'bank_transfer', 'wallet']).optional(),
        installmentCount: z.number().int().min(1).max(48).optional(),
    })
    .strict()

export const paymentReceiptPayloadSchema = z
    .object({
        schemaVersion: z.literal(1),
        documentType: z.literal('payment_receipt'),
        documentNumber: z.string().min(12).max(64),
        orderId: z.string().uuid(),
        planId: z.enum(['plus', 'pro']),
        billingCycle: z.enum(['monthly', 'yearly']),
        currency: z.string().regex(/^[A-Z]{3}$/),
        subtotalAmount: z.number().nonnegative(),
        vatRate: z.number().min(0).max(1),
        vatAmount: z.number().nonnegative(),
        totalAmount: z.number().positive(),
        paidAt: z.string().datetime({ offset: true }),
        payment: paymentSchema,
        customer: customerSchema,
        merchant: merchantSchema,
    })
    .strict()

export type PaymentReceiptPayload = z.infer<typeof paymentReceiptPayloadSchema>
