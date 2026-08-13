'use server'

import { z } from 'zod'

import { apiFetch } from '@/lib/api'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const optionalTrimmedText = (maxLength: number) =>
    z
        .string()
        .trim()
        .max(maxLength)
        .optional()
        .transform((value) => value || undefined)

const checkoutDraftPayloadSchema = z
    .object({
        planId: z.enum(['plus', 'pro']),
        billingCycle: z.enum(['monthly', 'yearly']),
        invoiceType: z.enum(['individual', 'corporate']),
        fullName: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(254),
        phone: z
            .string()
            .trim()
            .min(7)
            .max(20)
            .regex(/^[0-9+() .-]+$/),
        identityNumber: optionalTrimmedText(11),
        taxNumber: optionalTrimmedText(10),
        companyName: optionalTrimmedText(200),
        taxOffice: optionalTrimmedText(120),
        address: z.string().trim().min(5).max(500),
        city: z.string().trim().min(2).max(100),
        district: z.string().trim().min(2).max(100),
        distanceSalesAccepted: z.literal(true),
        cancellationPolicyAccepted: z.literal(true),
    })
    .strict()
    .superRefine((data, context) => {
        if (data.invoiceType === 'individual') {
            if (!data.identityNumber || !/^[0-9]{11}$/.test(data.identityNumber)) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['identityNumber'],
                    message: 'Invalid identity number',
                })
            }
            return
        }

        if (!data.taxNumber || !/^[0-9]{10}$/.test(data.taxNumber)) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['taxNumber'],
                message: 'Invalid tax number',
            })
        }
        if (!data.companyName || data.companyName.length < 2) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['companyName'],
                message: 'Company name is required',
            })
        }
        if (!data.taxOffice || data.taxOffice.length < 2) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['taxOffice'],
                message: 'Tax office is required',
            })
        }
    })

export type CheckoutDraftPayload = z.input<typeof checkoutDraftPayloadSchema>

interface BillingDraftResponse {
    draft: {
        id: string
        status: 'draft'
        createdAt: string
        updatedAt: string
    }
}

export type SaveCheckoutDraftResult =
    | ({ success: true } & BillingDraftResponse)
    | {
          success: false
          code: 'AUTH_REQUIRED' | 'VALIDATION_ERROR' | 'SAVE_FAILED'
      }

export interface HostedPaymentForm {
    action: string
    method: 'POST'
    fields: Record<string, string>
}

interface GarantiPaymentResponse {
    payment: {
        orderId: string
        status: 'payment_pending'
        form: HostedPaymentForm
    }
}

export type StartGarantiPaymentResult =
    | ({ success: true } & GarantiPaymentResponse)
    | {
          success: false
          code:
              | 'AUTH_REQUIRED'
              | 'VALIDATION_ERROR'
              | 'PAYMENT_UNAVAILABLE'
              | 'PAYMENT_START_FAILED'
      }

export interface BillingPaymentStatus {
    orderId: string
    status: 'draft' | 'payment_pending' | 'paid' | 'payment_failed' | 'cancelled' | 'refunded'
    planId: 'plus' | 'pro'
    billingCycle: 'monthly' | 'yearly'
    total: number | null
    currency: string
    paidAt: string | null
    updatedAt: string
}

function getErrorStatus(error: unknown): number | undefined {
    if (!error || typeof error !== 'object' || !('status' in error)) return undefined
    return typeof error.status === 'number' ? error.status : undefined
}

export async function saveCheckoutDraft(
    payload: CheckoutDraftPayload
): Promise<SaveCheckoutDraftResult> {
    const parsed = checkoutDraftPayloadSchema.safeParse(payload)
    if (!parsed.success) {
        return { success: false, code: 'VALIDATION_ERROR' }
    }

    const supabase = await createServerSupabaseClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, code: 'AUTH_REQUIRED' }
    }

    try {
        const response = await apiFetch<BillingDraftResponse>('/billing/checkout-draft', {
            method: 'PUT',
            body: JSON.stringify(parsed.data),
        })

        return { success: true, ...response }
    } catch (error: unknown) {
        const status = getErrorStatus(error)
        if (status === 401 || status === 403) {
            return { success: false, code: 'AUTH_REQUIRED' }
        }
        if (status === 400 || status === 422) {
            return { success: false, code: 'VALIDATION_ERROR' }
        }

        return { success: false, code: 'SAVE_FAILED' }
    }
}

export async function startGarantiPayment(orderId: string): Promise<StartGarantiPaymentResult> {
    const parsedOrderId = z.string().uuid().safeParse(orderId)
    if (!parsedOrderId.success) {
        return { success: false, code: 'VALIDATION_ERROR' }
    }

    const supabase = await createServerSupabaseClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, code: 'AUTH_REQUIRED' }
    }

    try {
        const response = await apiFetch<GarantiPaymentResponse>('/billing/payments/garanti', {
            method: 'POST',
            headers: { 'Idempotency-Key': parsedOrderId.data },
            body: JSON.stringify({ orderId: parsedOrderId.data }),
        })
        return { success: true, ...response }
    } catch (error: unknown) {
        const status = getErrorStatus(error)
        if (status === 401 || status === 403) {
            return { success: false, code: 'AUTH_REQUIRED' }
        }
        if (status === 400 || status === 422) {
            return { success: false, code: 'VALIDATION_ERROR' }
        }
        if (status === 503) {
            return { success: false, code: 'PAYMENT_UNAVAILABLE' }
        }
        return { success: false, code: 'PAYMENT_START_FAILED' }
    }
}

export async function getBillingPaymentStatus(
    orderId: string
): Promise<BillingPaymentStatus | null> {
    const parsedOrderId = z.string().uuid().safeParse(orderId)
    if (!parsedOrderId.success) return null

    try {
        const response = await apiFetch<{ payment: BillingPaymentStatus }>(
            `/billing/orders/${parsedOrderId.data}/payment-status`,
            { method: 'GET' }
        )
        return response.payment
    } catch {
        return null
    }
}
