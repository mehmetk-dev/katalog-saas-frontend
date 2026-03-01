"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogPublishSchema = exports.catalogUpdateSchema = exports.catalogCreateSchema = void 0;
const zod_1 = require("zod");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuidString = zod_1.z.string().regex(UUID_REGEX, 'Invalid UUID format');
const safeUrl = zod_1.z.union([
    zod_1.z.string().url().max(2048),
    zod_1.z.literal(''),
    zod_1.z.null(),
]).optional();
// =============================================================================
// CATALOG VALIDATION SCHEMAS
// =============================================================================
exports.catalogCreateSchema = zod_1.z.object({
    name: zod_1.z.string().max(255).transform((val) => val.trim()).optional(),
    description: zod_1.z.string().max(1000).transform((val) => val.trim()).optional().nullable(),
    layout: zod_1.z.string().max(50).transform((val) => val.trim()).optional(),
    product_ids: zod_1.z.array(uuidString).max(500).optional(),
    // Optional styling fields
    primary_color: zod_1.z.string().max(50).optional(),
    show_prices: zod_1.z.boolean().optional(),
    show_descriptions: zod_1.z.boolean().optional(),
    show_attributes: zod_1.z.boolean().optional(),
    show_sku: zod_1.z.boolean().optional(),
    show_urls: zod_1.z.boolean().optional(),
    columns_per_row: zod_1.z.number().int().min(1).max(6).optional(),
    background_color: zod_1.z.string().max(50).optional(),
    background_image: safeUrl,
    background_image_fit: zod_1.z.enum(['cover', 'contain', 'fill']).optional(),
    background_gradient: zod_1.z.string().max(500).optional().nullable(),
    logo_url: safeUrl,
    logo_position: zod_1.z.string().max(50).optional().nullable(),
    logo_size: zod_1.z.enum(['small', 'medium', 'large']).optional(),
    title_position: zod_1.z.enum(['left', 'center', 'right']).optional(),
    product_image_fit: zod_1.z.enum(['cover', 'contain', 'fill']).optional(),
    header_text_color: zod_1.z.string().max(50).optional(),
    enable_cover_page: zod_1.z.boolean().optional(),
    cover_image_url: safeUrl,
    cover_description: zod_1.z.string().max(500).transform((val) => val.trim()).optional().nullable(),
    enable_category_dividers: zod_1.z.boolean().optional(),
    cover_theme: zod_1.z.string().max(50).optional(),
    show_in_search: zod_1.z.boolean().optional(),
    category_order: zod_1.z.array(zod_1.z.string().max(200)).optional(),
}).strip();
exports.catalogUpdateSchema = exports.catalogCreateSchema.extend({
    is_published: zod_1.z.boolean().optional(),
    share_slug: zod_1.z.string().max(100).regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir').optional(),
}).strip();
exports.catalogPublishSchema = zod_1.z.object({
    is_published: zod_1.z.boolean(),
});
