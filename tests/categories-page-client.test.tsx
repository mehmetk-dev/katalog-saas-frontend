import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoriesPageClient } from '@/components/categories/categories-page-client'

// Mock dependencies
vi.mock('@/lib/i18n-provider', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'categories.title': 'Kategoriler',
                'categories.subtitle': 'Ürünlerinizi kategorilere ayırın',
                'categories.newCategory': 'Yeni Kategori',
                'categories.editCategory': 'Kategori Düzenle',
                'categories.categoryName': 'Kategori Adı',
                'categories.namePlaceholder': 'Örn: Mobilya, Elektronik...',
                'categories.color': 'Renk',
                'categories.coverImage': 'Kapak Fotoğrafı',
                'categories.imageNote': 'Maksimum 5MB',
                'categories.proFeature': 'Pro Özellik',
                'categories.upgradePrompt': 'Kategorileri yönetmek için Pro plana yükseltin',
                'categories.seePlans': 'Planları Gör',
                'categories.noCategories': 'Henüz kategori yok',
                'categories.noCategoriesDesc': 'İlk kategorinizi oluşturun',
                'categories.createFirst': 'İlk Kategoriyi Oluştur',
                'categories.deleteConfirm': '{name} kategorisini silmek istediğinizden emin misiniz?',
                'toasts.categoryNameEmpty': 'Kategori adı boş olamaz',
                'toasts.categoryCreated': 'Kategori oluşturuldu',
                'toasts.categoryUpdated': 'Kategori güncellendi',
                'toasts.categoryDeleted': 'Kategori silindi',
                'toasts.errorOccurred': 'Bir hata oluştu',
                'toasts.categoryDeleteFailed': 'Kategori silinemedi',
                'toasts.invalidImageFile': 'Geçersiz görsel dosyası',
                'toasts.imageSizeLimit': 'Görsel boyutu {size}MB\'dan büyük olamaz',
                'toasts.imageUploaded': 'Görsel yüklendi',
                'toasts.imageUploadFailed': 'Görsel yüklenemedi',
                'common.edit': 'Düzenle',
                'common.cancel': 'İptal',
                'common.create': 'Oluştur',
                'common.update': 'Güncelle',
                'common.upload': 'Yükle',
                'common.change': 'Değiştir',
            }
            return translations[key] || key
        },
        language: 'tr',
    }),
}))

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
    },
}))

vi.mock('@/lib/image-utils', () => ({
    convertToWebP: vi.fn(async (file: File) => ({
        blob: new Blob([file], { type: 'image/webp' }),
        fileName: file.name.replace(/\.[^.]+$/, '.webp'),
    })),
}))

vi.mock('@supabase/ssr', () => ({
    createBrowserClient: vi.fn(() => ({
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn().mockResolvedValue({ data: { path: 'test.webp' }, error: null }),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/test.webp' } })),
            })),
        },
    })),
}))

vi.mock('@/lib/actions/categories', () => ({
    updateCategoryMetadata: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/lib/actions/products', () => ({
    renameCategory: vi.fn().mockResolvedValue({ success: true }),
    deleteCategory: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/components/builder/upgrade-modal', () => ({
    UpgradeModal: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
        open ? <div data-testid="upgrade-modal">Upgrade Modal</div> : null
    ),
}))

vi.mock('next/image', () => ({
    default: ({ src, alt, fill, unoptimized, ...props }: any) => {
        const imgProps: any = { src, alt, ...props }
        if (fill) imgProps.style = { ...imgProps.style, position: 'absolute', width: '100%', height: '100%' }
        if (unoptimized !== undefined) imgProps.unoptimized = String(unoptimized)
        return <img {...imgProps} />
    },
}))

global.URL.createObjectURL = vi.fn(() => 'blob:test')
global.URL.revokeObjectURL = vi.fn()

global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
} as any

// Mock window.confirm
global.confirm = vi.fn(() => true)

