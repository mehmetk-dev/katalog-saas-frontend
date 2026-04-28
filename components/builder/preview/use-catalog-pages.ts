import { useMemo } from "react"
import type { Product } from "@/lib/actions/products"
import type { CatalogPage } from "./catalog-preview"

interface UseCatalogPagesOptions {
  products: Product[]
  layout: string
  columnsPerRow?: number
  enableCoverPage?: boolean
  enableCategoryDividers?: boolean
  categoryOrder?: string[]
  pages?: CatalogPage[]
  uncategorizedLabel: string
}

export interface CatalogPagesModel {
  totalPages: number
  getPage: (index: number) => CatalogPage | undefined
  getPagesRange: (start: number, end: number) => CatalogPage[]
  getAllPages: () => CatalogPage[]
}

interface CategorySection {
  categoryName: string
  firstProductImage?: string
  products: Product[]
  startPage: number
  productPageCount: number
}

function getItemsPerPage(layout: string, columnsPerRow?: number): number {
  const layoutKey = layout?.toLowerCase() || 'modern-grid'

  if (layoutKey === 'classic-list' || layoutKey === 'classic-catalog') return 3
  if (layoutKey === 'minimal-gallery' || layoutKey === 'minimalist') return 4
  if (layoutKey === 'magazine') return 1 + (columnsPerRow || 3) * 2
  if (layoutKey === 'showcase' || layoutKey === 'fashion-lookbook') return 5
  if (layoutKey === 'industrial') return 8
  if (layoutKey === 'luxury') return 6
  if (layoutKey === 'compact-list' || layoutKey === 'list') return 10
  if (layoutKey === 'retail') return (columnsPerRow || 3) * 5
  if (layoutKey === 'catalog-pro') return (columnsPerRow || 3) * 3
  if (layoutKey === 'product-tiles') return 6
  if (columnsPerRow === 2) return 6
  if (columnsPerRow === 3) return 9
  if (columnsPerRow === 4) return 12
  return 9
}

export function useCatalogPages({
  products,
  layout,
  columnsPerRow,
  enableCoverPage,
  enableCategoryDividers,
  categoryOrder,
  pages: externalPages,
  uncategorizedLabel,
}: UseCatalogPagesOptions): CatalogPagesModel {
  return useMemo(() => {
    if (externalPages && externalPages.length > 0) {
      const getPage = (index: number) => externalPages[index]
      return {
        totalPages: externalPages.length,
        getPage,
        getPagesRange: (start: number, end: number) => externalPages.slice(start, end),
        getAllPages: () => externalPages,
      }
    }

    const productList = products || []
    const itemsPerPage = getItemsPerPage(layout, columnsPerRow)
    const coverOffset = enableCoverPage ? 1 : 0

    if (!enableCategoryDividers) {
      const productPageCount = productList.length > 0
        ? Math.ceil(productList.length / itemsPerPage)
        : (enableCoverPage ? 0 : 1)
      const totalPages = coverOffset + productPageCount

      const getPage = (index: number): CatalogPage | undefined => {
        if (enableCoverPage && index === 0) return { type: 'cover' }
        const productPageIndex = index - coverOffset
        if (productPageIndex < 0 || productPageIndex >= productPageCount) return undefined
        const start = productPageIndex * itemsPerPage
        return { type: 'products', products: productList.slice(start, start + itemsPerPage) }
      }

      return {
        totalPages,
        getPage,
        getPagesRange: (start: number, end: number) => {
          const result: CatalogPage[] = []
          for (let index = Math.max(0, start); index < Math.min(totalPages, end); index++) {
            const page = getPage(index)
            if (page) result.push(page)
          }
          return result
        },
        getAllPages: () => {
          const result: CatalogPage[] = []
          for (let index = 0; index < totalPages; index++) {
            const page = getPage(index)
            if (page) result.push(page)
          }
          return result
        },
      }
    }

    const groupedByCategory = new Map<string, Product[]>()
    for (const product of productList) {
      const categoryName = product.category || uncategorizedLabel
      const current = groupedByCategory.get(categoryName)
      if (current) {
        current.push(product)
      } else {
        groupedByCategory.set(categoryName, [product])
      }
    }

    const categoryKeys = Array.from(groupedByCategory.keys())
    if (categoryOrder && categoryOrder.length > 0) {
      const orderIndex = new Map<string, number>()
      for (let i = 0; i < categoryOrder.length; i++) orderIndex.set(categoryOrder[i], i)
      categoryKeys.sort((a, b) => {
        const idxA = orderIndex.get(a) ?? -1
        const idxB = orderIndex.get(b) ?? -1
        if (idxA === -1 && idxB === -1) return 0
        if (idxA === -1) return 1
        if (idxB === -1) return -1
        return idxA - idxB
      })
    }

    const sections: CategorySection[] = []
    let totalPages = coverOffset
    for (const categoryName of categoryKeys) {
      const categoryProducts = groupedByCategory.get(categoryName)!
      const productPageCount = Math.ceil(categoryProducts.length / itemsPerPage)
      sections.push({
        categoryName,
        firstProductImage: categoryProducts[0]?.image_url ?? undefined,
        products: categoryProducts,
        startPage: totalPages,
        productPageCount,
      })
      totalPages += 1 + productPageCount
    }

    if (totalPages === 0) totalPages = 1

    const getPage = (index: number): CatalogPage | undefined => {
      if (enableCoverPage && index === 0) return { type: 'cover' }
      if (sections.length === 0) {
        return index === coverOffset ? { type: 'products', products: [] } : undefined
      }

      for (const section of sections) {
        if (index === section.startPage) {
          return {
            type: 'divider',
            categoryName: section.categoryName,
            firstProductImage: section.firstProductImage,
          }
        }

        const productPageStart = section.startPage + 1
        const productPageIndex = index - productPageStart
        if (productPageIndex >= 0 && productPageIndex < section.productPageCount) {
          const start = productPageIndex * itemsPerPage
          return {
            type: 'products',
            products: section.products.slice(start, start + itemsPerPage),
          }
        }
      }

      return undefined
    }

    return {
      totalPages,
      getPage,
      getPagesRange: (start: number, end: number) => {
        const result: CatalogPage[] = []
        for (let index = Math.max(0, start); index < Math.min(totalPages, end); index++) {
          const page = getPage(index)
          if (page) result.push(page)
        }
        return result
      },
      getAllPages: () => {
        const result: CatalogPage[] = []
        for (let index = 0; index < totalPages; index++) {
          const page = getPage(index)
          if (page) result.push(page)
        }
        return result
      },
    }
  }, [products, layout, columnsPerRow, enableCoverPage, enableCategoryDividers, categoryOrder, externalPages, uncategorizedLabel])
}
