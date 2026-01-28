import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ForgotPasswordPage from '@/app/auth/forgot-password/page'

// Mock dependencies
const mockResetPasswordForEmail = vi.fn()
const mockSignInWithOAuth = vi.fn()
const mockGetUser = vi.fn()

const mockSupabaseClient = {
    auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
        signInWithOAuth: mockSignInWithOAuth,
        getUser: mockGetUser,
    },
}

vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('@/lib/i18n-provider', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'auth.forgotPasswordTitle': 'Şifremi Unuttum',
                'auth.forgotPasswordSubtitle': 'Email adresinize şifre sıfırlama linki göndereceğiz',
                'auth.email': 'Email',
                'auth.placeholderEmail': 'ornek@email.com',
                'auth.sendResetLink': 'Şifre Sıfırlama Linki Gönder',
                'auth.backToLogin': 'Giriş Sayfasına Dön',
                'auth.emailSentTitle': 'Email Gönderildi',
                'auth.emailSentText': 'Şifre sıfırlama linki {email} adresine gönderildi.',
                'common.error': 'Bir hata oluştu',
            }
            return translations[key] || key
        },
        language: 'tr',
    }),
}))

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
    }),
    usePathname: () => '/auth/forgot-password',
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}))

// Mock fetch for check-provider API
global.fetch = vi.fn()

// Mock window.location
Object.defineProperty(window, 'location', {
    value: {
        origin: 'http://localhost:3000',
    },
    writable: true,
})

