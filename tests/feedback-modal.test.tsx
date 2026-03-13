import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { FeedbackModal } from '@/components/dashboard/feedback-modal'

const { mockGetUser, mockGetSession, mockRefreshSession, sendFeedbackMock, storageUploadMock } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockGetSession: vi.fn(),
  mockRefreshSession: vi.fn(),
  sendFeedbackMock: vi.fn(),
  storageUploadMock: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
      getSession: mockGetSession,
      refreshSession: mockRefreshSession,
    },
  })),
}))

vi.mock('@/lib/storage', () => ({
  storage: {
    upload: storageUploadMock,
  },
}))

vi.mock('@/lib/actions/feedback', () => ({
  sendFeedback: sendFeedbackMock,
}))

vi.mock('@/lib/contexts/i18n-provider', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const table: Record<string, string> = {
        'feedback.title': 'Geri Bildirim Gonder',
        'feedback.description': 'Sorunlarinizi veya onerilerinizi paylasin',
        'feedback.subject': 'Konu',
        'feedback.subjectPlaceholder': 'Orn: Hata raporu, ozellik onerisi...',
        'feedback.message': 'Mesaj',
        'feedback.messagePlaceholder': 'Detayli aciklama yazin...',
        'feedback.addFiles': 'Dosya Ekle',
        'feedback.selectFile': 'Dosya Sec',
        'feedback.maxFiles': 'Maksimum 5 dosya, her biri 50MB\'dan kucuk',
        'feedback.alert': 'Gizlilik: Dosyalariniz sadece destek ekibi tarafindan gorulebilir',
        'feedback.send': 'Gonder',
        'feedback.cancel': 'Iptal',
        'feedback.trigger': 'Geri Bildirim',
        'feedback.errorFields': 'Lutfen konu ve mesaj alanlarini doldurun',
        'feedback.fileTooLarge': 'Dosya boyutu 50MB\'dan buyuk olamaz',
        'feedback.uploading': 'Yukleniyor',
        'feedback.uploadSuccess': 'Dosya yuklendi',
        'feedback.sending': 'Gonderiliyor...',
        'feedback.success': 'Geri bildiriminiz gonderildi',
        'common.error': 'Bir hata olustu',
      }
      const base = table[key] || key
      if (!params) return base
      return Object.entries(params).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), base)
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

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt?: string; [key: string]: unknown }) => {
    const { fill: _fill, unoptimized: _unoptimized, ...imgProps } = props
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt || ''} {...imgProps} />
  },
}))

global.URL.createObjectURL = vi.fn(() => 'blob:test')
global.URL.revokeObjectURL = vi.fn()

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

describe('Feedback Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u-1' } } } })
    mockRefreshSession.mockResolvedValue({ data: { session: null, user: null }, error: null })

    storageUploadMock.mockResolvedValue({
      url: 'https://example.com/public.jpg',
      path: 'feedback/test.jpg',
      metadata: {},
    })

    sendFeedbackMock.mockResolvedValue({ success: true })
  })

  it('renders and opens modal', async () => {
    const user = userEvent.setup()
    render(<FeedbackModal />)

    await user.click(screen.getByText(/Geri Bildirim/i))

    await waitFor(() => {
      expect(screen.getByText(/Geri Bildirim Gonder/i)).toBeInTheDocument()
    })
  })

  it('shows validation error when subject/message empty', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')

    render(<FeedbackModal />)
    await user.click(screen.getByText(/Geri Bildirim/i))
    await user.click(screen.getByRole('button', { name: /^Gonder$/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Lutfen konu ve mesaj alanlarini doldurun')
    })
  })

  it('submits successfully and calls sendFeedback with expected payload', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')

    render(<FeedbackModal />)
    await user.click(screen.getByText(/Geri Bildirim/i))

    await user.type(screen.getByPlaceholderText(/Hata raporu/i), 'Test Subject')
    await user.type(screen.getByPlaceholderText(/Detayli aciklama/i), 'Test Message')

    await user.click(screen.getByRole('button', { name: /^Gonder$/i }))

    await waitFor(() => {
      expect(sendFeedbackMock).toHaveBeenCalledWith({
        subject: 'Test Subject',
        message: 'Test Message',
        page_url: '/dashboard',
        attachments: [],
      })
    })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Geri bildiriminiz gonderildi', { id: 'feedback-send' })
    })
  })

  it('disables submit during sending', async () => {
    const user = userEvent.setup()

    sendFeedbackMock.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 150))
    )

    render(<FeedbackModal />)
    await user.click(screen.getByText(/Geri Bildirim/i))

    await user.type(screen.getByPlaceholderText(/Hata raporu/i), 'Test Subject')
    await user.type(screen.getByPlaceholderText(/Detayli aciklama/i), 'Test Message')

    const submit = screen.getByRole('button', { name: /^Gonder$/i })
    await user.click(submit)

    await waitFor(() => {
      expect(submit).toBeDisabled()
    })
  })

  it('uploads attachment and includes uploaded URL in sendFeedback payload', async () => {
    const user = userEvent.setup()

    render(<FeedbackModal />)
    await user.click(screen.getByText(/Geri Bildirim/i))

    await user.type(screen.getByPlaceholderText(/Hata raporu/i), 'Subject')
    await user.type(screen.getByPlaceholderText(/Detayli aciklama/i), 'Message')

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    await user.upload(fileInput, file)

    await user.click(screen.getByRole('button', { name: /^Gonder$/i }))

    await waitFor(() => {
      expect(storageUploadMock).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(sendFeedbackMock).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: expect.arrayContaining(['https://example.com/public.jpg']),
        })
      )
    })
  })

  it('caps previews at 5 files', async () => {
    const user = userEvent.setup()

    render(<FeedbackModal />)
    await user.click(screen.getByText(/Geri Bildirim/i))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const files = Array.from({ length: 6 }, (_, i) => new File(['x'], `f-${i}.jpg`, { type: 'image/jpeg' }))

    await user.upload(fileInput, files)

    await waitFor(() => {
      expect(document.querySelectorAll('img[src="blob:test"]').length).toBe(5)
    })
  })

  it('shows error toast if sendFeedback fails', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')

    sendFeedbackMock.mockRejectedValueOnce(new Error('Backend error'))

    render(<FeedbackModal />)
    await user.click(screen.getByText(/Geri Bildirim/i))

    await user.type(screen.getByPlaceholderText(/Hata raporu/i), 'Subject')
    await user.type(screen.getByPlaceholderText(/Detayli aciklama/i), 'Message')

    await user.click(screen.getByRole('button', { name: /^Gonder$/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })

  it('closes when cancel clicked', async () => {
    const user = userEvent.setup()

    render(<FeedbackModal />)
    await user.click(screen.getByText(/Geri Bildirim/i))

    await waitFor(() => {
      expect(screen.getByText(/Geri Bildirim Gonder/i)).toBeInTheDocument()
    })

    await user.click(screen.getByText(/Iptal/i))

    await waitFor(() => {
      expect(screen.queryByText(/Geri Bildirim Gonder/i)).not.toBeInTheDocument()
    })
  })
})
