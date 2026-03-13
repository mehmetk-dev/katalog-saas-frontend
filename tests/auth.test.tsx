import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthPageClient } from '@/components/auth/auth-page-client'
import { useRouter } from 'next/navigation'

const mockSupabaseAuth = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
  getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  refreshSession: vi.fn(async () => ({ data: { session: null, user: null }, error: null })),
}

const mockSupabaseClient = {
  auth: mockSupabaseAuth,
  from: vi.fn(() => ({ insert: vi.fn() })),
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('@/lib/contexts/i18n-provider', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'auth.signup': 'Kayit Ol',
        'auth.signin': 'Giris Yap',
        'auth.welcomeBack': 'Hos Geldiniz',
        'auth.createAccount': 'Hesap Olusturun',
        'auth.email': 'E-posta',
        'auth.password': 'Sifre',
        'auth.placeholderEmail': 'email_placeholder',
        'auth.placeholderPassword': 'password_placeholder',
        'auth.forgotPassword': 'Sifremi Unuttum',
        'auth.continueWithGoogle': 'Google ile Devam Et',
        'auth.alreadyHaveAccount': 'Zaten hesabin var mi?',
        'auth.dontHaveAccount': 'Hesabin yok mu?',
        'auth.errorTitle': 'Hata',
        'auth.fullName': 'Isim Soyad',
        'auth.company': 'Kurum',
        'auth.placeholderName': 'name_placeholder',
        'auth.placeholderCompany': 'company_placeholder',
        'auth.signupDesc': 'Hemen hesap olusturun',
        'auth.signinDesc': 'Giris yaparak devam edin',
        'auth.forgotPasswordTitle': 'Sifremi Unuttum',
        'auth.forgotPasswordSubtitle': 'Sifrenizi sifirlayin',
        'auth.or': 'veya',
        'auth.backToHome': 'Anasayfaya Don',
        'auth.backToLogin': "Giris Yapa Don",
        'auth.sendResetLink': 'Sifirlama Linki Gonder',
        'auth.emailNotConfirmed': 'Email not confirmed',
        'auth.alreadyRegistered': 'Already registered',
        'auth.invalidCredentials': 'Invalid credentials',
        'auth.errorGeneric': 'Bir hata olustu',
      }
      return translations[key] || key
    },
    language: 'tr',
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(() => ({ get: vi.fn(() => null) })),
  usePathname: vi.fn(() => '/auth'),
}))

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

