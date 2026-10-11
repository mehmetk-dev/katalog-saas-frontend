// GEÇİCİ: görsel QA için — commit'lenmeyecek
import { PREVIEW_PRODUCTS } from '@/components/templates/preview-data'
import type { Catalog } from '@/lib/actions/catalogs'

export const now = '2026-10-08T09:00:00Z'
export const products = PREVIEW_PRODUCTS.map((p, i) => ({ ...p, user_id: 'u1', stock: [24, 3, 0, 12, 40, 7, 1, 15][i % 8], category: ['Oturma', 'Çalışma', 'Depolama', 'Oturma', 'Masalar', 'Masalar'][i % 6] }))
export const categoryNames = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[]
export const catalog = {
    id: 'c1', user_id: 'u1', template_id: 'modern-grid', name: 'Yaz Koleksiyonu 2026', description: 'Yılmaz Mobilya yaz koleksiyonu', layout: 'modern-grid', primary_color: '#18181b',
    show_prices: true, show_descriptions: true, show_attributes: false, show_sku: false, show_urls: false,
    columns_per_row: 3, background_color: '#ffffff', background_image: null, background_gradient: null, logo_url: null,
    logo_position: 'header-left', logo_size: 'medium', title_position: 'left', created_at: now, updated_at: now,
    is_published: true, share_slug: 'yaz-2026', product_ids: products.map((p) => p.id), view_count: 1284,
    enable_cover_page: false, enable_category_dividers: false,
} as unknown as Catalog
