import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthPageClient } from '@/components/auth/auth-page-client'
import { useRouter } from 'next/navigation'

// Mock dependencies
const mockSupabaseAuth = {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
    })),
    refreshSession: vi.fn(async () => ({ data: { session: null, user: null }, error: null })),
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSupabaseClient: any = {
    auth: {
        ...mockSupabaseAuth, // Spread existing auth mocks
        refreshSession: vi.fn(async () => ({ data: { session: null, user: null }, error: null })), // Ensure refreshSession is present
    },
    from: vi.fn(() => ({
        insert: vi.fn(),
    })),
}

vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('@/lib/contexts/i18n-provider', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'auth.signup': 'Kayıt Ol',
                'auth.signin': 'Giriş Yap',
                'auth.welcomeBack': 'Hoş Geldiniz',
                'auth.createAccount': 'Hesap Oluşturun',
                'auth.email': 'E-posta',
                'auth.password': 'Şifre',
                'auth.placeholderEmail': 'email_placeholder',
                'auth.placeholderPassword': 'password_placeholder',
                'auth.forgotPassword': 'Şifremi Unuttum',
                'auth.continueWithGoogle': 'Google ile Devam Et',
                'auth.alreadyHaveAccount': 'Zaten bir hesabınız var mı?',
                'auth.dontHaveAccount': 'Henüz bir hesabınız yok mu?',
                'auth.signupSuccessTitle': 'Hesap Oluşturuldu',
                'auth.signupSuccessText': 'Hesabınız başarıyla oluşturuldu.',
                'auth.invalidCredentials': 'Geçersiz email veya şifre',
                'auth.errorTitle': 'Hata',
                'common.error': 'Bir hata oluştu',
                'auth.fullName': 'İsim Soyad',
                'auth.company': 'Kurum',
                'auth.placeholderName': 'name_placeholder',
                'auth.placeholderCompany': 'company_placeholder',
                'auth.signupDesc': 'Hemen hesap oluşturun',
                'auth.signinDesc': 'Giriş yaparak devam edin',
                'auth.forgotPasswordTitle': 'Şifremi Unuttum',
                'auth.forgotPasswordSubtitle': 'Şifrenizi sıfırlayın',
                'auth.or': 'veya',
                'auth.backToHome': 'Anasayfaya Dön',
                'auth.backToLogin': "Giriş Yap'a Dön",
                'auth.sendResetLink': 'Sıfırlama Linki Gönder',
                'auth.emailNotConfirmed': 'Email not confirmed',
                'auth.alreadyRegistered': 'Already registered',
                'auth.errorGeneric': 'Bir hata oluştu',
            }
            return translations[key] || key
        },
        language: 'tr'
    }),
}))

vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
    useSearchParams: vi.fn(() => ({ get: vi.fn() })),
    usePathname: vi.fn(() => '/auth'),
}))

global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
} as unknown as typeof ResizeObserver

