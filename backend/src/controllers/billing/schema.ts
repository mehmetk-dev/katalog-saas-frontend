import { z } from 'zod'

const trimmedText = (min: number, max: number, message: string) =>
    z.string().trim().min(min, message).max(max, message)

const optionalTrimmedText = (max: number) =>
    z
        .string()
        .trim()
        .max(max)
        .optional()
        .transform((value) => value || undefined)

export const checkoutDraftSchema = z
    .object({
        planId: z.enum(['plus', 'pro']),
        billingCycle: z.enum(['monthly', 'yearly']),
        invoiceType: z.enum(['individual', 'corporate']),
        fullName: trimmedText(2, 120, 'Ad soyad alanını kontrol edin.'),
        email: z
            .string()
            .trim()
            .email('Geçerli bir e-posta adresi girin.')
            .max(64, 'E-posta adresi en fazla 64 karakter olmalıdır.')
            .transform((value) => value.toLowerCase()),
        phone: z
            .string()
            .trim()
            .min(7, 'Telefon numarasını kontrol edin.')
            .max(20, 'Telefon numarasını kontrol edin.')
            .regex(/^[0-9+() .-]+$/, 'Telefon numarasını kontrol edin.'),
        identityNumber: optionalTrimmedText(11),
        taxNumber: optionalTrimmedText(10),
        companyName: optionalTrimmedText(200),
        taxOffice: optionalTrimmedText(120),
        address: trimmedText(5, 500, 'Fatura adresini kontrol edin.'),
        city: trimmedText(2, 100, 'İl alanını kontrol edin.'),
        district: trimmedText(2, 100, 'İlçe alanını kontrol edin.'),
        distanceSalesAccepted: z.literal(true),
        cancellationPolicyAccepted: z.literal(true),
    })
    .strict()
    .superRefine((data, ctx) => {
        if (data.invoiceType === 'individual') {
            if (!data.identityNumber || !/^[0-9]{11}$/.test(data.identityNumber)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['identityNumber'],
                    message: 'T.C. kimlik numarası 11 haneli olmalıdır.',
                })
            }
            return
        }

        if (!data.taxNumber || !/^[0-9]{10}$/.test(data.taxNumber)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['taxNumber'],
                message: 'Vergi numarası 10 haneli olmalıdır.',
            })
        }
        if (!data.companyName || data.companyName.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['companyName'],
                message: 'Şirket ünvanı zorunludur.',
            })
        }
        if (!data.taxOffice || data.taxOffice.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['taxOffice'],
                message: 'Vergi dairesi zorunludur.',
            })
        }
    })

export type CheckoutDraftInput = z.infer<typeof checkoutDraftSchema>

export function buildBillingDraftRpcParams(userId: string, input: CheckoutDraftInput) {
    return {
        p_user_id: userId,
        p_plan_id: input.planId,
        p_billing_cycle: input.billingCycle,
        p_invoice_type: input.invoiceType,
        p_full_name: input.fullName,
        p_email: input.email,
        p_phone: input.phone,
        p_identity_number: input.invoiceType === 'individual' ? input.identityNumber : null,
        p_tax_number: input.invoiceType === 'corporate' ? input.taxNumber : null,
        p_company_name: input.invoiceType === 'corporate' ? input.companyName : null,
        p_tax_office: input.invoiceType === 'corporate' ? input.taxOffice : null,
        p_billing_address: input.address,
        p_city: input.city,
        p_district: input.district,
    }
}
