import { z } from 'zod'

const merchantSnapshotSchema = z
    .object({
        legalName: z.string().trim().min(2).max(200),
        taxNumber: z.string().trim().regex(/^[0-9]{10}$/),
        taxOffice: z.string().trim().min(2).max(120),
        address: z.string().trim().min(5).max(500),
        phone: z.string().trim().min(7).max(20),
        supportEmail: z.string().trim().email().max(254).optional(),
        website: z.string().trim().url().max(300).optional(),
    })
    .strict()

export type BillingMerchantSnapshot = z.infer<typeof merchantSnapshotSchema>

// Public legal identity from the FogCatalog distance-sales and KVKK pages.
// Environment variables may override these values without changing code.
const DEFAULT_MERCHANT: BillingMerchantSnapshot = {
    legalName: 'Burcu Aldığ',
    taxNumber: '0510559196',
    taxOffice: 'Nilüfer V.D.',
    address: '23 Nisan Mah. 241. Sk. No: 8 İç Kapı No: 42 Nilüfer / BURSA / TÜRKİYE',
    phone: '+90 545 395 42 03',
    supportEmail: 'info@fogcatalog.com',
    website: 'https://www.fogcatalog.com',
}

function optionalEnv(name: string): string | undefined {
    const value = process.env[name]?.trim()
    return value || undefined
}

export function getBillingMerchantSnapshot(): BillingMerchantSnapshot {
    return merchantSnapshotSchema.parse({
        legalName: optionalEnv('BILLING_MERCHANT_LEGAL_NAME') ?? DEFAULT_MERCHANT.legalName,
        taxNumber: optionalEnv('BILLING_MERCHANT_TAX_NUMBER') ?? DEFAULT_MERCHANT.taxNumber,
        taxOffice: optionalEnv('BILLING_MERCHANT_TAX_OFFICE') ?? DEFAULT_MERCHANT.taxOffice,
        address: optionalEnv('BILLING_MERCHANT_ADDRESS') ?? DEFAULT_MERCHANT.address,
        phone: optionalEnv('BILLING_MERCHANT_PHONE') ?? DEFAULT_MERCHANT.phone,
        supportEmail:
            optionalEnv('BILLING_MERCHANT_SUPPORT_EMAIL') ?? DEFAULT_MERCHANT.supportEmail,
        website: optionalEnv('BILLING_MERCHANT_WEBSITE') ?? DEFAULT_MERCHANT.website,
    })
}
