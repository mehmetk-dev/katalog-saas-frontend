import { z } from 'zod';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuidString = z.string().regex(UUID_REGEX, 'Invalid UUID format');

const safeUrl = z.union([
    z.string().url().max(2048),
    z.literal(''),
    z.null(),
]).optional();

// =============================================================================
// CATALOG VALIDATION SCHEMAS
// =============================================================================

export const catalogCreateSchema = z.object({
    name: z.string().max(255).transform((val) => val.trim()).optional(),
    description: z.string().max(1000).transform((val) => val.trim()).optional().nullable(),
    layout: z.string().max(50).transform((val) => val.trim()).optional(),
    product_ids: z.array(uuidString).max(5000).optional(),
    // Optional styling fields
    primary_color: z.string().max(50).optional(),
    show_prices: z.boolean().optional(),
    show_descriptions: z.boolean().optional(),
    show_attributes: z.boolean().optional(),
    show_sku: z.boolean().optional(),
    show_urls: z.boolean().optional(),
    columns_per_row: z.number().int().min(1).max(6).optional(),
    background_color: z.string().max(50).optional(),
    background_image: safeUrl,
    background_image_fit: z.enum(['cover', 'contain', 'fill']).optional(),
    background_gradient: z.string().max(500).optional().nullable(),
    logo_url: safeUrl,
    logo_position: z.string().max(50).optional().nullable(),
    logo_size: z.enum(['small', 'medium', 'large']).optional(),
    title_position: z.enum(['left', 'center', 'right']).optional(),
    product_image_fit: z.enum(['cover', 'contain', 'fill']).optional(),
    header_text_color: z.string().max(50).optional(),
    enable_cover_page: z.boolean().optional(),
    cover_image_url: safeUrl,
    cover_description: z.string().max(500).transform((val) => val.trim()).optional().nullable(),
    enable_category_dividers: z.boolean().optional(),
    cover_theme: z.string().max(50).optional(),
    show_in_search: z.boolean().optional(),
    category_order: z.array(z.string().max(200)).optional(),
}).strip();

export const catalogUpdateSchema = catalogCreateSchema.extend({
    is_published: z.boolean().optional(),
    share_slug: z.string().max(100).regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir').optional(),
}).strip();

export const catalogPublishSchema = z.object({
    is_published: z.boolean(),
});
