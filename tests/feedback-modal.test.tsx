import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedbackModal } from '@/components/dashboard/feedback-modal'

// Mock dependencies
const mockGetUser = vi.fn()
const mockUpload = vi.fn()
const mockCreateSignedUrl = vi.fn()
const mockGetPublicUrl = vi.fn()

const mockSupabaseClient = {
    auth: {
        getUser: mockGetUser,
        refreshSession: vi.fn(async () => ({ data: { session: null, user: null }, error: null })),
    },
    storage: {
        from: vi.fn(() => ({
            upload: mockUpload,
            createSignedUrl: mockCreateSignedUrl,
            getPublicUrl: mockGetPublicUrl,
        })),
    },
}

vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('@/lib/contexts/i18n-provider', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'feedback.title': 'Geri Bildirim Gönder',
                'feedback.description': 'Sorunlarınızı veya önerilerinizi paylaşın',
                'feedback.subject': 'Konu',
                'feedback.subjectPlaceholder': 'Örn: Hata raporu, özellik önerisi...',
                'feedback.message': 'Mesaj',
                'feedback.messagePlaceholder': 'Detaylı açıklama yazın...',
                'feedback.addFiles': 'Dosya Ekle',
                'feedback.selectFile': 'Dosya Seç',
                'feedback.maxFiles': 'Maksimum 5 dosya, her biri 50MB\'dan küçük',
                'feedback.alert': 'Gizlilik: Dosyalarınız sadece destek ekibi tarafından görülebilir',
                'feedback.send': 'Gönder',
                'feedback.cancel': 'İptal',
                'feedback.trigger': 'Geri Bildirim',
                'feedback.errorFields': 'Lütfen konu ve mesaj alanlarını doldurun',
                'feedback.fileTooLarge': 'Dosya boyutu 50MB\'dan büyük olamaz',
                'feedback.uploading': 'Yükleniyor',
                'feedback.uploadSuccess': 'Dosya yüklendi ({current}/{total})',
                'feedback.uploadFailed': 'Dosya yüklenemedi',
                'feedback.sending': 'Gönderiliyor...',
                'feedback.success': 'Geri bildiriminiz gönderildi',
                'feedback.errorUpload': 'Yükleme hatası',
                'auth.sessionExpired': 'Oturum süresi doldu',
                'auth.timeout': 'İşlem zaman aşımına uğradı',
                'common.error': 'Bir hata oluştu',
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
        warning: vi.fn(),
    },
}))

vi.mock('@/lib/utils/image-utils', () => ({
    convertToWebP: vi.fn(async (file: File) => ({
        blob: new Blob([file], { type: 'image/webp' }),
        fileName: file.name.replace(/\.[^.]+$/, '.webp'),
    })),
}))