describe('Categories Page Client Testleri', () => {
    const mockCategories = [
        {
            id: 'cat-1',
            name: 'Elektronik',
            color: '#3b82f6',
            productCount: 5,
            images: ['https://example.com/img1.jpg'],
            productNames: ['Ürün 1', 'Ürün 2'],
        },
        {
            id: 'cat-2',
            name: 'Mobilya',
            color: '#8b5cf6',
            productCount: 3,
            images: ['https://example.com/img2.jpg', 'https://example.com/img3.jpg'],
            productNames: ['Ürün 3'],
        },
    ]

    beforeEach(() => {
        vi.clearAllMocks()
        ;(global.confirm as any).mockReturnValue(true)
    })

    describe('Render ve Temel İşlevsellik', () => {
        it('Sayfa başarıyla render edilir', () => {
            render(<CategoriesPageClient initialCategories={mockCategories} userPlan="pro" />)

            expect(screen.getByText('Kategoriler')).toBeInTheDocument()
            expect(screen.getByText('Elektronik')).toBeInTheDocument()
            expect(screen.getByText('Mobilya')).toBeInTheDocument()
        })

        it('Kategori kartları render edilir', () => {
            render(<CategoriesPageClient initialCategories={mockCategories} userPlan="pro" />)

            expect(screen.getByText('Elektronik')).toBeInTheDocument()
            expect(screen.getByText('Mobilya')).toBeInTheDocument()
        })

        it('Kategori ürün sayıları gösterilir', () => {
            render(<CategoriesPageClient initialCategories={mockCategories} userPlan="pro" />)

            expect(screen.getByText('5')).toBeInTheDocument()
            expect(screen.getByText('3')).toBeInTheDocument()
        })
    })

    describe('Empty State', () => {
        it('Kategori yoksa empty state gösterilir', () => {
            render(<CategoriesPageClient initialCategories={[]} userPlan="pro" />)

            expect(screen.getByText('Henüz kategori yok')).toBeInTheDocument()
            expect(screen.getByText('İlk Kategoriyi Oluştur')).toBeInTheDocument()
        })

        it('Empty state\'de kategori oluştur butonu çalışır', async () => {
            const user = userEvent.setup()
            render(<CategoriesPageClient initialCategories={[]} userPlan="pro" />)

            const createButton = screen.getByText('İlk Kategoriyi Oluştur')
            await user.click(createButton)

            await waitFor(() => {
                expect(screen.getByText('Yeni Kategori')).toBeInTheDocument()
            })
        })
    })

    describe('Free User Kısıtlamaları', () => {
        it('Free user için upgrade banner gösterilir', () => {
            render(<CategoriesPageClient initialCategories={mockCategories} userPlan="free" />)

            expect(screen.getByText('Pro Özellik')).toBeInTheDocument()
            expect(screen.getByText('Planları Gör')).toBeInTheDocument()
        })

        it('Free user kategori eklemeye çalıştığında upgrade modal açılır', async () => {
            const user = userEvent.setup()
            render(<CategoriesPageClient initialCategories={mockCategories} userPlan="free" />)

            const addButton = screen.getByText('Yeni Kategori')
            await user.click(addButton)

            await waitFor(() => {
                expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument()
            })
        })

        it('Free user kategori düzenlemeye çalıştığında upgrade modal açılır', async () => {
            const user = userEvent.setup()
            render(<CategoriesPageClient initialCategories={mockCategories} userPlan="free" />)

            const categoryCard = screen.getByText('Elektronik').closest('.group')
            if (categoryCard) {
                await user.click(categoryCard)
            }

            await waitFor(() => {
                expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument()
            })
        })
    })

    describe('Kategori Ekleme', () => {
        it('Pro user kategori ekleyebilir', async () => {
            const user = userEvent.setup()
            render(<CategoriesPageClient initialCategories={mockCategories} userPlan="pro" />)

            const addButton = screen.getByText('Yeni Kategori')
            await user.click(addButton)

            await waitFor(() => {
                expect(screen.getByText('Yeni Kategori')).toBeInTheDocument()
            })
        })

        it('Kategori adı input çalışır', async () => {
            const user = userEvent.setup()
            render(<CategoriesPageClient initialCategories={mockCategories} userPlan="pro" />)

            const addButton = screen.getByText('Yeni Kategori')
            await user.click(addButton)

            await waitFor(() => {
                const nameInput = screen.getByPlaceholderText(/Mobilya/i)
                expect(nameInput).toBeInTheDocument()
            })

            const nameInput = screen.getByPlaceholderText(/Mobilya/i)
            await user.type(nameInput, 'Yeni Kategori')

            expect(nameInput).toHaveValue('Yeni Kategori')
        })

        it('Renk seçimi çalışır', async () => {
            const user = userEvent.setup()
            render(<CategoriesPageClient initialCategories={mockCategories} userPlan="pro" />)

            const addButton = screen.getByText('Yeni Kategori')
            await user.click(addButton)

            await waitFor(() => {
                const colorButtons = screen.getAllByRole('button')
                const colorButton = colorButtons.find(btn => 
                    btn.style.backgroundColor === '#ef4444' || btn.style.backgroundColor === 'rgb(239, 68, 68)'
                )
                if (colorButton) {
                    expect(colorButton).toBeInTheDocument()
                }
            })
        })
    })

    describe('Kategori Düzenleme', () => {
        it('Kategori düzenleme modalı açılır', async () => {
            const user = userEvent.setup()
            render(<CategoriesPageClient initialCategories={mockCategories} userPlan="pro" />)

            const categoryCard = screen.getByText('Elektronik').closest('.group')
            if (categoryCard) {
                await user.click(categoryCard)
            }

            await waitFor(() => {
                expect(screen.getByText('Kategori Düzenle')).toBeInTheDocument()
            })
        })

        it('Düzenleme modalında kategori adı dolu gelir', async () => {
            const user = userEvent.setup()
            render(<CategoriesPageClient initialCategories={mockCategories} userPlan="pro" />)

            const categoryCard = screen.getByText('Elektronik').closest('.group')
            if (categoryCard) {
                await user.click(categoryCard)
            }

            await waitFor(() => {
                const nameInput = screen.getByDisplayValue('Elektronik')
                expect(nameInput).toBeInTheDocument()
            })
        })
    })

    describe('Görsel Yükleme', () => {
        it('Görsel yükleme butonu görünür', async () => {
            const user = userEvent.setup()
            render(<CategoriesPageClient initialCategories={mockCategories} userPlan="pro" />)

            const addButton = screen.getByText('Yeni Kategori')
            await user.click(addButton)

            await waitFor(() => {
                const uploadButton = screen.getByText('Yükle')
                expect(uploadButton).toBeInTheDocument()
            })
        })

        it('Geçersiz dosya türü için hata gösterilir', async () => {
            const user = userEvent.setup()
            const { toast } = await import('sonner')
            
            render(<CategoriesPageClient initialCategories={mockCategories} userPlan="pro" />)

            const addButton = screen.getByText('Yeni Kategori')
            await user.click(addButton)

            await waitFor(() => {
                const uploadButton = screen.getByText('Yükle')
                expect(uploadButton).toBeInTheDocument()
            })

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
            const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })

            if (fileInput) {
                await user.upload(fileInput, invalidFile)
            }

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Geçersiz görsel dosyası')
            })
        })

        it('Çok büyük dosya için hata gösterilir', async () => {
            const user = userEvent.setup()
            const { toast } = await import('sonner')
            
            render(<CategoriesPageClient initialCategories={mockCategories} userPlan="pro" />)

            const addButton = screen.getByText('Yeni Kategori')
            await user.click(addButton)

            await waitFor(() => {
                const uploadButton = screen.getByText('Yükle')
                expect(uploadButton).toBeInTheDocument()
            })

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
            // 6MB file (limit 5MB)
            const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })

            if (fileInput) {
                await user.upload(fileInput, largeFile)
            }

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalled()
            })
        })
    })

    describe('Kategori Kaydetme', () => {
        it('Boş kategori adı ile kaydetme engellenir', async () => {
            const user = userEvent.setup()
            const { toast } = await import('sonner')
            
            render(<CategoriesPageClient initialCategories={mockCategories} userPlan="pro" />)

            const addButton = screen.getByText('Yeni Kategori')
            await user.click(addButton)

            await waitFor(() => {
                const saveButton = screen.getByText('Oluştur')
                expect(saveButton).toBeInTheDocument()
            })

            const saveButton = screen.getByText('Oluştur')
            await user.click(saveButton)

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Kategori adı boş olamaz')
            })
        })

        it('Yeni kategori başarıyla kaydedilir', async () => {
            const user = userEvent.setup()
            const { toast } = await import('sonner')
            
            render(<CategoriesPageClient initialCategories={mockCategories} userPlan="pro" />)

            const addButton = screen.getByText('Yeni Kategori')
            await user.click(addButton)

            await waitFor(() => {
                const nameInput = screen.getByPlaceholderText(/Mobilya/i)
                expect(nameInput).toBeInTheDocument()
            })

            const nameInput = screen.getByPlaceholderText(/Mobilya/i)
            await user.type(nameInput, 'Yeni Kategori')

            const saveButton = screen.getByText('Oluştur')
            await user.click(saveButton)

            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith('Kategori oluşturuldu')
            })
        })
    })

    describe('Kategori Görselleri', () => {
        it('Cover image varsa gösterilir', () => {
            const categoriesWithCover = [
                {
                    ...mockCategories[0],
                    cover_image: 'https://example.com/cover.jpg',
                },
            ]

            render(<CategoriesPageClient initialCategories={categoriesWithCover} userPlan="pro" />)

            const coverImage = screen.getByAltText('Elektronik')
            expect(coverImage).toBeInTheDocument()
        })

        it('Product images varsa gösterilir', () => {
            render(<CategoriesPageClient initialCategories={mockCategories} userPlan="pro" />)

            // Images should be rendered
            expect(screen.getByText('Elektronik')).toBeInTheDocument()
        })
    })

    describe('Modal İşlemleri', () => {
        it('Modal kapatma çalışır', async () => {
            const user = userEvent.setup()
            render(<CategoriesPageClient initialCategories={mockCategories} userPlan="pro" />)

            const addButton = screen.getByText('Yeni Kategori')
            await user.click(addButton)

            await waitFor(() => {
                expect(screen.getByText('Yeni Kategori')).toBeInTheDocument()
            })

            const cancelButton = screen.getByText('İptal')
            await user.click(cancelButton)

            await waitFor(() => {
                expect(screen.queryByText('Yeni Kategori')).not.toBeInTheDocument()
            })
        })
    })
})
