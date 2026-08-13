"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBillingMerchantSnapshot = getBillingMerchantSnapshot;
const zod_1 = require("zod");
const merchantSnapshotSchema = zod_1.z
    .object({
    legalName: zod_1.z.string().trim().min(2).max(200),
    taxNumber: zod_1.z.string().trim().regex(/^[0-9]{10}$/),
    taxOffice: zod_1.z.string().trim().min(2).max(120),
    address: zod_1.z.string().trim().min(5).max(500),
    phone: zod_1.z.string().trim().min(7).max(20),
    supportEmail: zod_1.z.string().trim().email().max(254).optional(),
    website: zod_1.z.string().trim().url().max(300).optional(),
})
    .strict();
// Public legal identity from the FogCatalog distance-sales and KVKK pages.
// Environment variables may override these values without changing code.
const DEFAULT_MERCHANT = {
    legalName: 'Burcu Aldığ',
    taxNumber: '0510559196',
    taxOffice: 'Nilüfer V.D.',
    address: '23 Nisan Mah. 241. Sk. No: 8 İç Kapı No: 42 Nilüfer / BURSA / TÜRKİYE',
    phone: '+90 545 395 42 03',
    supportEmail: 'info@fogcatalog.com',
    website: 'https://www.fogcatalog.com',
};
function optionalEnv(name) {
    const value = process.env[name]?.trim();
    return value || undefined;
}
function getBillingMerchantSnapshot() {
    return merchantSnapshotSchema.parse({
        legalName: optionalEnv('BILLING_MERCHANT_LEGAL_NAME') ?? DEFAULT_MERCHANT.legalName,
        taxNumber: optionalEnv('BILLING_MERCHANT_TAX_NUMBER') ?? DEFAULT_MERCHANT.taxNumber,
        taxOffice: optionalEnv('BILLING_MERCHANT_TAX_OFFICE') ?? DEFAULT_MERCHANT.taxOffice,
        address: optionalEnv('BILLING_MERCHANT_ADDRESS') ?? DEFAULT_MERCHANT.address,
        phone: optionalEnv('BILLING_MERCHANT_PHONE') ?? DEFAULT_MERCHANT.phone,
        supportEmail: optionalEnv('BILLING_MERCHANT_SUPPORT_EMAIL') ?? DEFAULT_MERCHANT.supportEmail,
        website: optionalEnv('BILLING_MERCHANT_WEBSITE') ?? DEFAULT_MERCHANT.website,
    });
}