vi.mock('@/lib/actions/feedback', () => ({
    sendFeedback: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('next/navigation', () => ({
    usePathname: () => '/dashboard',
}))

vi.mock('next/image', () => ({
    default: ({ src, alt, fill, unoptimized, ...props }: { src: string; alt?: string; fill?: boolean; unoptimized?: boolean;[key: string]: unknown }) => {
        const imgProps: Record<string, unknown> = { src, alt, ...props }
        if (fill) imgProps.style = { ...((imgProps.style as Record<string, unknown>) || {}), position: 'absolute', width: '100%', height: '100%' }
        if (unoptimized !== undefined) imgProps.unoptimized = String(unoptimized)
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...imgProps} />
    },
}))

global.URL.createObjectURL = vi.fn(() => 'blob:test')
global.URL.revokeObjectURL = vi.fn()

global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
} as unknown as typeof ResizeObserver

describe('Feedback Modal Testleri', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'test-user' } },
        })
        mockUpload.mockResolvedValue({ data: { path: 'test.jpg' }, error: null })
        mockCreateSignedUrl.mockResolvedValue({
            data: { signedUrl: 'https://example.com/signed.jpg' },
            error: null,
        })
        mockGetPublicUrl.mockReturnValue({
            data: { publicUrl: 'https://example.com/public.jpg' },
        })
    })

    describe('Render ve Temel İşlevsellik', () => {
        it('Modal başarıyla render edilir', async () => {
            const user = userEvent.setup()
            render(<FeedbackModal />)

            const trigger = screen.getByText('Geri Bildirim')
            await user.click(trigger)

            await waitFor(() => {
                expect(screen.getByText('Geri Bildirim Gönder')).toBeInTheDocument()
            })
        })

        it('Form alanları görünür', async () => {
            const user = userEvent.setup()
            render(<FeedbackModal />)

            const trigger = screen.getByText('Geri Bildirim')
            await user.click(trigger)

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Hata raporu/i)).toBeInTheDocument()
                expect(screen.getByPlaceholderText(/Detaylı açıklama/i)).toBeInTheDocument()
            })
        })

        it('Custom trigger çalışır', async () => {
            const user = userEvent.setup()
            render(
                <FeedbackModal>
                    <button>Custom Trigger</button>
                </FeedbackModal>
            )

            const trigger = screen.getByText('Custom Trigger')
            await user.click(trigger)

            await waitFor(() => {
                expect(screen.getByText('Geri Bildirim Gönder')).toBeInTheDocument()
            })
        })
    })

    describe('Form Validasyonu', () => {
        it('Boş form gönderimi engellenir', async () => {
            const user = userEvent.setup()
            const { toast } = await import('sonner')

            render(<FeedbackModal />)

            const trigger = screen.getByText('Geri Bildirim')
            await user.click(trigger)

            await waitFor(() => {
                const submitButton = screen.getByText('Gönder')
                expect(submitButton).toBeInTheDocument()
            })

            const submitButton = screen.getByText('Gönder')
            await user.click(submitButton)

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Lütfen konu ve mesaj alanlarını doldurun')
            })
        })

        it('Sadece konu dolu ise gönderim engellenir', async () => {
            const user = userEvent.setup()
            const { toast } = await import('sonner')

            render(<FeedbackModal />)

            const trigger = screen.getByText('Geri Bildirim')
            await user.click(trigger)

            await waitFor(() => {
                const subjectInput = screen.getByPlaceholderText(/Hata raporu/i)
                expect(subjectInput).toBeInTheDocument()
            })

            const subjectInput = screen.getByPlaceholderText(/Hata raporu/i)
            await user.type(subjectInput, 'Test Subject')

            const submitButton = screen.getByText('Gönder')
            await user.click(submitButton)

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Lütfen konu ve mesaj alanlarını doldurun')
            })
        })

        it('Sadece mesaj dolu ise gönderim engellenir', async () => {
            const user = userEvent.setup()
            const { toast } = await import('sonner')

            render(<FeedbackModal />)

            const trigger = screen.getByText('Geri Bildirim')
            await user.click(trigger)

            await waitFor(() => {
                const messageInput = screen.getByPlaceholderText(/Detaylı açıklama/i)
                expect(messageInput).toBeInTheDocument()
            })

            const messageInput = screen.getByPlaceholderText(/Detaylı açıklama/i)
            await user.type(messageInput, 'Test Message')

            const submitButton = screen.getByText('Gönder')
            await user.click(submitButton)

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Lütfen konu ve mesaj alanlarını doldurun')
            })
        })
    })

    describe('Form Gönderimi', () => {
        it('Başarılı form gönderimi', async () => {
            const user = userEvent.setup()
            const { toast } = await import('sonner')
            const { sendFeedback } = await import('@/lib/actions/feedback')

            render(<FeedbackModal />)

            const trigger = screen.getByText('Geri Bildirim')
            await user.click(trigger)

            await waitFor(() => {
                const subjectInput = screen.getByPlaceholderText(/Hata raporu/i)
                expect(subjectInput).toBeInTheDocument()
            })

            const subjectInput = screen.getByPlaceholderText(/Hata raporu/i)
            const messageInput = screen.getByPlaceholderText(/Detaylı açıklama/i)

            await user.type(subjectInput, 'Test Subject')
            await user.type(messageInput, 'Test Message')

            const submitButton = screen.getByText('Gönder')
            await user.click(submitButton)

            await waitFor(() => {
                expect(sendFeedback).toHaveBeenCalledWith({
                    subject: 'Test Subject',
                    message: 'Test Message',
                    page_url: '/dashboard',
                    attachments: [],
                })
            })

            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith('Geri bildiriminiz gönderildi')
            })
        })

        it('Gönderim sırasında loading state gösterilir', async () => {
            const user = userEvent.setup()

            render(<FeedbackModal />)

            const trigger = screen.getByText('Geri Bildirim')
            await user.click(trigger)

            await waitFor(() => {
                const subjectInput = screen.getByPlaceholderText(/Hata raporu/i)
                expect(subjectInput).toBeInTheDocument()
            })

            const subjectInput = screen.getByPlaceholderText(/Hata raporu/i)
            const messageInput = screen.getByPlaceholderText(/Detaylı açıklama/i)

            await user.type(subjectInput, 'Test Subject')
            await user.type(messageInput, 'Test Message')

            const submitButton = screen.getByText('Gönder')
            await user.click(submitButton)

            // Loading spinner görünmeli
            await waitFor(() => {
                expect(submitButton).toBeDisabled()
            })
        })
    })

    describe('Dosya Yükleme', () => {
        it('Dosya seçme butonu görünür', async () => {
            const user = userEvent.setup()
            render(<FeedbackModal />)

            const trigger = screen.getByText('Geri Bildirim')
            await user.click(trigger)

            await waitFor(() => {
                expect(screen.getByText('Dosya Seç')).toBeInTheDocument()
            })
        })

        it('Dosya seçilebilir', async () => {
            const user = userEvent.setup()
            render(<FeedbackModal />)

            const trigger = screen.getByText('Geri Bildirim')
            await user.click(trigger)

            await waitFor(() => {
                const fileButton = screen.getByText('Dosya Seç')
                expect(fileButton).toBeInTheDocument()
            })

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

            if (fileInput) {
                await user.upload(fileInput, file)
            }

            await waitFor(() => {
                expect(global.URL.createObjectURL).toHaveBeenCalled()
            })
        })

        it('Maksimum 5 dosya seçilebilir', async () => {
            const user = userEvent.setup()
            render(<FeedbackModal />)

            const trigger = screen.getByText('Geri Bildirim')
            await user.click(trigger)

            await waitFor(() => {
                const fileButton = screen.getByText('Dosya Seç')
                expect(fileButton).toBeInTheDocument()
            })

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
            const files = Array.from({ length: 6 }, (_, i) =>
                new File(['test'], `test-${i}.jpg`, { type: 'image/jpeg' })
            )

            if (fileInput) {
                await user.upload(fileInput, files)
            }

            // 5 dosya seçilmeli
            await waitFor(() => {
                expect(global.URL.createObjectURL).toHaveBeenCalledTimes(5)
            })
        })

        it('Çok büyük dosya için hata gösterilir', async () => {
            const user = userEvent.setup()
            const { toast } = await import('sonner')

            render(<FeedbackModal />)

            const trigger = screen.getByText('Geri Bildirim')
            await user.click(trigger)

            await waitFor(() => {
                const subjectInput = screen.getByPlaceholderText(/Hata raporu/i)
                expect(subjectInput).toBeInTheDocument()
            })

            const subjectInput = screen.getByPlaceholderText(/Hata raporu/i)
            const messageInput = screen.getByPlaceholderText(/Detaylı açıklama/i)

            await user.type(subjectInput, 'Test Subject')
            await user.type(messageInput, 'Test Message')

            // 51MB file (limit 50MB)
            const largeFile = new File(['x'.repeat(51 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

            if (fileInput) {
                await user.upload(fileInput, largeFile)
            }

            const submitButton = screen.getByText('Gönder')
            await user.click(submitButton)

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalled()
            })
        })
    })

    describe('Dosya Silme', () => {
        it('Dosya silinebilir', async () => {
            const user = userEvent.setup()
            render(<FeedbackModal />)

            const trigger = screen.getByText('Geri Bildirim')
            await user.click(trigger)

            await waitFor(() => {
                const fileButton = screen.getByText('Dosya Seç')
                expect(fileButton).toBeInTheDocument()
            })

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

            if (fileInput) {
                await user.upload(fileInput, file)
            }

            await waitFor(() => {
                expect(global.URL.createObjectURL).toHaveBeenCalled()
            })

            // Delete button should appear on hover, but we can test the remove function
            // by checking if the file is removed from state
            const removeButtons = document.querySelectorAll('button[type="button"]')
            const deleteButton = Array.from(removeButtons).find(btn =>
                btn.querySelector('.w-3.h-3') // X icon
            )

            if (deleteButton) {
                await user.click(deleteButton)
            }

            await waitFor(() => {
                expect(global.URL.revokeObjectURL).toHaveBeenCalled()
            })
        })
    })

    describe('Dosya ile Form Gönderimi', () => {
        it('Dosya ile birlikte form gönderilebilir', async () => {
            const user = userEvent.setup()
            const { sendFeedback } = await import('@/lib/actions/feedback')

            render(<FeedbackModal />)

            const trigger = screen.getByText('Geri Bildirim')
            await user.click(trigger)

            await waitFor(() => {
                const subjectInput = screen.getByPlaceholderText(/Hata raporu/i)
                expect(subjectInput).toBeInTheDocument()
            })

            const subjectInput = screen.getByPlaceholderText(/Hata raporu/i)
            const messageInput = screen.getByPlaceholderText(/Detaylı açıklama/i)

            await user.type(subjectInput, 'Test Subject')
            await user.type(messageInput, 'Test Message')

            // Add file
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

            if (fileInput) {
                await user.upload(fileInput, file)
            }

            await waitFor(() => {
                expect(global.URL.createObjectURL).toHaveBeenCalled()
            })

            const submitButton = screen.getByText('Gönder')
            await user.click(submitButton)

            await waitFor(() => {
                expect(mockUpload).toHaveBeenCalled()
            })

            await waitFor(() => {
                expect(sendFeedback).toHaveBeenCalledWith(
                    expect.objectContaining({
                        subject: 'Test Subject',
                        message: 'Test Message',
                        attachments: expect.arrayContaining([expect.any(String)]),
                    })
                )
            })
        })
    })

    describe('Modal Kapatma', () => {
        it('Cancel butonu modalı kapatır', async () => {
            const user = userEvent.setup()
            render(<FeedbackModal />)

            const trigger = screen.getByText('Geri Bildirim')
            await user.click(trigger)

            await waitFor(() => {
                expect(screen.getByText('Geri Bildirim Gönder')).toBeInTheDocument()
            })

            const cancelButton = screen.getByText('İptal')
            await user.click(cancelButton)

            await waitFor(() => {
                expect(screen.queryByText('Geri Bildirim Gönder')).not.toBeInTheDocument()
            })
        })
    })

    describe('Error Handling', () => {
        it('Kullanıcı oturumu yoksa hata gösterilir', async () => {
            const user = userEvent.setup()
            const { toast } = await import('sonner')

            mockGetUser.mockResolvedValueOnce({
                data: { user: null },
            })

            render(<FeedbackModal />)

            const trigger = screen.getByText('Geri Bildirim')
            await user.click(trigger)

            await waitFor(() => {
                const subjectInput = screen.getByPlaceholderText(/Hata raporu/i)
                expect(subjectInput).toBeInTheDocument()
            })

            const subjectInput = screen.getByPlaceholderText(/Hata raporu/i)
            const messageInput = screen.getByPlaceholderText(/Detaylı açıklama/i)

            await user.type(subjectInput, 'Test Subject')
            await user.type(messageInput, 'Test Message')

            // Add file to trigger getUser
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

            if (fileInput) {
                await user.upload(fileInput, file)
            }

            const submitButton = screen.getByText('Gönder')
            await user.click(submitButton)

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalled()
            })
        })
    })
})
