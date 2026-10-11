// GEÇİCİ: görsel QA için — commit'lenmeyecek
import { PublicCatalogClient } from '@/app/catalog/[slug]/public-catalog-client'

import { catalog, products } from '../data'

export default async function Page({ searchParams }: { searchParams: Promise<{ cover?: string; n?: string; div?: string }> }) {
    const { cover = '1', n, div } = await searchParams
    const count = n ? Number(n) : products.length
    const list = Array.from({ length: count }, (_, i) => ({ ...products[i % products.length], id: `p-${i}`, name: `${products[i % products.length].name} ${i + 1}` }))
    const withCover = { ...catalog, enable_cover_page: cover === '1', enable_category_dividers: (div ?? cover) === '1', cover_theme: 'modern' }
    return <PublicCatalogClient catalog={withCover} products={list as never} />
}
