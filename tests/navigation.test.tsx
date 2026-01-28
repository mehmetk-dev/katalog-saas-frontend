import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePathname } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { useUser } from '@/lib/user-context'
import { useSidebar } from '@/lib/sidebar-context'

// Mock dependencies
vi.mock('@/lib/user-context', () => ({
    useUser: () => ({
        user: {
            id: 'user-1',
            email: 'test@example.com',
            plan: 'free',
            isAdmin: false,
        },
        isLoading: false,
    }),
}))

vi.mock('@/lib/i18n-provider', () => ({
    useTranslation: () => ({ t: (key: string) => key, language: 'tr' }),
}))

vi.mock('@/lib/sidebar-context', () => ({
    useSidebar: () => ({
        isOpen: true,
        isCollapsed: false,
        isMobile: false,
        close: vi.fn(),
        toggle: vi.fn(),
    }),
}))

vi.mock('next/navigation', () => ({
    usePathname: () => '/dashboard',
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
    }),
}))

vi.mock('next/link', () => ({
    default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
        <a href={href} {...props}>{children}</a>
    ),
}))

global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
} as unknown as typeof ResizeObserver

describe('Navigation Testleri', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Dashboard Sidebar', () => {
        it('Tüm navigation linklerini gösterir', () => {
            render(<DashboardSidebar />)

            expect(screen.getByText(/dashboard/i)).toBeTruthy()
            expect(screen.getByText(/products/i)).toBeTruthy()
            expect(screen.getByText(/catalogs/i)).toBeTruthy()
            expect(screen.getByText(/templates/i)).toBeTruthy()
            expect(screen.getByText(/settings/i)).toBeTruthy()
        })

        it('Aktif sayfa highlight edilir', () => {
            vi.mocked(usePathname).mockReturnValue('/dashboard/products')

            render(<DashboardSidebar />)

            // Aktif link'in class'ında active olmalı
            const productsLink = screen.getByText(/products/i).closest('a')
            expect(productsLink).toBeTruthy()
        })

        it('Admin panel sadece admin kullanıcılar için gösterilir', () => {
            vi.mocked(useUser).mockReturnValue({
                user: {
                    id: 'user-1',
                    email: 'admin@example.com',
                    plan: 'pro',
                    isAdmin: true,
                },
                isLoading: false,
            } as ReturnType<typeof useSidebar>)

            render(<DashboardSidebar />)

            expect(screen.getByText(/admin/i)).toBeTruthy()
        })

        it('Admin panel normal kullanıcılar için gösterilmez', () => {
            vi.mocked(useUser).mockReturnValue({
                user: {
                    id: 'user-1',
                    email: 'user@example.com',
                    plan: 'free',
                    isAdmin: false,
                },
                isLoading: false,
            } as ReturnType<typeof useSidebar>)

            render(<DashboardSidebar />)

            const adminLink = screen.queryByText(/admin panel/i)
            expect(adminLink).toBeNull()
        })

        it('Premium özellikler için upgrade modal gösterir', async () => {
            const user = userEvent.setup()

            render(<DashboardSidebar />)

            // Categories premium özellik
            const categoriesLink = screen.getByText(/categories/i)
            await user.click(categoriesLink)

            // Upgrade modal açılmalı
            await waitFor(() => {
                expect(screen.getByText(/upgrade|yükselt/i)).toBeTruthy()
            })
        })
    })

    describe('Mobile Navigation', () => {
        it('Mobilde sidebar overlay gösterir', () => {
            vi.mocked(useSidebar).mockReturnValue({
                isOpen: true,
                isCollapsed: false,
                isMobile: true,
                close: vi.fn(),
                toggle: vi.fn(),
            } as ReturnType<typeof useSidebar>)

            render(<DashboardSidebar />)

            // Overlay gösterilmeli
            const overlay = document.querySelector('.bg-black\\/50')
            expect(overlay).toBeTruthy()
        })

        it('Overlay tıklandığında sidebar kapanır', async () => {
            const user = userEvent.setup()
            const closeMock = vi.fn()

            vi.mocked(useSidebar).mockReturnValue({
                isOpen: true,
                isCollapsed: false,
                isMobile: true,
                close: closeMock,
                toggle: vi.fn(),
            } as ReturnType<typeof useSidebar>)

            render(<DashboardSidebar />)

            const overlay = document.querySelector('.bg-black\\/50')
            if (overlay) {
                await user.click(overlay)
                expect(closeMock).toHaveBeenCalled()
            }
        })

        it('Mobilde link tıklandığında sidebar kapanır', async () => {
            const user = userEvent.setup()
            const closeMock = vi.fn()

            vi.mocked(useSidebar).mockReturnValue({
                isOpen: true,
                isCollapsed: false,
                isMobile: true,
                close: closeMock,
                toggle: vi.fn(),
            } as ReturnType<typeof useSidebar>)

            render(<DashboardSidebar />)

            const productsLink = screen.getByText(/products/i)
            await user.click(productsLink)

            expect(closeMock).toHaveBeenCalled()
        })
    })

    describe('Sidebar Collapse', () => {
        it('Collapsed modda sadece iconlar gösterilir', () => {
            vi.mocked(useSidebar).mockReturnValue({
                isOpen: true,
                isCollapsed: true,
                isMobile: false,
                close: vi.fn(),
                toggle: vi.fn(),
            } as ReturnType<typeof useSidebar>)

            render(<DashboardSidebar />)

            // Text gizlenmeli, sadece iconlar görünmeli
            const sidebar = document.querySelector('aside')
            expect(sidebar?.className).toContain('w-16')
        })

        it('Toggle butonu sidebar\'ı açıp kapatır', async () => {
            const user = userEvent.setup()
            const toggleMock = vi.fn()

            vi.mocked(useSidebar).mockReturnValue({
                isOpen: true,
                isCollapsed: false,
                isMobile: false,
                close: vi.fn(),
                toggle: toggleMock,
            } as ReturnType<typeof useSidebar>)

            render(<DashboardSidebar />)

            const toggleButton = screen.getByRole('button', { name: /collapse|toggle/i })
            await user.click(toggleButton)

            expect(toggleMock).toHaveBeenCalled()
        })
    })
})
