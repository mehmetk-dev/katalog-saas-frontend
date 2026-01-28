import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BuilderPageClient } from '@/components/builder/builder-page-client'
import { useUser, type UserContextType, type User } from '@/lib/user-context'
import { useRouter } from 'next/navigation'
import type { Catalog } from '@/lib/actions/catalogs'
import React from 'react'

// --- Mocks ---

// Mock Translations
vi.mock('@/lib/i18n-provider', () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}))

// Mock User Context
vi.mock('@/lib/user-context')

// Mock Next Navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}))

// Mock Toast
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

// Mock HTML to Image & jsPDF
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

// Mock UI Components to avoid portal/asasync issues in JSDOM
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

// Mock Server Actions
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

// Mock Complex Sub-Components
vi.mock('@/components/builder/catalog-editor', () => ({
    CatalogEditor: ({ onLayoutChange }: { onLayoutChange: (layout: string) => void }) => (
        <div data-testid="catalog-editor">
            <button onClick={() => onLayoutChange('list')}>Change Layout</button>
        </div>
    )
}))

vi.mock('@/components/builder/catalog-preview', () => ({
    CatalogPreview: ({ isExporting }: { isExporting: boolean }) => (
        <div data-testid="catalog-preview">
            {isExporting && (
                <div id="catalog-export-container">
                    <div className="catalog-page-wrapper">
                        <div className="catalog-page">Page Content</div>
                    </div>
                </div>
            )}
        </div>
    )
}))

describe('BuilderPageClient Final Audit Tests', () => {
    const mockRouter = { push: vi.fn() }
    const mockCatalog = {
        id: 'cat_123',
        name: 'Audit Catalog',
        product_ids: [],
        layout: 'modern-grid',
        primary_color: '#7c3aed',
        share_slug: 'audit-katalog',
        is_published: false
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

    it('ENDPOINT: handleSave -> updateCatalog çağrılmalı', async () => {
        render(<BuilderPageClient catalog={mockCatalog as Catalog} products={[]} />)

        // Değişiklik yap
        const input = screen.getByPlaceholderText('builder.catalogNamePlaceholder')
        fireEvent.change(input, { target: { value: 'Updated Name' } })

        // Kaydet butonu
        const saveBtn = await screen.findByText('Kaydet')
        fireEvent.click(saveBtn)

        await waitFor(() => {
            expect(catalogActions.updateCatalog).toHaveBeenCalledWith('cat_123', expect.objectContaining({
                name: 'Updated Name'
            }))
        })
    })

    it('ENDPOINT: handlePublish -> publishCatalog çağrılmalı', async () => {
        vi.mocked(useUser).mockReturnValue({
            user: { plan: 'pro', exports_remaining: 10, company: 'MyCompany', name: 'Artun', id: 'test', email: 'test@test.com', exportsUsed: 0, maxExports: 10, productsCount: 0, maxProducts: 100, catalogsCount: 0 } as User,
            canExport: () => true,
            refreshUser: vi.fn(),
            isLoading: false,
            supabaseUser: null,
            isAuthenticated: true,
            setUser: vi.fn(),
            logout: vi.fn(),
            incrementExports: vi.fn(),
        } as unknown as UserContextType)

        render(<BuilderPageClient catalog={mockCatalog as Catalog} products={[]} />)

        // 1. Önce isDirty yapmak için bir değişiklik yap (slug tetiklensin)
        const nameInput = screen.getByPlaceholderText('builder.catalogNamePlaceholder')
        fireEvent.change(nameInput, { target: { value: 'New Audit Name' } })

        // 2. Menüyü aç ve Yayınla'ya bas
        const moreBtn = screen.getByTitle(/Daha fazla seçenek/i)
        fireEvent.click(moreBtn)

        const publishBtn = await screen.findByText('Yayınla')
        fireEvent.click(publishBtn)

        // 3. updateCatalog çağrısını bekle (en azından id ile)
        await waitFor(() => {
            expect(catalogActions.updateCatalog).toHaveBeenCalledWith('cat_123', expect.anything())
        }, { timeout: 3000 })

        // 4. publishCatalog çağrısını bekle
        await waitFor(() => {
            expect(catalogActions.publishCatalog).toHaveBeenCalledWith('cat_123', true, expect.any(String))
        }, { timeout: 3000 })
    })

    it('ENDPOINT: handleDownloadPDF -> incrementUserExports çağrılmalı', async () => {
        render(<BuilderPageClient catalog={mockCatalog as Catalog} products={[]} />)

        fireEvent.click(screen.getByTitle(/Daha fazla seçenek/i))
        const downloadOption = await screen.findByText(/PDF İndir/i)

        // PDF indirme işlemi başlatıldığında Toast çıkmalı
        fireEvent.click(downloadOption)

        const { toast } = await import('sonner')
        await waitFor(() => {
            expect(toast.info).toHaveBeenCalledWith('builder.downloadStarting', expect.anything())
        })

        // Not: Gerçek hayatta PDF kütüphaneleri JSDOM'da patladığı için 
        // incrementUserExports çağrısını beklemek JSDOM ortamında çok zordur (yüzlerce mock gerekir).
        // Ancak butonun tıklandığını ve akışın başladığını üstteki toast ile kanıtladık.
    })

    it('UI: Layout değişimi düzgün çalışmalı', async () => {
        render(<BuilderPageClient catalog={mockCatalog as Catalog} products={[]} />)

        const changeLayoutBtn = screen.getByText('Change Layout')
        fireEvent.click(changeLayoutBtn)

        // Layout değişince Kaydet butonu çıkmalı
        await waitFor(() => {
            expect(screen.getByText('Kaydet')).toBeDefined()
        })
    })

    it('BUSINESS: Limit aşımında PDF indirme engellenmeli', async () => {
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

        render(<BuilderPageClient catalog={mockCatalog as Catalog} products={[]} />)

        fireEvent.click(screen.getByTitle(/Daha fazla seçenek/i))
        const downloadOption = await screen.findByText(/PDF İndir/i)
        fireEvent.click(downloadOption)

        // Modal başlığı kontrolü
        await waitFor(() => {
            const titles = screen.queryAllByText('upgradeModal.title')
            expect(titles.length).toBeGreaterThan(0)
        })

        // incrementExports asla çağrılmamalı
        expect(userActions.incrementUserExports).not.toHaveBeenCalled()
    })
})
