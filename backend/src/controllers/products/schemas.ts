import { z } from 'zod';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuidString = z.string().regex(UUID_REGEX, 'Invalid UUID format');

// SECURITY: Only allow image URLs from trusted sources
const ALLOWED_IMAGE_HOSTS = [
    'res.cloudinary.com',
    'api.cloudinary.com',
    'images.unsplash.com',        // Demo/placeholder images
    'plus.unsplash.com',
];

/** Validates that image URLs come from trusted CDN sources */
const trustedImageUrl = z.union([
    z.string().url().max(2048).refine((url) => {
        try {
            const hostname = new URL(url).hostname;
            return ALLOWED_IMAGE_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`));
        } catch {
            return false;
        }
    }, 'Image URL must be from a trusted source (Cloudinary)'),
    z.literal(''),
]).optional().nullable();

const customAttributeSchema = z.object({
    name: z.string().min(1),
    value: z.string(),
    unit: z.string().optional(),
}).strip();

export const createProductSchema = z.object({
    name: z.string().trim().min(2).max(200),
    sku: z.string().max(100).optional().nullable(),
    description: z.string().max(5000).optional().nullable(),
    price: z.number().finite().min(0).max(1_000_000_000),
    stock: z.number().int().min(0).max(10_000_000),
    category: z.string().max(200).optional().nullable(),
    image_url: trustedImageUrl,
    images: z.array(z.string().url().max(2048).refine((url) => {
        try {
            const hostname = new URL(url).hostname;
            return ALLOWED_IMAGE_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`));
        } catch { return false; }
    }, 'Image URL must be from a trusted source')).max(20).optional(),
    product_url: z.union([z.string().url(), z.literal('')]).optional().nullable(),
    custom_attributes: z.array(customAttributeSchema).optional().nullable(),
});

export const updateProductSchema = z.object({
    name: z.string().trim().min(2).max(200).optional().nullable(),
    sku: z.string().max(100).optional().nullable(),
    description: z.string().max(5000).optional().nullable(),
    price: z.union([z.number(), z.string()]).refine((v: string | number) => {
        const n = Number(v);
        return Number.isFinite(n) && n >= 0 && n <= 1_000_000_000;
    }, 'price must be a valid non-negative number').optional().nullable(),
    stock: z.union([z.number(), z.string()]).refine((v: string | number) => {
        const n = Number(v);
        return Number.isInteger(n) && n >= 0 && n <= 10_000_000;
    }, 'stock must be a valid non-negative integer').optional().nullable(),
    category: z.string().max(200).optional().nullable(),
    image_url: trustedImageUrl,
    images: z.array(z.string().url().max(2048).refine((url) => {
        try {
            const hostname = new URL(url).hostname;
            return ALLOWED_IMAGE_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`));
        } catch { return false; }
    }, 'Image URL must be from a trusted source')).max(20).optional(),
    product_url: z.union([z.string().url(), z.literal('')]).optional().nullable(),
    custom_attributes: z.array(customAttributeSchema).optional().nullable(),
    display_order: z.number().int().optional().nullable(),
    is_active: z.boolean().optional().nullable(),
});

// ============================================================================
// BULK OPERATION SCHEMAS — Security validation
// ============================================================================

/** Schema for bulk import — validates each product loosely to allow CSV import flexibility */
export const bulkImportProductSchema = z.object({
    name: z.string().trim().min(1, 'name is required').max(200),
    sku: z.string().max(100).optional().nullable(),
    description: z.string().max(5000).optional().nullable(),
    price: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().finite().min(0).max(1_000_000_000)).optional().default(0),
    stock: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().int().min(0).max(10_000_000)).optional().default(0),
    category: z.string().max(200).optional().nullable(),
    image_url: trustedImageUrl,
    images: z.array(z.string().url().max(2048).refine((url) => {
        try {
            const hostname = new URL(url).hostname;
            return ALLOWED_IMAGE_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`));
        } catch { return false; }
    }, 'Image URL must be from a trusted source')).max(20).optional(),
    product_url: z.union([z.string().url(), z.literal('')]).optional().nullable(),
    custom_attributes: z.array(customAttributeSchema).optional().nullable(),
});

export const bulkImportSchema = z.object({
    products: z.array(bulkImportProductSchema).min(1, 'At least 1 product required').max(10000, 'Maximum 10000 products per import'),
});

export const bulkDeleteSchema = z.object({
    ids: z.array(uuidString).min(1, 'At least 1 id required').max(5000, 'Maximum 5000 ids'),
});

export const reorderSchema = z.object({
    order: z.array(z.object({
        id: uuidString,
        order: z.number().int().min(0).max(999999),
    })).min(1).max(10000),
});

export const bulkUpdateImagesSchema = z.object({
    updates: z.array(z.object({
        productId: uuidString,
        images: z.array(z.string().url()).max(20),
    })).min(1).max(1000),
});

export const bulkPriceUpdateSchema = z.object({
    productIds: z.array(uuidString).min(1).max(1000),
    changeType: z.enum(['increase', 'decrease']),
    changeMode: z.enum(['percentage', 'fixed']),
    amount: z.number().positive().max(999999),
});
