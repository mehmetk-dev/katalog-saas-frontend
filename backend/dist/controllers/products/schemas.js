"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkPriceUpdateSchema = exports.bulkUpdateImagesSchema = exports.reorderSchema = exports.bulkDeleteSchema = exports.bulkImportSchema = exports.bulkImportProductSchema = exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuidString = zod_1.z.string().regex(UUID_REGEX, 'Invalid UUID format');
// SECURITY: Only allow image URLs from trusted sources
const ALLOWED_IMAGE_HOSTS = [
    'res.cloudinary.com',
    'api.cloudinary.com',
    'images.unsplash.com', // Demo/placeholder images
    'plus.unsplash.com',
];
/** Validates that image URLs come from trusted CDN sources */
const trustedImageUrl = zod_1.z.union([
    zod_1.z.string().url().max(2048).refine((url) => {
        try {
            const hostname = new URL(url).hostname;
            return ALLOWED_IMAGE_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`));
        }
        catch {
            return false;
        }
    }, 'Image URL must be from a trusted source (Cloudinary)'),
    zod_1.z.literal(''),
]).optional().nullable();
const customAttributeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    value: zod_1.z.string(),
    unit: zod_1.z.string().optional(),
}).strip();
exports.createProductSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(200),
    sku: zod_1.z.string().max(100).optional().nullable(),
    description: zod_1.z.string().max(5000).optional().nullable(),
    price: zod_1.z.number().finite().min(0).max(1000000000),
    stock: zod_1.z.number().int().min(0).max(10000000),
    category: zod_1.z.string().max(200).optional().nullable(),
    image_url: trustedImageUrl,
    images: zod_1.z.array(zod_1.z.string().url().max(2048).refine((url) => {
        try {
            const hostname = new URL(url).hostname;
            return ALLOWED_IMAGE_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`));
        }
        catch {
            return false;
        }
    }, 'Image URL must be from a trusted source')).max(20).optional(),
    product_url: zod_1.z.union([zod_1.z.string().url(), zod_1.z.literal('')]).optional().nullable(),
    custom_attributes: zod_1.z.array(customAttributeSchema).optional().nullable(),
});
exports.updateProductSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(200).optional().nullable(),
    sku: zod_1.z.string().max(100).optional().nullable(),
    description: zod_1.z.string().max(5000).optional().nullable(),
    price: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).refine((v) => {
        const n = Number(v);
        return Number.isFinite(n) && n >= 0 && n <= 1000000000;
    }, 'price must be a valid non-negative number').optional().nullable(),
    stock: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).refine((v) => {
        const n = Number(v);
        return Number.isInteger(n) && n >= 0 && n <= 10000000;
    }, 'stock must be a valid non-negative integer').optional().nullable(),
    category: zod_1.z.string().max(200).optional().nullable(),
    image_url: trustedImageUrl,
    images: zod_1.z.array(zod_1.z.string().url().max(2048).refine((url) => {
        try {
            const hostname = new URL(url).hostname;
            return ALLOWED_IMAGE_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`));
        }
        catch {
            return false;
        }
    }, 'Image URL must be from a trusted source')).max(20).optional(),
    product_url: zod_1.z.union([zod_1.z.string().url(), zod_1.z.literal('')]).optional().nullable(),
    custom_attributes: zod_1.z.array(customAttributeSchema).optional().nullable(),
    display_order: zod_1.z.number().int().optional().nullable(),
    is_active: zod_1.z.boolean().optional().nullable(),
});
// ============================================================================
// BULK OPERATION SCHEMAS — Security validation
// ============================================================================
/** Schema for bulk import — validates each product loosely to allow CSV import flexibility */
exports.bulkImportProductSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'name is required').max(200),
    sku: zod_1.z.string().max(100).optional().nullable(),
    description: zod_1.z.string().max(5000).optional().nullable(),
    price: zod_1.z.union([zod_1.z.number(), zod_1.z.string().transform(Number)]).pipe(zod_1.z.number().finite().min(0).max(1000000000)).optional().default(0),
    stock: zod_1.z.union([zod_1.z.number(), zod_1.z.string().transform(Number)]).pipe(zod_1.z.number().int().min(0).max(10000000)).optional().default(0),
    category: zod_1.z.string().max(200).optional().nullable(),
    image_url: trustedImageUrl,
    images: zod_1.z.array(zod_1.z.string().url().max(2048).refine((url) => {
        try {
            const hostname = new URL(url).hostname;
            return ALLOWED_IMAGE_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`));
        }
        catch {
            return false;
        }
    }, 'Image URL must be from a trusted source')).max(20).optional(),
    product_url: zod_1.z.union([zod_1.z.string().url(), zod_1.z.literal('')]).optional().nullable(),
    custom_attributes: zod_1.z.array(customAttributeSchema).optional().nullable(),
});
exports.bulkImportSchema = zod_1.z.object({
    products: zod_1.z.array(exports.bulkImportProductSchema).min(1, 'At least 1 product required').max(10000, 'Maximum 10000 products per import'),
});
exports.bulkDeleteSchema = zod_1.z.object({
    ids: zod_1.z.array(uuidString).min(1, 'At least 1 id required').max(5000, 'Maximum 5000 ids'),
});
exports.reorderSchema = zod_1.z.object({
    order: zod_1.z.array(zod_1.z.object({
        id: uuidString,
        order: zod_1.z.number().int().min(0).max(999999),
    })).min(1).max(10000),
});
exports.bulkUpdateImagesSchema = zod_1.z.object({
    updates: zod_1.z.array(zod_1.z.object({
        productId: uuidString,
        images: zod_1.z.array(zod_1.z.string().url()).max(20),
    })).min(1).max(1000),
});
exports.bulkPriceUpdateSchema = zod_1.z.object({
    productIds: zod_1.z.array(uuidString).min(1).max(1000),
    changeType: zod_1.z.enum(['increase', 'decrease']),
    changeMode: zod_1.z.enum(['percentage', 'fixed']),
    amount: zod_1.z.number().positive().max(999999),
});
