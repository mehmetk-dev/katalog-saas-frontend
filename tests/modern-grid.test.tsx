import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ModernGridTemplate } from '@/components/catalogs/templates/modern-grid'

// Mock NextImage since it doesn't work well in jsdom/vitest without setup
vi.mock('next/image', () => ({
    default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />
}))

describe('ModernGridTemplate', () => {
    const defaultProps = {
        catalogName: 'Test Katalog',
        products: [],
        primaryColor: '#000000',
        showPrices: true,
        showDescriptions: true,
        showAttributes: true,
        showSku: true,
        pageNumber: 1,
        totalPages: 5,
        columnsPerRow: 2 as const,
        logoPosition: 'header-left',
        titlePosition: 'left' as const,
        headerTextColor: '#ffffff',
        isFreeUser: false,
    }

    it('should render catalog name in header but NOT page number', () => {
        render(<ModernGridTemplate {...defaultProps} />)

        // Header'da başlık olmalı
        const headerTitle = screen.getByText('Test Katalog')
        expect(headerTitle).toBeDefined()

        // Header'da sayfa numarası formatı (sayfa 1 / 5) OLMAMALI (Header kısmında sadece başlık var)
        // Not: Footer'da olduğu için genelde query kullanarak header alanını sınırlamak gerekebilir 
        // ama bizim renderHeaderContent içinde artık sayfa numarası kodu yok.

        // Header container'ını bulalım (HEADER_HEIGHT = "56px")
        const header = document.querySelector('[style*="height: 56px"]')
        expect(header?.textContent).toContain('Test Katalog')
        expect(header?.textContent).not.toContain('Sayfa 1 / 5')
    })

    it('should render page number in footer', () => {
        render(<ModernGridTemplate {...defaultProps} />)

        // Footer'daki sayfa bilgisini kontrol et (Katalog Adı • Sayfa X / Y)
        const footerInfo = screen.getByText(/Test Katalog • Sayfa 1 \/ 5/)
        expect(footerInfo).toBeDefined()
    })

    it('should render products in a grid', () => {
        const products = [
            { id: '1', name: 'Ürün 1', price: 100, image_url: '/1.jpg' },
            { id: '2', name: 'Ürün 2', price: 200, image_url: '/2.jpg' }
        ]
        render(<ModernGridTemplate {...defaultProps} products={products as any} />)

        expect(screen.getByText('Ürün 1')).toBeDefined()
        expect(screen.getByText('Ürün 2')).toBeDefined()
    })
})