describe('Authentication Tests', () => {
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

    mockSupabaseAuth.signUp.mockReset()
    mockSupabaseAuth.signInWithPassword.mockReset()
    mockSupabaseAuth.signInWithOAuth.mockReset()
    mockSupabaseAuth.getSession.mockResolvedValue({ data: { session: null }, error: null })
  })

  describe('Sign Up', () => {
    it('handles successful sign up with session', async () => {
      const user = userEvent.setup()

      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: { access_token: 'token' },
        },
        error: null,
      })

      render(<AuthPageClient />)

      await user.click(screen.getByRole('button', { name: /kayit ol/i }))

      await user.type(screen.getByPlaceholderText(/name_placeholder/i), 'Test User')
      await user.type(screen.getByPlaceholderText(/email_placeholder/i), 'test@example.com')
      await user.type(screen.getByPlaceholderText(/password_placeholder/i), 'password123')
      await user.type(screen.getByPlaceholderText(/company_placeholder/i), 'Test Company')

      const submit = screen.getAllByRole('button', { name: /kayit ol/i }).find(btn => btn.getAttribute('type') === 'submit')
      await user.click(submit!)

      await waitFor(() => {
        expect(mockSupabaseAuth.signUp).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard')
      }, { timeout: 4000 })
    })

    it('redirects to verify page when email confirmation is required', async () => {
      const user = userEvent.setup()

      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: null,
        },
        error: null,
      })

      render(<AuthPageClient />)

      await user.click(screen.getByRole('button', { name: /kayit ol/i }))

      await user.type(screen.getByPlaceholderText(/name_placeholder/i), 'Test User')
      await user.type(screen.getByPlaceholderText(/email_placeholder/i), 'test@example.com')
      await user.type(screen.getByPlaceholderText(/password_placeholder/i), 'password123')

      const submit = screen.getAllByRole('button', { name: /kayit ol/i }).find(btn => btn.getAttribute('type') === 'submit')
      await user.click(submit!)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/verify')
      })
    })

    it('shows sign up error message', async () => {
      const user = userEvent.setup()

      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: null,
        error: new Error('Already registered'),
      })

      render(<AuthPageClient />)

      await user.click(screen.getByRole('button', { name: /kayit ol/i }))

      await user.type(screen.getByPlaceholderText(/name_placeholder/i), 'Test User')
      await user.type(screen.getByPlaceholderText(/email_placeholder/i), 'existing@example.com')
      await user.type(screen.getByPlaceholderText(/password_placeholder/i), 'password123')

      const submit = screen.getAllByRole('button', { name: /kayit ol/i }).find(btn => btn.getAttribute('type') === 'submit')
      await user.click(submit!)

      await waitFor(() => {
        expect(screen.getByText(/already registered/i)).toBeInTheDocument()
      })
    })

    it('validates minimum password length on sign up', async () => {
      const user = userEvent.setup()

      render(<AuthPageClient />)
      await user.click(screen.getByRole('button', { name: /kayit ol/i }))

      await user.type(screen.getByPlaceholderText(/name_placeholder/i), 'Test User')
      await user.type(screen.getByPlaceholderText(/email_placeholder/i), 'test@example.com')
      await user.type(screen.getByPlaceholderText(/password_placeholder/i), '123')

      const submit = screen.getAllByRole('button', { name: /kayit ol/i }).find(btn => btn.getAttribute('type') === 'submit')
      await user.click(submit!)

      await waitFor(() => {
        expect(screen.getByText('auth.passwordLength')).toBeInTheDocument()
      })
    })
  })

  describe('Sign In', () => {
    it('handles successful sign in', async () => {
      const user = userEvent.setup()

      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: { access_token: 'token' },
        },
        error: null,
      })

      render(<AuthPageClient />)

      await user.type(screen.getByPlaceholderText(/email_placeholder/i), 'test@example.com')
      await user.type(screen.getByPlaceholderText(/password_placeholder/i), 'password123')

      await user.click(screen.getByRole('button', { name: /giris yap/i }))

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard')
      }, { timeout: 4000 })
    })

    it('shows error for invalid credentials', async () => {
      const user = userEvent.setup()

      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: null,
        error: new Error('Invalid login credentials'),
      })

      render(<AuthPageClient />)

      await user.type(screen.getByPlaceholderText(/email_placeholder/i), 'wrong@example.com')
      await user.type(screen.getByPlaceholderText(/password_placeholder/i), 'wrongpassword')

      await user.click(screen.getByRole('button', { name: /giris yap/i }))

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })

    it('shows error when email is not confirmed', async () => {
      const user = userEvent.setup()

      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: null,
        error: new Error('Email not confirmed'),
      })

      render(<AuthPageClient />)

      await user.type(screen.getByPlaceholderText(/email_placeholder/i), 'unverified@example.com')
      await user.type(screen.getByPlaceholderText(/password_placeholder/i), 'password123')

      await user.click(screen.getByRole('button', { name: /giris yap/i }))

      await waitFor(() => {
        expect(screen.getByText(/email not confirmed/i)).toBeInTheDocument()
      })
    })

    it('shows network error message', async () => {
      const user = userEvent.setup()

      mockSupabaseAuth.signInWithPassword.mockRejectedValueOnce(new Error('fetch failed'))

      render(<AuthPageClient />)

      await user.type(screen.getByPlaceholderText(/email_placeholder/i), 'test@example.com')
      await user.type(screen.getByPlaceholderText(/password_placeholder/i), 'password123')

      await user.click(screen.getByRole('button', { name: /giris yap/i }))

      await waitFor(() => {
        expect(screen.getByText(/fetch failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Google OAuth', () => {
    it('calls Google OAuth on button click', async () => {
      const user = userEvent.setup()

      render(<AuthPageClient />)

      await user.click(screen.getByRole('button', { name: /google/i }))

      expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({
        provider: 'google',
      }))
    })

    it('shows OAuth error message', async () => {
      const user = userEvent.setup()

      mockSupabaseAuth.signInWithOAuth.mockResolvedValueOnce({
        data: { url: '', provider: 'google' },
        error: { message: 'OAuth error' },
      })

      render(<AuthPageClient />)

      await user.click(screen.getByRole('button', { name: /google/i }))

      await waitFor(() => {
        expect(screen.getByText(/oauth error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Field Validation', () => {
    it('validates email format', async () => {
      const user = userEvent.setup()

      render(<AuthPageClient />)

      await user.type(screen.getByPlaceholderText(/email_placeholder/i), 'invalid-email')
      await user.click(screen.getByRole('button', { name: /giris yap/i }))

      await waitFor(() => {
        expect(screen.getByText('auth.invalidEmail')).toBeInTheDocument()
      })
    })

    it('requires mandatory fields', async () => {
      render(<AuthPageClient />)

      const emailInput = screen.getByPlaceholderText(/email_placeholder/i)
      const passwordInput = screen.getByPlaceholderText(/password_placeholder/i)

      expect(emailInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('required')
    })

    it('toggles password visibility', async () => {
      const user = userEvent.setup()

      render(<AuthPageClient />)

      const passwordInput = screen.getByPlaceholderText(/password_placeholder/i)
      const toggleButton = screen.getAllByRole('button').find(
        btn => btn.getAttribute('type') === 'button' && btn.querySelector('svg') !== null,
      )

      expect(toggleButton).toBeTruthy()
      expect(passwordInput).toHaveAttribute('type', 'password')

      await user.click(toggleButton!)
      expect(passwordInput).toHaveAttribute('type', 'text')

      await user.click(toggleButton!)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })
})

