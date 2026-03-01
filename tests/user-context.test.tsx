import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserProvider, useUser } from '@/lib/contexts/user-context'
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockSupabaseClient: any
    let mockApiFetch: ReturnType<typeof vi.fn>

    beforeEach(() => {
        vi.clearAllMocks()

        mockApiFetch = vi.fn()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(apiFetch).mockImplementation(mockApiFetch as any)

        const mockUsersBuilder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'user-1', plan: 'free' }, error: null }),
        }

        const mockCountBuilder = (count: number) => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count, error: null }),
        })

        mockSupabaseClient = {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@example.com' } }, error: null }),
                onAuthStateChange: vi.fn(() => ({
                    data: { subscription: { unsubscribe: vi.fn() } }
                })),
                signOut: vi.fn().mockResolvedValue({ error: null }),
                refreshSession: vi.fn(async () => ({ data: { session: null, user: null }, error: null })),
            },
            from: vi.fn((table: string) => {
                if (table === 'users') return mockUsersBuilder
                if (table === 'products') return mockCountBuilder(0)
                if (table === 'catalogs') return mockCountBuilder(0)
                return mockUsersBuilder
            }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any

        vi.mocked(createClient).mockReturnValue(mockSupabaseClient)

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ; (mockSupabaseClient as any).setMockProfile = (data: any) => {
                mockUsersBuilder.single.mockResolvedValue({ data, error: null })
            }
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
                exports_used: 0,
                maxExports: 10,
            }

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-1', email: 'test@example.com' } },
                error: null,
            })

                ; (mockSupabaseClient as any).setMockProfile(mockUser)

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
                exports_used: 0,
                maxExports: 0,
            }

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-1', email: 'test@example.com' } },
                error: null,
            })

                ; (mockSupabaseClient as any).setMockProfile(mockUser)

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
                exports_used: 5,
                maxExports: 50,
            }

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-1', email: 'test@example.com' } },
                error: null,
            })

                ; (mockSupabaseClient as any).setMockProfile(mockUser)

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
                exports_used: 100,
                maxExports: -1, // Unlimited
            }

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-1', email: 'test@example.com' } },
                error: null,
            })

                ; (mockSupabaseClient as any).setMockProfile(mockUser)

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
                exports_used: 1000,
                maxExports: -1,
            }

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-1', email: 'test@example.com' } },
                error: null,
            })

                ; (mockSupabaseClient as any).setMockProfile(mockUser)

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
                exports_used: 0,
                maxExports: 0,
            }

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-1', email: 'test@example.com' } },
                error: null,
            })

                ; (mockSupabaseClient as any).setMockProfile(mockUser)

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
                exports_used: 5,
                maxExports: 50,
            }

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-1', email: 'test@example.com' } },
                error: null,
            })

                ; (mockSupabaseClient as any).setMockProfile(mockUser)

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
                exports_used: 50,
                maxExports: 50,
            }

            mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-1', email: 'test@example.com' } },
                error: null,
            })

                ; (mockSupabaseClient as any).setMockProfile(mockUser)

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

                ; (mockSupabaseClient as any).setMockProfile(mockUser)
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let authStateChangeCallback: any = null

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
                ; (mockSupabaseClient as any).setMockProfile({
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let authStateChangeCallback: any = null

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

                ; (mockSupabaseClient as any).setMockProfile(mockUser)

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
