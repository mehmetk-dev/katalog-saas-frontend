import { z } from 'zod';

const customAttributeSchema = z.object({
    name: z.string().min(1),
    value: z.string(),
    unit: z.string().optional(),
}).passthrough();

export const createProductSchema = z.object({
    name: z.string().trim().min(2).max(200),
    sku: z.string().max(100).optional().nullable(),
    description: z.string().max(5000).optional().nullable(),
    price: z.number().finite().min(0).max(1_000_000_000),
    stock: z.number().int().min(0).max(10_000_000),
    category: z.string().max(200).optional().nullable(),
    image_url: z.union([z.string().url(), z.literal('')]).optional().nullable(),
    images: z.array(z.string().url()).max(20).optional(),
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
    image_url: z.union([z.string().url(), z.literal('')]).optional().nullable(),
    images: z.array(z.string().url()).max(20).optional(),
    product_url: z.union([z.string().url(), z.literal('')]).optional().nullable(),
    custom_attributes: z.array(customAttributeSchema).optional().nullable(),
    display_order: z.number().int().optional().nullable(),
    is_active: z.boolean().optional().nullable(),
});
