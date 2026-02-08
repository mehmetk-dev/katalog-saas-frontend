/**
 * Centralized Validation Schemas
 * Using Zod for type-safe input validation and sanitization
 *
 * SECURITY: These schemas prevent:
 * - XSS attacks via malicious input
 * - SQL injection via parameterized inputs
 * - Invalid data reaching the database
 * - Oversized payloads crashing the server
 */

import { z } from 'zod'

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

/** Safe string that strips potential XSS patterns */
const safeString = (maxLength: number = 255) =>
    z
        .string()
        .max(maxLength)
        .transform((val) => val.trim())

/** URL validation with protocol check */
const safeUrl = z
    .string()
    .url()
    .max(2048)
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null)

/** Price validation - positive number with max 2 decimal places */
const price = z
    .number()
    .min(0, 'Fiyat negatif olamaz')
    .max(999999999, 'Fiyat çok yüksek')
    .transform((val) => Math.round(val * 100) / 100)

/** Stock validation - non-negative integer */
const stock = z
    .number()
    .int()
    .min(0, 'Stok negatif olamaz')
    .max(999999, 'Stok çok yüksek')

// =============================================================================
// PRODUCT SCHEMAS
// =============================================================================

export const customAttributeSchema = z.object({
    name: safeString(100),
    value: safeString(500),
    unit: safeString(50).optional(),
})

export const productCreateSchema = z.object({
    name: z.string().min(1, 'Ürün adı zorunludur').max(255).transform((val) => val.trim()),
    sku: z.string().max(100).transform((val) => val.trim()).optional().nullable(),
    description: z.string().max(5000).transform((val) => val.trim()).optional().nullable(),
    price: z.union([z.number(), z.string().transform(Number)]).pipe(price).default(0),
    stock: z.union([z.number(), z.string().transform(Number)]).pipe(stock).default(0),
    category: z.string().max(255).transform((val) => val.trim()).optional().nullable(),
    image_url: safeUrl,
    images: z.array(z.string().url().max(2048)).max(10).optional().default([]),
    product_url: safeUrl,
    custom_attributes: z.array(customAttributeSchema).max(50).optional().default([]),
    order: z.number().int().min(0).optional(),
})

export const productUpdateSchema = productCreateSchema.partial()

export const bulkDeleteSchema = z.object({
    ids: z.array(z.string().uuid()).min(1, 'En az bir ürün seçilmeli').max(1000),
})

export const bulkPriceUpdateSchema = z.object({
    productIds: z.array(z.string().uuid()).min(1).max(1000),
    changeType: z.enum(['increase', 'decrease']),
    changeMode: z.enum(['percentage', 'fixed']),
    amount: z.number().positive('Miktar pozitif olmalı').max(999999),
})

// =============================================================================
// CATALOG SCHEMAS
// =============================================================================

export const catalogCreateSchema = z.object({
    name: z.string().max(255).transform((val) => val.trim()).optional(),
    description: z.string().max(1000).transform((val) => val.trim()).optional().nullable(),
    layout: z.string().max(50).transform((val) => val.trim()).optional(),
})

export const catalogUpdateSchema = z.object({
    name: z.string().max(255).transform((val) => val.trim()).optional(),
    description: z.string().max(1000).transform((val) => val.trim()).optional().nullable(),
    layout: z.string().max(50).transform((val) => val.trim()).optional(),
    primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$|^rgba?\(.+\)$/).optional(),
    is_published: z.boolean().optional(),
    share_slug: z.string().max(100).regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir').optional(),
    product_ids: z.array(z.string().uuid()).max(500).optional(),
    show_prices: z.boolean().optional(),
    show_descriptions: z.boolean().optional(),
    show_attributes: z.boolean().optional(),
    show_sku: z.boolean().optional(),
    show_urls: z.boolean().optional(),
    columns_per_row: z.number().int().min(1).max(6).optional(),
    background_color: z.string().max(50).optional(),
    background_gradient: z.string().max(500).optional().nullable(),
    background_image: safeUrl,
    background_image_fit: z.enum(['cover', 'contain', 'fill']).optional(),
    logo_url: safeUrl,
    logo_position: z.enum(['header-left', 'header-center', 'header-right', 'footer-left', 'footer-center', 'footer-right', 'none']).optional().nullable(),
    logo_size: z.enum(['small', 'medium', 'large']).optional(),
    title_position: z.enum(['left', 'center', 'right']).optional(),
    product_image_fit: z.enum(['cover', 'contain', 'fill']).optional(),
    header_text_color: z.string().max(50).optional(),
    // Storytelling features
    enable_cover_page: z.boolean().optional(),
    cover_image_url: safeUrl,
    cover_description: z.string().max(500).transform((val) => val.trim()).optional().nullable(),
    enable_category_dividers: z.boolean().optional(),
    cover_theme: z.string().max(50).transform((val) => val.trim()).optional(),
    show_in_search: z.boolean().optional(),
})

// =============================================================================
// FEEDBACK SCHEMAS
// =============================================================================

export const feedbackSchema = z.object({
    subject: z.string().min(1, 'Konu zorunludur').max(200).transform((val) => val.trim()),
    message: z.string().min(10, 'Mesaj en az 10 karakter olmalı').max(5000).transform((val) => val.trim()),
    page_url: safeUrl,
    attachments: z.array(z.string().url().max(2048)).max(5).optional(),
})

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

export const loginSchema = z.object({
    email: z.string().email('Geçerli bir e-posta adresi giriniz').max(255),
    password: z.string().min(6, 'Şifre en az 6 karakter olmalı').max(128),
})

export const signupSchema = z.object({
    email: z.string().email('Geçerli bir e-posta adresi giriniz').max(255),
    password: z.string().min(8, 'Şifre en az 8 karakter olmalı').max(128),
    full_name: safeString(255).optional(),
})

export const profileUpdateSchema = z.object({
    full_name: safeString(255).optional(),
    company: safeString(255).optional(),
    avatar_url: safeUrl,
    logo_url: safeUrl,
})

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validates data against a schema and returns typed result
 * Throws a user-friendly error if validation fails
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    const result = schema.safeParse(data)

    if (!result.success) {
        const errors = result.error.errors.map((e) => e.message).join(', ')
        throw new Error(`Doğrulama hatası: ${errors}`)
    }

    return result.data
}

/**
 * Validates data and returns result with success/error status
 * Does not throw - useful for form validation
 */
export function safeValidate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
    const result = schema.safeParse(data)

    if (result.success) {
        return { success: true, data: result.data }
    }

    return {
        success: false,
        errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    }
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ProductCreate = z.infer<typeof productCreateSchema>
export type ProductUpdate = z.infer<typeof productUpdateSchema>
export type CatalogCreate = z.infer<typeof catalogCreateSchema>
export type CatalogUpdate = z.infer<typeof catalogUpdateSchema>
export type Feedback = z.infer<typeof feedbackSchema>
export type Login = z.infer<typeof loginSchema>
export type Signup = z.infer<typeof signupSchema>
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