describe('Authentication Testleri', () => {
    let mockRouter: ReturnType<typeof useRouter>

    beforeEach(() => {
        vi.clearAllMocks()

        mockRouter = {
            push: vi.fn(),
            replace: vi.fn(),
            refresh: vi.fn(),
            prefetch: vi.fn(),
            back: vi.fn(),
            forward: vi.fn(),
        } as unknown as ReturnType<typeof useRouter>

        vi.mocked(useRouter).mockReturnValue(mockRouter)

        // Reset mocks manually
        mockSupabaseAuth.signUp.mockReset()
        mockSupabaseAuth.signInWithPassword.mockReset()
        mockSupabaseAuth.signInWithOAuth.mockReset()
        mockSupabaseClient.from.mockClear()
    })

    describe('Sign Up (Kayıt Ol)', () => {
        it('Başarılı kayıt işlemi yapar', async () => {
            const user = userEvent.setup()

            mockSupabaseAuth.signUp.mockResolvedValueOnce({
                data: {
                    user: { id: 'user-1', email: 'test@example.com' },
                    session: { access_token: 'token' }
                },
                error: null,
            })

            render(<AuthPageClient />)

            // Sign up moduna geç
            const signUpToggle = screen.queryByText(/kayıt ol/i) || screen.queryByRole('button', { name: /kayıt ol/i })
            if (signUpToggle) await user.click(signUpToggle)

            // Form alanlar─▒n─▒ doldur
            const nameInput = screen.getByPlaceholderText(/name_placeholder/i)
            const emailInput = screen.getByPlaceholderText(/email_placeholder/i)
            const passwordInput = screen.getByPlaceholderText(/password_placeholder/i)
            const companyInput = screen.getByPlaceholderText(/company_placeholder/i)

            await user.type(nameInput, 'Test User')
            await user.type(emailInput, 'test@example.com')
            await user.type(passwordInput, 'password123')
            await user.type(companyInput, 'Test Company')

            // Submit butonuna tıkla
            const submitButtons = screen.getAllByRole('button', { name: /kayıt ol/i })
            const submitButton = submitButtons.find(btn => btn.getAttribute('type') === 'submit') || submitButtons[0]
            await user.click(submitButton)

            await waitFor(() => {
                expect(mockSupabaseAuth.signUp).toHaveBeenCalled()
            }, { timeout: 3000 })

            await waitFor(() => {
                expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
            }, { timeout: 3000 })
        })

        it('Email doğrulama gerektiğinde verify sayfasına yönlendirir', async () => {
            const user = userEvent.setup()

            mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
                data: {
                    user: { id: 'user-1', email: 'test@example.com' },
                    session: null,
                },
                error: null,
            })

            render(<AuthPageClient />)

            const signUpTab = screen.getByText(/kayıt ol/i)
            await user.click(signUpTab)

            const nameInput = screen.getByPlaceholderText(/name_placeholder/i)
            const emailInput = screen.getByPlaceholderText(/email_placeholder/i)
            const passwordInput = screen.getByPlaceholderText(/password_placeholder/i)

            await user.type(nameInput, 'Test User')
            await user.type(emailInput, 'test@example.com')
            await user.type(passwordInput, 'password123')

            const submitButtons = screen.getAllByRole('button', { name: /kayıt ol/i })
            const submitButton = submitButtons.find(btn => btn.getAttribute('type') === 'submit') || submitButtons[0]
            await user.click(submitButton)

            await waitFor(() => {
                expect(mockRouter.push).toHaveBeenCalledWith('/auth/verify')
            }, { timeout: 3000 })
        })

        it('Kayıt hatası durumunda hata mesajı gösterir', async () => {
            const user = userEvent.setup()

            mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
                data: null,
                error: { message: 'Already registered' },
            })

            render(<AuthPageClient />)

            const signUpTab = screen.getByText(/kayıt ol/i)
            await user.click(signUpTab)

            const nameInput = screen.getByPlaceholderText(/name_placeholder/i)
            const emailInput = screen.getByPlaceholderText(/email_placeholder/i)
            const passwordInput = screen.getByPlaceholderText(/password_placeholder/i)

            await user.type(nameInput, 'Test User')
            await user.type(emailInput, 'existing@example.com')
            await user.type(passwordInput, 'password123')

            const submitButtons = screen.getAllByRole('button', { name: /kayıt ol/i })
            const submitButton = submitButtons.find(btn => btn.getAttribute('type') === 'submit') || submitButtons[0]
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/hata|error|already/i)).toBeTruthy()
            }, { timeout: 3000 })
        })

        it('Şifre minimum uzunluk kontrolü yapar', async () => {
            const user = userEvent.setup()

            render(<AuthPageClient />)

            const signUpTab = screen.getByText(/kayıt ol/i)
            await user.click(signUpTab)

            const passwordInput = screen.getByPlaceholderText(/password_placeholder/i)
            await user.type(passwordInput, '123')

            expect(passwordInput).toHaveAttribute('minLength', '6')
        })
    })

    describe('Sign In (Giriş Yap)', () => {
        it('Başarılı giriş işlemi yapar', async () => {
            const user = userEvent.setup()

            mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
                data: {
                    user: { id: 'user-1', email: 'test@example.com' },
                    session: { access_token: 'token' }
                },
                error: null,
            })

            render(<AuthPageClient />)

            const emailInput = screen.getByPlaceholderText(/email_placeholder/i)
            const passwordInput = screen.getByPlaceholderText(/password_placeholder/i)

            await user.type(emailInput, 'test@example.com')
            await user.type(passwordInput, 'password123')

            const submitButton = screen.getByRole('button', { name: /giriş|sign in/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
            }, { timeout: 3000 })
        })

        it('Geçersiz kimlik bilgileri durumunda hata gösterir', async () => {
            const user = userEvent.setup()

            mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
                data: null,
                error: { message: 'Invalid login credentials' },
            })

            render(<AuthPageClient />)

            const emailInput = screen.getByPlaceholderText(/email_placeholder/i)
            const passwordInput = screen.getByPlaceholderText(/password_placeholder/i)

            await user.type(emailInput, 'wrong@example.com')
            await user.type(passwordInput, 'wrongpassword')

            const submitButton = screen.getByRole('button', { name: /giriş|sign in/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/geçersiz|invalid|hatalı/i)).toBeTruthy()
            }, { timeout: 3000 })
        })

        it('Email doğrulanmamış durumunda hata gösterir', async () => {
            const user = userEvent.setup()

            mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
                data: null,
                error: { message: 'Email not confirmed' },
            })

            render(<AuthPageClient />)

            const emailInput = screen.getByPlaceholderText(/email_placeholder/i)
            const passwordInput = screen.getByPlaceholderText(/password_placeholder/i)

            await user.type(emailInput, 'unverified@example.com')
            await user.type(passwordInput, 'password123')

            const submitButton = screen.getByRole('button', { name: /giriş|sign in/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/doğrula|confirm|confirmed/i)).toBeTruthy()
            }, { timeout: 3000 })
        })

        it('Network hatası durumunda hata gösterir', async () => {
            const user = userEvent.setup()

            mockSupabaseClient.auth.signInWithPassword.mockRejectedValueOnce(new Error('fetch failed'))

            render(<AuthPageClient />)

            const emailInput = screen.getByPlaceholderText(/email_placeholder/i)
            const passwordInput = screen.getByPlaceholderText(/password_placeholder/i)

            await user.type(emailInput, 'test@example.com')
            await user.type(passwordInput, 'password123')

            const submitButton = screen.getByRole('button', { name: /giriş|sign in/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/hata|error|failed/i)).toBeTruthy()
            }, { timeout: 3000 })
        })
    })

    describe('Google OAuth', () => {
        it('Google ile giriş butonu çalışır', async () => {
            const user = userEvent.setup()

            render(<AuthPageClient />)

            const googleButton = screen.getByRole('button', { name: /google/i })
            await user.click(googleButton)

            expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({
                provider: 'google'
            }))
        })

        it('OAuth hatası durumunda hata gösterir', async () => {
            const user = userEvent.setup()

            mockSupabaseClient.auth.signInWithOAuth.mockResolvedValueOnce({
                data: { url: '', provider: 'google' },
                error: { message: 'OAuth error' },
            })

            render(<AuthPageClient />)

            const googleButton = screen.getByRole('button', { name: /google/i })
            await user.click(googleButton)

            await waitFor(() => {
                expect(screen.getByText(/hata|error/i)).toBeTruthy()
            }, { timeout: 3000 })
        })
    })

    describe('Field Validation', () => {
        it('Email formatı kontrolü yapar', async () => {
            const user = userEvent.setup()

            render(<AuthPageClient />)

            const emailInput = screen.getByPlaceholderText(/email_placeholder/i)
            await user.type(emailInput, 'invalid-email')

            const submitButton = screen.getByRole('button', { name: /giriş|sign in/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/geçersiz|gecersiz|format/i)).toBeTruthy()
            })
        })

        it('Zorunlu alanlar boş bırakılamaz', async () => {
            render(<AuthPageClient />)

            const emailInput = screen.getByPlaceholderText(/email_placeholder/i)
            const passwordInput = screen.getByPlaceholderText(/password_placeholder/i)

            expect(emailInput).toHaveAttribute('required')
            expect(passwordInput).toHaveAttribute('required')
        })

        it('Şifre göster/gizle toggle çalışır', async () => {
            const user = userEvent.setup()

            render(<AuthPageClient />)

            const passwordInput = screen.getByPlaceholderText(/password_placeholder/i)
            const toggleButtons = screen.getAllByRole('button')
            // Eye icon usually in a button, find by icon or first non-submit button
            const toggleButton = toggleButtons.find(btn => btn.querySelector('svg')) || toggleButtons[toggleButtons.length - 1]

            expect(passwordInput).toHaveAttribute('type', 'password')

            await user.click(toggleButton)
            expect(passwordInput).toHaveAttribute('type', 'text')

            await user.click(toggleButton)
            expect(passwordInput).toHaveAttribute('type', 'password')
        })
    })
})
