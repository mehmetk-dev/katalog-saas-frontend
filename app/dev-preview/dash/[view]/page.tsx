// GEÇİCİ: görsel QA için — commit'lenmeyecek
import { ProductsPageClient } from '@/components/products/products-page-client'
import { CategoriesPageClient } from '@/components/categories/categories-page-client'
import { CatalogsPageClient } from '@/components/catalogs/catalogs-page-client'
import { ExcelPageClient } from '@/components/excel/excel-page-client'
import SettingsPageClient from '@/components/settings/settings-page-client'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { AnalyticsClient } from '@/components/analytics/analytics-client'
import { TemplatesPageClient } from '@/components/templates/templates-page-client'
import type { DashboardStats } from '@/lib/actions/catalogs'
import { TEMPLATES } from '@/lib/constants'

import { catalog, categoryNames, now, products } from '../../data'
import { PreviewShell } from '../../shell'

export default async function Page({ params }: { params: Promise<{ view: string }> }) {
    const { view } = await params
    let content: React.ReactNode = null
    if (view === 'products') content = <ProductsPageClient initialProducts={products} initialMetadata={{ total: products.length, page: 1, limit: 12, totalPages: 1 }} initialStats={{ total: products.length, inStock: 5, lowStock: 2, outOfStock: 1, totalValue: 184500 }} initialAllCategories={categoryNames} userPlan="plus" maxProducts={1000} />
    if (view === 'categories') {
        const categories = categoryNames.map((name, i) => {
            const items = products.filter((p) => p.category === name)
            return { id: name, name, color: ['#ef4444', '#3b82f6', '#22c55e', '#a855f7'][i % 4], productCount: items.length, images: items.map((p) => p.image_url!).filter(Boolean), productNames: items.map((p) => p.name) }
        })
        content = <CategoriesPageClient initialCategories={categories} userPlan="plus" />
    }
    if (view === 'catalogs') content = <CatalogsPageClient initialCatalogs={[catalog]} userProducts={products as never} userPlan="plus" />
    if (view === 'excel') content = <ExcelPageClient initialProducts={products as never} initialMetadata={{ total: products.length, page: 1, limit: 100, totalPages: 1 }} userPlan="pro" />
    if (view === 'excel-free') content = <ExcelPageClient initialProducts={products as never} initialMetadata={{ total: products.length, page: 1, limit: 100, totalPages: 1 }} userPlan="free" />
    if (view === 'settings') content = <SettingsPageClient />
    const days = Array.from({ length: 30 }, (_, i) => ({ view_date: `2026-09-${String(i + 1).padStart(2, '0')}`, view_count: 20 + ((i * 37) % 45) }))
    const stats: DashboardStats = {
        totalCatalogs: 3, publishedCatalogs: 2, totalViews: 1284, periodViews: 912, totalProducts: products.length,
        topCatalogs: [{ id: 'c1', name: 'Yaz Koleksiyonu 2026', views: 1284, periodViews: 912 }, { id: 'c2', name: 'Ofis Serisi', views: 310, periodViews: 120 }],
        uniqueVisitors: 640, deviceStats: [{ device_type: 'mobile', view_count: 560, percentage: 61 }, { device_type: 'desktop', view_count: 300, percentage: 33 }, { device_type: 'tablet', view_count: 52, percentage: 6 }],
        dailyViews: days, prevTotalViews: 700, prevUniqueVisitors: 520,
    }
    if (view === 'home') content = <DashboardClient initialCatalogs={[catalog, { ...catalog, id: 'c2', name: 'Ofis Serisi', is_published: false }]} totalProductCount={products.length} initialStats={stats} />
    if (view === 'analytics') content = <AnalyticsClient stats={stats} catalogs={[catalog]} />
    if (view === 'templates') content = <TemplatesPageClient templates={(TEMPLATES as unknown as { id: string; name: string; isPro?: boolean }[]).map((tp) => ({ id: tp.id, name: tp.name, description: null, layout: tp.id, thumbnail_url: null, is_premium: !!tp.isPro, items_per_page: 6, component_name: tp.id, created_at: now }))} />
    return <PreviewShell>{content}</PreviewShell>
}
