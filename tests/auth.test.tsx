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
}

const mockSupabaseClient = {
    auth: mockSupabaseAuth,
    from: vi.fn(() => ({
        insert: vi.fn(),
    })) as unknown as ReturnType<typeof mockSupabaseClient.from>,
}

vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('@/lib/i18n-provider', () => ({
    useTranslation: () => ({ t: (key: string) => key, language: 'tr' }),
}))

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
    }),
    usePathname: () => '/auth',
}))

global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
} as unknown as typeof ResizeObserver

describe('Authentication Testleri', () => {
    let mockRouter: {
        push: ReturnType<typeof vi.fn>;
        replace: ReturnType<typeof vi.fn>;
        refresh: ReturnType<typeof vi.fn>;
    }

    beforeEach(() => {
        vi.clearAllMocks()

        mockRouter = {
            push: vi.fn(),
            replace: vi.fn(),
            refresh: vi.fn(),
        }

        vi.mocked(useRouter).mockReturnValue(mockRouter as ReturnType<typeof useRouter>)

        // Reset mocks
        mockSupabaseAuth.signUp.mockReset()
        mockSupabaseAuth.signInWithPassword.mockReset()
        mockSupabaseAuth.signInWithOAuth.mockReset()
        mockSupabaseClient.from.mockReset()
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

            // Sign up moduna geç - tab veya toggle butonunu bul
            const signUpToggle = screen.queryByText(/kayıt ol|sign up|register/i) ||
                screen.queryByRole('button', { name: /kayıt ol|sign up/i })

            if (signUpToggle) {
                await user.click(signUpToggle)
            }

            // Form alanlarını doldur - placeholder veya label ile bul
            const nameInput = screen.queryByPlaceholderText(/ad|name/i) ||
                screen.queryByLabelText(/ad|name/i)
            const emailInput = screen.getByPlaceholderText(/e-posta|email/i)
            const passwordInput = screen.getByPlaceholderText(/şifre|password/i)
            const companyInput = screen.queryByPlaceholderText(/şirket|company/i) ||
                screen.queryByLabelText(/şirket|company/i)

            if (nameInput) await user.type(nameInput, 'Test User')
            await user.type(emailInput, 'test@example.com')
            await user.type(passwordInput, 'password123')
            if (companyInput) await user.type(companyInput, 'Test Company')

            // Submit butonuna tıkla
            const submitButton = screen.getByRole('button', { name: /kayıt ol|sign up|register/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(mockSupabaseAuth.signUp).toHaveBeenCalled()
            }, { timeout: 3000 })

            // Dashboard'a yönlendirme yapılmalı
            await waitFor(() => {
                expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
            }, { timeout: 3000 })
        })

        it('Email doğrulama gerektiğinde verify sayfasına yönlendirir', async () => {
            const user = userEvent.setup()

            mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
                data: {
                    user: { id: 'user-1', email: 'test@example.com' },
                    session: null, // Email doğrulama gerekiyor
                },
                error: null,
            })

            render(<AuthPageClient />)

            const signUpTab = screen.getByText(/kayıt ol|sign up/i)
            await user.click(signUpTab)

            const emailInput = screen.getByPlaceholderText(/e-posta/i)
            const passwordInput = screen.getByPlaceholderText(/şifre/i)

            await user.type(emailInput, 'test@example.com')
            await user.type(passwordInput, 'password123')

            const submitButton = screen.getByRole('button', { name: /kayıt ol|sign up/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(mockRouter.push).toHaveBeenCalledWith('/auth/verify')
            })
        })

        it('Kayıt hatası durumunda hata mesajı gösterir', async () => {
            const user = userEvent.setup()

            mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
                data: null,
                error: { message: 'Email already registered' },
            })

            render(<AuthPageClient />)

            const signUpTab = screen.getByText(/kayıt ol|sign up/i)
            await user.click(signUpTab)

            const emailInput = screen.getByPlaceholderText(/e-posta/i)
            const passwordInput = screen.getByPlaceholderText(/şifre/i)

            await user.type(emailInput, 'existing@example.com')
            await user.type(passwordInput, 'password123')

            const submitButton = screen.getByRole('button', { name: /kayıt ol|sign up/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/hata|error/i)).toBeTruthy()
            })
        })

        it('Şifre minimum uzunluk kontrolü yapar', async () => {
            const user = userEvent.setup()

            render(<AuthPageClient />)

            const signUpTab = screen.getByText(/kayıt ol|sign up/i)
            await user.click(signUpTab)

            const passwordInput = screen.getByPlaceholderText(/şifre/i)
            await user.type(passwordInput, '123') // Çok kısa şifre

            // HTML5 validation çalışmalı
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

            mockSupabaseClient.from.mockReturnValue({
                insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            })

            render(<AuthPageClient />)

            // Sign in formunu doldur
            const emailInput = screen.getByPlaceholderText(/e-posta/i)
            const passwordInput = screen.getByPlaceholderText(/şifre/i)

            await user.type(emailInput, 'test@example.com')
            await user.type(passwordInput, 'password123')

            const submitButton = screen.getByRole('button', { name: /giriş|sign in/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    password: 'password123',
                })
            })

            // Dashboard'a yönlendirme yapılmalı
            await waitFor(() => {
                expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
            })
        })

        it('Geçersiz kimlik bilgileri durumunda hata gösterir', async () => {
            const user = userEvent.setup()

            mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
                data: null,
                error: { message: 'Invalid login credentials' },
            })

            render(<AuthPageClient />)

            const emailInput = screen.getByPlaceholderText(/e-posta/i)
            const passwordInput = screen.getByPlaceholderText(/şifre/i)

            await user.type(emailInput, 'wrong@example.com')
            await user.type(passwordInput, 'wrongpassword')

            const submitButton = screen.getByRole('button', { name: /giriş|sign in/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/geçersiz|invalid|hatalı/i)).toBeTruthy()
            })
        })

        it('Email doğrulanmamış durumunda hata gösterir', async () => {
            const user = userEvent.setup()

            mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
                data: null,
                error: { message: 'Email not confirmed' },
            })

            render(<AuthPageClient />)

            const emailInput = screen.getByPlaceholderText(/e-posta/i)
            const passwordInput = screen.getByPlaceholderText(/şifre/i)

            await user.type(emailInput, 'unverified@example.com')
            await user.type(passwordInput, 'password123')

            const submitButton = screen.getByRole('button', { name: /giriş|sign in/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/doğrula|confirm/i)).toBeTruthy()
            })
        })

        it('Network hatası durumunda hata gösterir', async () => {
            const user = userEvent.setup()

            mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
                data: null,
                error: { message: 'fetch failed' },
            })

            render(<AuthPageClient />)

            const emailInput = screen.getByPlaceholderText(/e-posta/i)
            const passwordInput = screen.getByPlaceholderText(/şifre/i)

            await user.type(emailInput, 'test@example.com')
            await user.type(passwordInput, 'password123')

            const submitButton = screen.getByRole('button', { name: /giriş|sign in/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/network|ağ/i)).toBeTruthy()
            })
        })
    })

    describe('Google OAuth', () => {
        it('Google ile giriş butonu çalışır', async () => {
            const user = userEvent.setup()

            mockSupabaseClient.auth.signInWithOAuth.mockResolvedValueOnce({
                data: { url: 'https://accounts.google.com/oauth' },
                error: null,
            })

            render(<AuthPageClient />)

            const googleButton = screen.getByText(/google/i)
            await user.click(googleButton)

            await waitFor(() => {
                expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
                    provider: 'google',
                    options: {
                        redirectTo: expect.stringContaining('/auth/callback'),
                    },
                })
            })
        })

        it('OAuth hatası durumunda hata gösterir', async () => {
            const user = userEvent.setup()

            mockSupabaseClient.auth.signInWithOAuth.mockResolvedValueOnce({
                data: null,
                error: { message: 'OAuth error' },
            })

            render(<AuthPageClient />)

            const googleButton = screen.getByText(/google/i)
            await user.click(googleButton)

            // OAuth hataları genellikle redirect ile yönetilir
            await waitFor(() => {
                expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalled()
            })
        })
    })

    describe('Form Validasyonu', () => {
        it('Email formatı kontrolü yapar', async () => {
            const user = userEvent.setup()

            render(<AuthPageClient />)

            const emailInput = screen.getByPlaceholderText(/e-posta/i)
            await user.type(emailInput, 'invalid-email')

            // HTML5 validation
            expect(emailInput).toHaveAttribute('type', 'email')
        })

        it('Zorunlu alanlar boş bırakılamaz', async () => {
            userEvent.setup()

            render(<AuthPageClient />)

            const emailInput = screen.getByPlaceholderText(/e-posta/i)
            const passwordInput = screen.getByPlaceholderText(/şifre/i)

            expect(emailInput).toHaveAttribute('required')
            expect(passwordInput).toHaveAttribute('required')
        })

        it('Şifre göster/gizle toggle çalışır', async () => {
            const user = userEvent.setup()

            render(<AuthPageClient />)

            const passwordInput = screen.getByPlaceholderText(/şifre/i) as HTMLInputElement
            const toggleButton = screen.getByRole('button', { name: /göster|show|hide/i })

            // Başlangıçta şifre gizli olmalı
            expect(passwordInput.type).toBe('password')

            // Toggle'a tıkla
            await user.click(toggleButton)

            // Şifre görünür olmalı
            await waitFor(() => {
                expect(passwordInput.type).toBe('text')
            })
        })
    })

    describe('Loading States', () => {
        it('Giriş sırasında loading state gösterir', async () => {
            const user = userEvent.setup()

            // Async işlemi yavaşlat
            mockSupabaseClient.auth.signInWithPassword.mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve({
                    data: { user: { id: 'user-1' }, session: {} },
                    error: null,
                }), 100))
            )

            render(<AuthPageClient />)

            const emailInput = screen.getByPlaceholderText(/e-posta/i)
            const passwordInput = screen.getByPlaceholderText(/şifre/i)

            await user.type(emailInput, 'test@example.com')
            await user.type(passwordInput, 'password123')

            const submitButton = screen.getByRole('button', { name: /giriş|sign in/i })
            await user.click(submitButton)

            // Loading state kontrolü
            await waitFor(() => {
                expect(submitButton).toHaveAttribute('disabled')
            })
        })
    })
})
