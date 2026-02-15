"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
const customAttributeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    value: zod_1.z.string(),
    unit: zod_1.z.string().optional(),
}).passthrough();
exports.createProductSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(200),
    sku: zod_1.z.string().max(100).optional().nullable(),
    description: zod_1.z.string().max(5000).optional().nullable(),
    price: zod_1.z.number().finite().min(0).max(1000000000),
    stock: zod_1.z.number().int().min(0).max(10000000),
    category: zod_1.z.string().max(200).optional().nullable(),
    image_url: zod_1.z.union([zod_1.z.string().url(), zod_1.z.literal('')]).optional().nullable(),
    images: zod_1.z.array(zod_1.z.string().url()).max(20).optional(),
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
    image_url: zod_1.z.union([zod_1.z.string().url(), zod_1.z.literal('')]).optional().nullable(),
    images: zod_1.z.array(zod_1.z.string().url()).max(20).optional(),
    product_url: zod_1.z.union([zod_1.z.string().url(), zod_1.z.literal('')]).optional().nullable(),
    custom_attributes: zod_1.z.array(customAttributeSchema).optional().nullable(),
    display_order: zod_1.z.number().int().optional().nullable(),
    is_active: zod_1.z.boolean().optional().nullable(),
});
