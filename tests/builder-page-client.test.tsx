import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BuilderPageClient } from '@/components/builder/builder-page-client'
import { useUser, type UserContextType, type User } from '@/lib/contexts/user-context'
import { useRouter } from 'next/navigation'
import type { Catalog } from '@/lib/actions/catalogs'
import type { ProductsResponse } from '@/lib/actions/products'
import React from 'react'

vi.mock('@/lib/contexts/i18n-provider', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/lib/contexts/user-context')

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
    promise: vi.fn(),
  },
}))

vi.mock('html-to-image', () => ({
  toJpeg: vi.fn().mockResolvedValue('data:image/jpeg;base64,mockdata'),
}))

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    addPage: vi.fn(),
    addImage: vi.fn(),
    save: vi.fn(),
  })),
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <div onClick={onClick} role="button">{children}</div>
  ),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) => open ? <div>{children}</div> : null,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
}))

import * as catalogActions from '@/lib/actions/catalogs'
import * as userActions from '@/lib/actions/user'

vi.mock('@/lib/actions/catalogs', () => ({
  updateCatalog: vi.fn().mockResolvedValue({ success: true }),
  createCatalog: vi.fn().mockResolvedValue({ id: 'new_id', name: 'New Catalog' }),
  publishCatalog: vi.fn().mockResolvedValue({ success: true }),
  revalidateCatalogPublic: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/lib/actions/user', () => ({
  incrementUserExports: vi.fn().mockResolvedValue({ success: true }),
  upgradeUserToPro: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/components/builder/editor/catalog-editor', () => ({
  CatalogEditor: () => (
    <div data-testid="catalog-editor">
      <span>Mock Editor</span>
    </div>
  ),
}))

vi.mock('@/components/builder/preview/catalog-preview', () => ({
  CatalogPreview: ({ isExporting }: { isExporting?: boolean }) => (
    <div data-testid="catalog-preview">
      {isExporting && (
        <div id="catalog-export-container">
          <div className="catalog-page-wrapper">
            <div className="catalog-page">Page Content</div>
          </div>
        </div>
      )}
    </div>
  ),
}))

describe('BuilderPageClient Final Audit Tests', () => {
  const mockRouter = { push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }
  const mockCatalog = {
    id: 'cat_123',
    name: 'Audit Catalog',
    product_ids: [],
    layout: 'modern-grid',
    primary_color: '#7c3aed',
    share_slug: 'audit-katalog',
    is_published: false,
  }

  const mockInitialProductsResponse: ProductsResponse = {
    products: [],
    metadata: { total: 0, page: 1, limit: 24, totalPages: 1 },
    allCategories: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>)
    vi.mocked(useUser).mockReturnValue({
      user: { plan: 'pro', exports_remaining: 10, id: 'test', name: 'Test', email: 'test@test.com', company: 'Test', exportsUsed: 0, maxExports: 10, productsCount: 0, maxProducts: 100, catalogsCount: 0 } as User,
      canExport: () => true,
      refreshUser: vi.fn(),
      isLoading: false,
      supabaseUser: null,
      isAuthenticated: true,
      setUser: vi.fn(),
      logout: vi.fn(),
      incrementExports: vi.fn(),
    } as unknown as UserContextType)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ENDPOINT: handleSave -> updateCatalog cagrilmali', async () => {
    render(<BuilderPageClient catalog={mockCatalog as unknown as Catalog} products={[]} initialProductsResponse={mockInitialProductsResponse} />)

    const input = screen.getByPlaceholderText('builder.catalogNamePlaceholder')
    fireEvent.change(input, { target: { value: 'Updated Name' } })

    const saveBtn = screen.getByTitle('builder.saveChanges')
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(catalogActions.updateCatalog).toHaveBeenCalledWith('cat_123', expect.objectContaining({
        name: 'Updated Name',
      }))
    })
  })

  it('AUTOSAVE: mevcut katalog degistiginde updateCatalog cagrilmali', async () => {
    vi.useFakeTimers()
    render(<BuilderPageClient catalog={mockCatalog as unknown as Catalog} products={[]} initialProductsResponse={mockInitialProductsResponse} />)

    const input = screen.getByPlaceholderText('builder.catalogNamePlaceholder')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Autosave Name' } })
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(catalogActions.updateCatalog).toHaveBeenCalledWith('cat_123', expect.objectContaining({
      name: 'Autosave Name',
    }))
  })

  it('PUBLISH: unsaved degisiklikleri yayindan sonra kaydedilmis saymali', async () => {
    render(<BuilderPageClient catalog={mockCatalog as unknown as Catalog} products={[]} initialProductsResponse={mockInitialProductsResponse} />)

    const input = screen.getByPlaceholderText('builder.catalogNamePlaceholder')
    fireEvent.change(input, { target: { value: 'Published Name' } })

    const publishBtn = screen.getByText('builder.publishBtn')
    fireEvent.click(publishBtn)

    await waitFor(() => {
      expect(catalogActions.publishCatalog).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByTitle('builder.noChangesToSave')).toBeInTheDocument()
    })
  })

  it('ENDPOINT: handlePublish -> publishCatalog cagrilmali', async () => {
    render(<BuilderPageClient catalog={mockCatalog as unknown as Catalog} products={[]} initialProductsResponse={mockInitialProductsResponse} />)

    const publishBtn = screen.getByText('builder.publishBtn')
    fireEvent.click(publishBtn)

    await waitFor(() => {
      expect(catalogActions.publishCatalog).toHaveBeenCalled()
    })
  })

  it('ENDPOINT: handleDownloadPDF -> incrementUserExports cagrilmali', async () => {
    render(<BuilderPageClient catalog={mockCatalog as unknown as Catalog} products={[]} initialProductsResponse={mockInitialProductsResponse} />)

    const downloadOption = screen.getByText('builder.downloadAsPdf')
    fireEvent.click(downloadOption)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ptal|cancel/i })).toBeInTheDocument()
    })
  })

  it('UI: Editor bileseni render edilmeli', async () => {
    render(<BuilderPageClient catalog={mockCatalog as unknown as Catalog} products={[]} initialProductsResponse={mockInitialProductsResponse} />)

    await waitFor(() => {
      expect(screen.getByTestId('catalog-editor')).toBeDefined()
    })
  })

  it('BUSINESS: Limit asiminda PDF indirme engellenmeli', async () => {
    vi.mocked(useUser).mockReturnValue({
      user: { plan: 'free', exports_remaining: 0, id: 'test', name: 'Test', email: 'test@test.com', company: 'Test', exportsUsed: 0, maxExports: 1, productsCount: 0, maxProducts: 50, catalogsCount: 0 } as User,
      canExport: () => false,
      refreshUser: vi.fn(),
      isLoading: false,
      supabaseUser: null,
      isAuthenticated: true,
      setUser: vi.fn(),
      logout: vi.fn(),
      incrementExports: vi.fn(),
    } as unknown as UserContextType)

    render(<BuilderPageClient catalog={mockCatalog as unknown as Catalog} products={[]} initialProductsResponse={mockInitialProductsResponse} />)

    const downloadOption = screen.getByText('builder.downloadAsPdf')
    fireEvent.click(downloadOption)

    await waitFor(() => {
      expect(userActions.incrementUserExports).not.toHaveBeenCalled()
    })
  })
})
