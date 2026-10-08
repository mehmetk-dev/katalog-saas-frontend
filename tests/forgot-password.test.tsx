import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { redirect, useRouter, useSearchParams } from 'next/navigation'

import { AuthPageClient } from '@/components/auth/auth-page-client'
import ForgotPasswordPage from '@/app/auth/forgot-password/page'

const mockResetPasswordForEmail = vi.fn()
const mockSupabaseClient = {
    auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
        signInWithOAuth: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
}

vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('@/lib/contexts/i18n-provider', () => ({
    useTranslation: () => ({
        t: (key: string, params?: Record<string, unknown>) =>
            params?.email ? `${key}:${params.email}` : key,
        language: 'tr',
    }),
}))

vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
    useSearchParams: vi.fn(),
    usePathname: vi.fn(() => '/auth'),
    redirect: vi.fn(),
}))

const fetchMock = vi.fn()

function renderForgotPassword() {
    vi.mocked(useSearchParams).mockReturnValue(
        new URLSearchParams('tab=forgot-password') as unknown as ReturnType<typeof useSearchParams>,
    )
    return render(<AuthPageClient />)
}

describe('Şifremi unuttum', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('fetch', fetchMock)
        vi.mocked(useRouter).mockReturnValue({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() } as unknown as ReturnType<typeof useRouter>)
        mockResetPasswordForEmail.mockResolvedValue({ error: null })
    })

    it('/auth?tab=forgot-password doğrudan sıfırlama formunu açar', () => {
        renderForgotPassword()

        expect(screen.getByRole('heading', { name: 'auth.forgotPasswordTitle' })).toBeInTheDocument()
        expect(screen.queryByPlaceholderText('auth.placeholderPassword')).not.toBeInTheDocument()
    })

    it('sıfırlama e-postasını confirm-recovery dönüşüyle gönderir ve onay gösterir', async () => {
        const user = userEvent.setup()
        renderForgotPassword()

        await user.type(screen.getByPlaceholderText('auth.placeholderEmail'), 'test@example.com')
        await user.click(screen.getByRole('button', { name: 'auth.sendResetLink' }))

        await waitFor(() => {
            expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
                redirectTo: expect.stringMatching(/\/auth\/confirm-recovery$/),
            })
        })
        expect(await screen.findByText('auth.emailSentText:test@example.com')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'auth.backToLogin' })).toBeInTheDocument()
    })

    it('backend erişilemese bile e-postayı gönderir (hesap kontrolü yapılmaz)', async () => {
        const user = userEvent.setup()
        fetchMock.mockRejectedValue(new Error('Failed to fetch'))
        renderForgotPassword()

        await user.type(screen.getByPlaceholderText('auth.placeholderEmail'), 'test@example.com')
        await user.click(screen.getByRole('button', { name: 'auth.sendResetLink' }))

        await waitFor(() => expect(mockResetPasswordForEmail).toHaveBeenCalled())
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('rate limit hatasını çevrilmiş mesajla gösterir ve formu açık tutar', async () => {
        const user = userEvent.setup()
        mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'Email rate limit exceeded' } })
        renderForgotPassword()

        await user.type(screen.getByPlaceholderText('auth.placeholderEmail'), 'test@example.com')
        await user.click(screen.getByRole('button', { name: 'auth.sendResetLink' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('auth.resetPasswordTooManyRequests')
        expect(screen.getByPlaceholderText('auth.placeholderEmail')).toBeInTheDocument()
    })

    it('geçersiz e-postada istek atmaz', async () => {
        const user = userEvent.setup()
        renderForgotPassword()

        await user.type(screen.getByPlaceholderText('auth.placeholderEmail'), 'gecersiz')
        await user.click(screen.getByRole('button', { name: 'auth.sendResetLink' }))

        expect(await screen.findByText('auth.invalidEmail')).toBeInTheDocument()
        expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
    })

    it('eski /auth/forgot-password linki birleşik forma yönlendirir', async () => {
        await ForgotPasswordPage({ searchParams: Promise.resolve({ error: 'invalid_link' }) })

        expect(redirect).toHaveBeenCalledWith('/auth?tab=forgot-password&error=invalid_link')
    })
})