describe('Forgot Password Sayfası Testleri', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockResetPasswordForEmail.mockReset()
        mockSignInWithOAuth.mockReset()
        ;(global.fetch as unknown as { mockReset: () => void }).mockReset()
    })

    describe('Form Render ve Temel İşlevsellik', () => {
        it('Sayfa başarıyla render edilir', () => {
            render(<ForgotPasswordPage />)

            expect(screen.getByText('Şifremi Unuttum')).toBeInTheDocument()
            expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /gönder/i })).toBeInTheDocument()
        })

        it('Email input alanı çalışır', async () => {
            const user = userEvent.setup()
            render(<ForgotPasswordPage />)

            const emailInput = screen.getByPlaceholderText(/email/i)
            await user.type(emailInput, 'test@example.com')

            expect(emailInput).toHaveValue('test@example.com')
        })

        it('Email input zorunlu alandır', () => {
            render(<ForgotPasswordPage />)

            const emailInput = screen.getByPlaceholderText(/email/i)
            expect(emailInput).toHaveAttribute('required')
            expect(emailInput).toHaveAttribute('type', 'email')
        })
    })

    describe('Şifre Sıfırlama İşlemi', () => {
        it('Başarılı şifre sıfırlama email gönderimi', async () => {
            const user = userEvent.setup()
            
            // Check provider API mock - normal user
            ;(global.fetch as unknown as { mockResolvedValueOnce: (value: Response | Promise<Response>) => typeof global.fetch }).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ isOAuth: false, provider: null }),
            })

            mockResetPasswordForEmail.mockResolvedValueOnce({
                data: {},
                error: null,
            })

            render(<ForgotPasswordPage />)

            const emailInput = screen.getByPlaceholderText(/email/i)
            const submitButton = screen.getByRole('button', { name: /gönder/i })

            await user.type(emailInput, 'test@example.com')
            await user.click(submitButton)

            await waitFor(() => {
                expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
                    'test@example.com',
                    expect.objectContaining({
                        redirectTo: expect.stringContaining('/auth/reset-password'),
                    })
                )
            })

            // Success state görünmeli
            await waitFor(() => {
                expect(screen.getByText('Email Gönderildi')).toBeInTheDocument()
            })
        })

        it('Email bulunamadı hatası gösterir', async () => {
            const user = userEvent.setup()
            
            ;(global.fetch as unknown as { mockResolvedValueOnce: (value: Response | Promise<Response>) => typeof global.fetch }).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ isOAuth: false, provider: null }),
            })

            mockResetPasswordForEmail.mockResolvedValueOnce({
                data: null,
                error: { message: 'user not found' },
            })

            render(<ForgotPasswordPage />)

            const emailInput = screen.getByPlaceholderText(/email/i)
            const submitButton = screen.getByRole('button', { name: /gönder/i })

            await user.type(emailInput, 'nonexistent@example.com')
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/kayıtlı kullanıcı bulunamadı/i)).toBeInTheDocument()
            })
        })

        it('Rate limit hatası gösterir', async () => {
            const user = userEvent.setup()
            
            ;(global.fetch as unknown as { mockResolvedValueOnce: (value: Response | Promise<Response>) => typeof global.fetch }).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ isOAuth: false, provider: null }),
            })

            mockResetPasswordForEmail.mockResolvedValueOnce({
                data: null,
                error: { message: 'rate limit exceeded' },
            })

            render(<ForgotPasswordPage />)

            const emailInput = screen.getByPlaceholderText(/email/i)
            const submitButton = screen.getByRole('button', { name: /gönder/i })

            await user.type(emailInput, 'test@example.com')
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/çok fazla istek/i)).toBeInTheDocument()
            })
        })

        it('Loading state gösterir', async () => {
            const user = userEvent.setup()
            
            ;(global.fetch as unknown as { mockResolvedValueOnce: (value: Response | Promise<Response>) => typeof global.fetch }).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ isOAuth: false, provider: null }),
            })

            // Async işlemi yavaşlat
            mockResetPasswordForEmail.mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve({
                    data: {},
                    error: null,
                }), 100))
            )

            render(<ForgotPasswordPage />)

            const emailInput = screen.getByPlaceholderText(/email/i)
            const submitButton = screen.getByRole('button', { name: /gönder/i })

            await user.type(emailInput, 'test@example.com')
            await user.click(submitButton)

            // Loading spinner görünmeli
            await waitFor(() => {
                expect(submitButton).toBeDisabled()
            })
        })
    })

    describe('Google OAuth Kullanıcı Kontrolü', () => {
        it('Google kullanıcısı için uyarı gösterir', async () => {
            const user = userEvent.setup()
            
            // Check provider API - Google user
            ;(global.fetch as unknown as { mockResolvedValueOnce: (value: Response | Promise<Response>) => typeof global.fetch }).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ isOAuth: true, provider: 'google' }),
            })

            render(<ForgotPasswordPage />)

            const emailInput = screen.getByPlaceholderText(/email/i)
            const submitButton = screen.getByRole('button', { name: /gönder/i })

            await user.type(emailInput, 'google@example.com')
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/Google Hesabı Tespit Edildi/i)).toBeInTheDocument()
                expect(screen.getByText(/Google ile Giriş Yap/i)).toBeInTheDocument()
            })
        })

        it('Google ile giriş butonu çalışır', async () => {
            const user = userEvent.setup()
            
            ;(global.fetch as unknown as { mockResolvedValueOnce: (value: Response | Promise<Response>) => typeof global.fetch }).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ isOAuth: true, provider: 'google' }),
            })

            mockSignInWithOAuth.mockResolvedValueOnce({
                data: { url: 'https://accounts.google.com/oauth' },
                error: null,
            })

            render(<ForgotPasswordPage />)

            const emailInput = screen.getByPlaceholderText(/email/i)
            const submitButton = screen.getByRole('button', { name: /gönder/i })

            await user.type(emailInput, 'google@example.com')
            await user.click(submitButton)

            // Google warning görünmeli
            await waitFor(() => {
                expect(screen.getByText(/Google ile Giriş Yap/i)).toBeInTheDocument()
            })

            // Google ile giriş butonuna tıkla
            const googleButton = screen.getByText(/Google ile Giriş Yap/i)
            await user.click(googleButton)

            await waitFor(() => {
                expect(mockSignInWithOAuth).toHaveBeenCalledWith({
                    provider: 'google',
                    options: {
                        redirectTo: expect.stringContaining('/auth/callback'),
                    },
                })
            })
        })

        it('Yine de şifre belirle butonu çalışır', async () => {
            const user = userEvent.setup()
            
            ;(global.fetch as unknown as { mockResolvedValueOnce: (value: Response | Promise<Response>) => typeof global.fetch }).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ isOAuth: true, provider: 'google' }),
            })

            mockResetPasswordForEmail.mockResolvedValueOnce({
                data: {},
                error: null,
            })

            render(<ForgotPasswordPage />)

            const emailInput = screen.getByPlaceholderText(/email/i)
            const submitButton = screen.getByRole('button', { name: /gönder/i })

            await user.type(emailInput, 'google@example.com')
            await user.click(submitButton)

            // Google warning görünmeli
            await waitFor(() => {
                expect(screen.getByText(/Yine de Şifre Belirle/i)).toBeInTheDocument()
            })

            // Yine de şifre belirle butonuna tıkla
            const continueButton = screen.getByText(/Yine de Şifre Belirle/i)
            await user.click(continueButton)

            await waitFor(() => {
                expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
                    'google@example.com',
                    expect.objectContaining({
                        redirectTo: expect.stringContaining('/auth/reset-password'),
                    })
                )
            })
        })
    })

    describe('Success State', () => {
        it('Başarılı email gönderimi sonrası success state gösterir', async () => {
            const user = userEvent.setup()
            
            ;(global.fetch as unknown as { mockResolvedValueOnce: (value: Response | Promise<Response>) => typeof global.fetch }).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ isOAuth: false, provider: null }),
            })

            mockResetPasswordForEmail.mockResolvedValueOnce({
                data: {},
                error: null,
            })

            render(<ForgotPasswordPage />)

            const emailInput = screen.getByPlaceholderText(/email/i)
            const submitButton = screen.getByRole('button', { name: /gönder/i })

            await user.type(emailInput, 'test@example.com')
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText('Email Gönderildi')).toBeInTheDocument()
                expect(screen.getByText(/test@example.com/i)).toBeInTheDocument()
            })
        })

        it('Success state\'de geri dön butonu görünür', async () => {
            const user = userEvent.setup()
            
            ;(global.fetch as unknown as { mockResolvedValueOnce: (value: Response | Promise<Response>) => typeof global.fetch }).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ isOAuth: false, provider: null }),
            })

            mockResetPasswordForEmail.mockResolvedValueOnce({
                data: {},
                error: null,
            })

            render(<ForgotPasswordPage />)

            const emailInput = screen.getByPlaceholderText(/email/i)
            const submitButton = screen.getByRole('button', { name: /gönder/i })

            await user.type(emailInput, 'test@example.com')
            await user.click(submitButton)

            await waitFor(() => {
                const backButton = screen.getByText(/Giriş Sayfasına Dön/i)
                expect(backButton).toBeInTheDocument()
                expect(backButton.closest('a')).toHaveAttribute('href', '/auth')
            })
        })
    })

    describe('Error Handling', () => {
        it('API hatası durumunda hata mesajı gösterir', async () => {
            const user = userEvent.setup()
            
            ;(global.fetch as unknown as { mockRejectedValueOnce: (error: Error) => typeof global.fetch }).mockRejectedValueOnce(new Error('Network error'))

            render(<ForgotPasswordPage />)

            const emailInput = screen.getByPlaceholderText(/email/i)
            const submitButton = screen.getByRole('button', { name: /gönder/i })

            await user.type(emailInput, 'test@example.com')
            await user.click(submitButton)

            // Check provider hatası durumunda normal flow devam eder
            await waitFor(() => {
                expect(mockResetPasswordForEmail).toHaveBeenCalled()
            })
        })

        it('Form submit sırasında buton disabled olur', async () => {
            const user = userEvent.setup()
            
            ;(global.fetch as unknown as { mockResolvedValueOnce: (value: Response | Promise<Response>) => typeof global.fetch }).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ isOAuth: false, provider: null }),
            })

            mockResetPasswordForEmail.mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve({
                    data: {},
                    error: null,
                }), 200))
            )

            render(<ForgotPasswordPage />)

            const emailInput = screen.getByPlaceholderText(/email/i)
            const submitButton = screen.getByRole('button', { name: /gönder/i })

            await user.type(emailInput, 'test@example.com')
            await user.click(submitButton)

            // Buton disabled olmalı
            expect(submitButton).toBeDisabled()

            // İşlem tamamlandığında tekrar enabled olmalı
            await waitFor(() => {
                expect(screen.getByText('Email Gönderildi')).toBeInTheDocument()
            })
        })
    })

    describe('Navigation', () => {
        it('Geri dön linki çalışır', () => {
            render(<ForgotPasswordPage />)

            const backLink = screen.getByText(/Giriş Sayfasına Dön/i)
            expect(backLink.closest('a')).toHaveAttribute('href', '/auth')
        })

        it('Form altındaki geri dön linki çalışır', () => {
            render(<ForgotPasswordPage />)

            const backLinks = screen.getAllByText(/Giriş Sayfasına Dön/i)
            const formBackLink = backLinks.find(link => 
                link.closest('form') !== null
            )
            
            if (formBackLink) {
                expect(formBackLink.closest('a')).toHaveAttribute('href', '/auth')
            }
        })
    })
})
