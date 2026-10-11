'use client'
// GEÇİCİ: şablon denetimi için — commit'lenmeyecek
import type { ComponentType } from 'react'

import { BoldTemplate } from '@/components/catalogs/templates/bold'
import { CatalogProTemplate } from '@/components/catalogs/templates/catalog-pro'
import { ClassicCatalogTemplate } from '@/components/catalogs/templates/classic-catalog'
import { CleanWhiteTemplate } from '@/components/catalogs/templates/clean-white'
import { CompactListTemplate } from '@/components/catalogs/templates/compact-list'
import { ElegantCardsTemplate } from '@/components/catalogs/templates/elegant-cards'
import { FashionLookbookTemplate } from '@/components/catalogs/templates/fashion-lookbook'
import { IndustrialTemplate } from '@/components/catalogs/templates/industrial'
import { LuxuryTemplate } from '@/components/catalogs/templates/luxury'
import { MagazineTemplate } from '@/components/catalogs/templates/magazine'
import { MinimalistTemplate } from '@/components/catalogs/templates/minimalist'
import { ModernGridTemplate } from '@/components/catalogs/templates/modern-grid'
import { ProductTilesTemplate } from '@/components/catalogs/templates/product-tiles'
import { RetailTemplate } from '@/components/catalogs/templates/retail'
import { ShowcaseTemplate } from '@/components/catalogs/templates/showcase'
import { TechModernTemplate } from '@/components/catalogs/templates/tech-modern'
import type { TemplateProps } from '@/components/catalogs/templates/types'
import { getAvailableColumns } from '@/components/builder/builder-utils'
import { getItemsPerPage } from '@/lib/constants'

import { products as base } from '../data'

const TEMPLATES: Array<[string, ComponentType<TemplateProps>]> = [
    ['modern-grid', ModernGridTemplate], ['compact-list', CompactListTemplate], ['product-tiles', ProductTilesTemplate], ['clean-white', CleanWhiteTemplate],
    ['magazine', MagazineTemplate], ['minimalist', MinimalistTemplate], ['bold', BoldTemplate], ['elegant-cards', ElegantCardsTemplate],
    ['classic-catalog', ClassicCatalogTemplate], ['showcase', ShowcaseTemplate], ['catalog-pro', CatalogProTemplate], ['retail', RetailTemplate],
    ['tech-modern', TechModernTemplate], ['fashion-lookbook', FashionLookbookTemplate], ['industrial', IndustrialTemplate], ['luxury', LuxuryTemplate],
]

const ATTRS = [{ name: 'Renk', value: 'Ceviz' }, { name: 'Malzeme', value: 'Masif meşe' }, { name: 'Ağırlık', value: '7', unit: 'kg' }]
const products = Array.from({ length: 24 }, (_, i) => {
    const p = base[i % base.length]
    return { ...p, id: `p${i}`, name: i === 1 ? 'Çok Uzun İsimli Ergonomik Ofis Koltuğu Pro Max Edition' : p.name, sku: `MOB-${100 + i}`, product_url: 'https://ornek.com/urun', custom_attributes: ATTRS, price: [4500, 1299.9, 12500, 89][i % 4] }
})

type Variant = Partial<TemplateProps> & { label: string }
const VARIANTS: Record<string, Variant> = {
    base: { label: 'Varsayılan: logo sol üst, başlık sol, koyu kart, beyaz yazı', logoPosition: 'header-left', titlePosition: 'left' },
    logoRight: { label: 'Logo sağ üst (büyük), başlık sol', logoPosition: 'header-right', logoSize: 'large', titlePosition: 'left' },
    logoCenter: { label: 'Logo orta üst, başlık ortada (çakışma)', logoPosition: 'header-center', titlePosition: 'center' },
    titleRight: { label: 'Logo sol üst (küçük), başlık sağda', logoPosition: 'header-left', logoSize: 'small', titlePosition: 'right' },
    collideRight: { label: 'Logo sağ üst, başlık sağda (çakışma)', logoPosition: 'header-right', titlePosition: 'right' },
    noLogo: { label: 'Logo gizli, başlık ortada', logoPosition: 'none', titlePosition: 'center' },
    lightColor: { label: 'Açık kart rengi (sarı) + beyaz yazı', primaryColor: 'rgba(250, 204, 21, 1)', headerTextColor: '#ffffff' },
    redBlack: { label: 'Kırmızı kart + siyah yazı', primaryColor: 'rgba(207, 20, 20, 1)', headerTextColor: '#000000' },
    blueDefault: { label: 'Mavi kart + builder varsayılanı (#000000 yazı)', primaryColor: 'rgba(37, 99, 235, 1)', headerTextColor: '#000000' },
    allOff: { label: 'Fiyat/açıklama/özellik/SKU/link kapalı', showPrices: false, showDescriptions: false, showAttributes: false, showSku: false, showUrls: false },
    darkBg: { label: 'Koyu arka plan rengi (#0f172a)', backgroundColor: '#0f172a' },
    gradient: { label: 'Gradyan arka plan', backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    bgImage: { label: 'Arka plan görseli', backgroundImage: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=1200', backgroundImageFit: 'cover' },
    contain: { label: 'Görsel: sığdır (contain)', productImageFit: 'contain' },
    cols2: { label: 'En az sütun', columnsPerRow: -1 },
    cols4: { label: 'En çok sütun', columnsPerRow: 99 },
}

export function Grid({ v, t, z }: { v: string; t?: string; z: string }) {
    const variant = VARIANTS[v] ?? VARIANTS.base
    const list = t ? TEMPLATES.filter(([id]) => t.split(',').includes(id)) : TEMPLATES
    return (
        <div style={{ background: '#e5e7eb', padding: 16, minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{v}: {variant.label}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                {list.map(([id, Template]) => {
                    const available = getAvailableColumns(id)
                    const cols = variant.columnsPerRow === -1 ? available[0] : variant.columnsPerRow === 99 ? available[available.length - 1] : available.includes(3) ? 3 : available[0]
                    const count = getItemsPerPage(id, cols)
                    const { label: _label, ...overrides } = variant
                    void _label
                    return (
                        <div key={id} data-tpl={id}>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{id} · {cols} sütun · {count} ürün</div>
                            <div style={{ zoom: Number(z) }}>
                                <div className="catalog-page catalog-light" style={{ width: 794, height: 1123, overflow: 'hidden', position: 'relative', background: '#fff' }}>
                                    <Template
                                        catalogName="Yaz Koleksiyonu 2026"
                                        products={products.slice(0, count) as never}
                                        primaryColor="rgba(24, 24, 27, 1)"
                                        headerTextColor="#ffffff"
                                        showPrices showDescriptions showAttributes showSku showUrls
                                        isFreeUser={false}
                                        pageNumber={2}
                                        totalPages={5}
                                        backgroundColor="#ffffff"
                                        logoUrl="/logo.svg"
                                        logoSize="medium"
                                        productImageFit="cover"
                                        {...overrides}
                                        columnsPerRow={cols}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
