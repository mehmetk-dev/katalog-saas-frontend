import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BuilderPageClient } from '@/components/builder/builder-page-client'
import { useUser } from '@/lib/contexts/user-context'
import { useRouter } from 'next/navigation'
import type { Catalog } from '@/lib/actions/catalogs'
import type { ProductsResponse } from '@/lib/actions/products'

vi.mock('@/lib/contexts/user-context')
vi.mock('@/lib/contexts/i18n-provider', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))
vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}))
vi.mock('html-to-image', () => ({
  toJpeg: vi.fn().mockResolvedValue('data:image/jpeg;base64,mockdata'),
}))
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <div onClick={onClick} role='button'>{children}</div>
  ),
}))
vi.mock('@/lib/actions/user', () => ({
  incrementUserExports: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/components/builder/editor/catalog-editor', () => ({
  CatalogEditor: () => <div data-testid="catalog-editor" />,
}))
vi.mock('@/components/builder/preview/catalog-preview', () => ({
  CatalogPreview: ({ isExporting }: { isExporting?: boolean }) => (
    <div data-testid="catalog-preview">
      {isExporting && (
        <div id="catalog-export-container">
          <div className="catalog-page-wrapper">Page 1</div>
        </div>
      )}
      <div id="catalog-preview-container">Preview</div>
    </div>
  ),
}))

describe('BuilderPageClient PDF Export', () => {
  const mockRouter = { push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    ; (useRouter as unknown as { mockReturnValue: (value: typeof mockRouter) => void }).mockReturnValue(mockRouter)
    ; (useUser as unknown as { mockReturnValue: (value: { user: { plan: string; exports_remaining: number }; canExport: () => boolean; refreshUser: () => void }) => void }).mockReturnValue({
      user: { plan: 'free', exports_remaining: 5 },
      canExport: () => true,
      refreshUser: vi.fn(),
    })
  })

  it('should open PDF progress flow when download is triggered', async () => {
    const mockCatalog: Catalog = {
      id: '1',
      name: 'Test',
      product_ids: [] as string[],
      layout: 'modern-grid',
      user_id: 'user1',
      template_id: null,
      description: '',
      primary_color: '#000000',
      header_text_color: '#ffffff',
      show_prices: true,
      show_descriptions: true,
      show_attributes: true,
      show_sku: true,
      show_urls: true,
      columns_per_row: 3,
      background_color: '#ffffff',
      background_image: null,
      background_gradient: null,
      logo_url: null,
      logo_position: 'header-left',
      logo_size: 'medium',
      title_position: 'left',
      created_at: '',
      updated_at: '',
      share_slug: 'test-slug',
      is_published: true,
    }
    const mockInitialProductsResponse: ProductsResponse = {
      products: [],
      metadata: { total: 0, page: 1, limit: 24, totalPages: 1 },
      allCategories: [],
    }

    render(
      <BuilderPageClient
        catalog={mockCatalog}
        products={[]}
        initialProductsResponse={mockInitialProductsResponse}
      />,
    )

    const downloadOption = screen.getByText('builder.downloadAsPdf')
    fireEvent.click(downloadOption)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ptal|cancel/i })).toBeInTheDocument()
    })

    await waitFor(() => {
      const ghost = document.getElementById('catalog-export-container')
      expect(ghost).not.toBeNull()
    }, { timeout: 4000 })
  })
})

