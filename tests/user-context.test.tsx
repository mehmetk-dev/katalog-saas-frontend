import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserProvider, useUser } from '@/lib/user-context'
import { createClient } from '@/lib/supabase/client'
import { apiFetch } from '@/lib/api'

// Mock dependencies
vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn(),
            onAuthStateChange: vi.fn(() => ({
                data: { subscription: { unsubscribe: vi.fn() } }
            })),
            signOut: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn(),
        })),
    })),
}))

vi.mock('@/lib/api', () => ({
    apiFetch: vi.fn(),
}))

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
    }),
}))

// Test component that uses useUser
function TestComponent() {
    const { user, isLoading, logout, canExport, incrementExports } = useUser()

    if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <div>
            <div data-testid="user-plan">{user?.plan || 'no-plan'}</div>
            <div data-testid="user-email">{user?.email || 'no-email'}</div>
            <div data-testid="can-export">{canExport() ? 'yes' : 'no'}</div>
            <button onClick={logout}>Logout</button>
            <button onClick={incrementExports}>Increment Exports</button>
        </div>
    )
}

describe('User Context Testleri', () => {
    let mockSupabaseClient: ReturnType<typeof createClient>
    let mockApiFetch: ReturnType<typeof vi.fn>

    beforeEach(() => {
        vi.clearAllMocks()

        mockApiFetch = vi.fn()
        vi.mocked(apiFetch).mockImplementation(mockApiFetch)

        mockSupabaseClient = {
            auth: {
                getUser: vi.fn(),
                onAuthStateChange: vi.fn(() => ({
                    data: { subscription: { unsubscribe: vi.fn() } }
                })),
                signOut: vi.fn(),
            },
            from: vi.fn(() => ({
                select: vi.fn(),
            })),
        }

        vi.mocked(createClient).mockReturnValue(mockSupabaseClient)
    })

    describe('User Loading', () => {
        it('İlk yüklemede loading state gösterir', async () => {
            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: null,
            })

            mockApiFetch.mockResolvedValueOnce({
                id: 'user-1',
                email: 'test@example.com',
                plan: 'free',
            })

            render(
                <UserProvider>
                    <TestComponent />
                </UserProvider>
            )

            // İlk render'da loading gösterilmeli
            expect(screen.getByText('Loading...')).toBeTruthy()
        })

        it('User yüklendikten sonra bilgileri gösterir', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                plan: 'free',
                exportsUsed: 0,
                maxExports: 10,
            }

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-1', email: 'test@example.com' } },
                error: null,
            })

            mockApiFetch.mockResolvedValueOnce(mockUser)

            render(
                <UserProvider>
                    <TestComponent />
                </UserProvider>
            )

            await waitFor(() => {
                expect(screen.getByTestId('user-plan')).toHaveTextContent('free')
                expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
            })
        })
    })

    describe('User Plans', () => {
        it('Free plan kullanıcısı için doğru bilgileri gösterir', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                plan: 'free',
                exportsUsed: 0,
                maxExports: 0,
            }

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-1', email: 'test@example.com' } },
                error: null,
            })

            mockApiFetch.mockResolvedValueOnce(mockUser)

            render(
                <UserProvider>
                    <TestComponent />
                </UserProvider>
            )

            await waitFor(() => {
                expect(screen.getByTestId('user-plan')).toHaveTextContent('free')
            })
        })

        it('Plus plan kullanıcısı için doğru bilgileri gösterir', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                plan: 'plus',
                exportsUsed: 5,
                maxExports: 50,
            }

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-1', email: 'test@example.com' } },
                error: null,
            })

            mockApiFetch.mockResolvedValueOnce(mockUser)

            render(
                <UserProvider>
                    <TestComponent />
                </UserProvider>
            )

            await waitFor(() => {
                expect(screen.getByTestId('user-plan')).toHaveTextContent('plus')
            })
        })

        it('Pro plan kullanıcısı için doğru bilgileri gösterir', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                plan: 'pro',
                exportsUsed: 100,
                maxExports: -1, // Unlimited
            }

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-1', email: 'test@example.com' } },
                error: null,
            })

            mockApiFetch.mockResolvedValueOnce(mockUser)

            render(
                <UserProvider>
                    <TestComponent />
                </UserProvider>
            )

            await waitFor(() => {
                expect(screen.getByTestId('user-plan')).toHaveTextContent('pro')
            })
        })
    })

    describe('Export Limits', () => {
        it('Pro plan kullanıcısı sınırsız export yapabilir', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                plan: 'pro',
                exportsUsed: 1000,
                maxExports: -1,
            }

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-1', email: 'test@example.com' } },
                error: null,
            })

            mockApiFetch.mockResolvedValueOnce(mockUser)

            render(
                <UserProvider>
                    <TestComponent />
                </UserProvider>
            )

            await waitFor(() => {
                expect(screen.getByTestId('can-export')).toHaveTextContent('yes')
            })
        })

        it('Free plan kullanıcısı export yapamaz', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                plan: 'free',
                exportsUsed: 0,
                maxExports: 0,
            }

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-1', email: 'test@example.com' } },
                error: null,
            })

            mockApiFetch.mockResolvedValueOnce(mockUser)

            render(
                <UserProvider>
                    <TestComponent />
                </UserProvider>
            )

            await waitFor(() => {
                expect(screen.getByTestId('can-export')).toHaveTextContent('no')
            })
        })

        it('Plus plan kullanıcısı limit içindeyse export yapabilir', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                plan: 'plus',
                exportsUsed: 5,
                maxExports: 50,
            }

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-1', email: 'test@example.com' } },
                error: null,
            })

            mockApiFetch.mockResolvedValueOnce(mockUser)

            render(
                <UserProvider>
                    <TestComponent />
                </UserProvider>
            )

            await waitFor(() => {
                expect(screen.getByTestId('can-export')).toHaveTextContent('yes')
            })
        })

        it('Plus plan kullanıcısı limiti aştıysa export yapamaz', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                plan: 'plus',
                exportsUsed: 50,
                maxExports: 50,
            }

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-1', email: 'test@example.com' } },
                error: null,
            })

            mockApiFetch.mockResolvedValueOnce(mockUser)

            render(
                <UserProvider>
                    <TestComponent />
                </UserProvider>
            )

            await waitFor(() => {
                expect(screen.getByTestId('can-export')).toHaveTextContent('no')
            })
        })
    })

    describe('Logout', () => {
        it('Logout işlemi çalışır', async () => {
            const user = userEvent.setup()

            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                plan: 'free',
            }

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-1', email: 'test@example.com' } },
                error: null,
            })

            mockApiFetch.mockResolvedValueOnce(mockUser)
            mockSupabaseClient.auth.signOut.mockResolvedValueOnce({ error: null })

            // window.location.href mock
            delete (window as { location?: Location }).location
                ; (window as { location: { href: string } }).location = { href: '' }

            render(
                <UserProvider>
                    <TestComponent />
                </UserProvider>
            )

            await waitFor(() => {
                expect(screen.getByText('Logout')).toBeTruthy()
            })

            const logoutButton = screen.getByText('Logout')
            await user.click(logoutButton)

            await waitFor(() => {
                expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
            })
        })
    })

    describe('Auth State Changes', () => {
        it('Auth state değiştiğinde user bilgilerini günceller', async () => {
            let authStateChangeCallback: ((event: string, session: { user: { id: string; email: string } | null } | null) => void) | null = null

            mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback: (event: string, session: { user: { id: string; email: string } | null } | null) => void) => {
                authStateChangeCallback = callback
                return {
                    data: { subscription: { unsubscribe: vi.fn() } }
                }
            })

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: null,
            })

            render(
                <UserProvider>
                    <TestComponent />
                </UserProvider>
            )

            // Auth state change simüle et
            if (authStateChangeCallback) {
                mockApiFetch.mockResolvedValueOnce({
                    id: 'user-1',
                    email: 'test@example.com',
                    plan: 'free',
                })

                await authStateChangeCallback('SIGNED_IN', {
                    user: { id: 'user-1', email: 'test@example.com' },
                })

                await waitFor(() => {
                    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
                })
            }
        })

        it('Logout olduğunda user state temizlenir', async () => {
            let authStateChangeCallback: ((event: string, session: { user: { id: string; email: string } | null } | null) => void) | null = null

            mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback: (event: string, session: { user: { id: string; email: string } | null } | null) => void) => {
                authStateChangeCallback = callback
                return {
                    data: { subscription: { unsubscribe: vi.fn() } }
                }
            })

            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                plan: 'free',
            }

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-1', email: 'test@example.com' } },
                error: null,
            })

            mockApiFetch.mockResolvedValueOnce(mockUser)

            render(
                <UserProvider>
                    <TestComponent />
                </UserProvider>
            )

            await waitFor(() => {
                expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
            })

            // Logout simüle et
            if (authStateChangeCallback) {
                await authStateChangeCallback('SIGNED_OUT', null)

                await waitFor(() => {
                    expect(screen.getByTestId('user-email')).toHaveTextContent('no-email')
                })
            }
        })
    })
})
