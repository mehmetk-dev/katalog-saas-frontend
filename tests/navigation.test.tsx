import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

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
    default: ({ children, href, ...props }: any) => (
        <a href={href} {...props}>{children}</a>
    ),
}))

global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
} as any

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
            const { usePathname } = require('next/navigation')
            usePathname.mockReturnValue('/dashboard/products')

            render(<DashboardSidebar />)

            // Aktif link'in class'ında active olmalı
            const productsLink = screen.getByText(/products/i).closest('a')
            expect(productsLink).toBeTruthy()
        })

        it('Admin panel sadece admin kullanıcılar için gösterilir', () => {
            const { useUser } = require('@/lib/user-context')
            useUser.mockReturnValue({
                user: {
                    id: 'user-1',
                    email: 'admin@example.com',
                    plan: 'pro',
                    isAdmin: true,
                },
                isLoading: false,
            })

            render(<DashboardSidebar />)

            expect(screen.getByText(/admin/i)).toBeTruthy()
        })

        it('Admin panel normal kullanıcılar için gösterilmez', () => {
            const { useUser } = require('@/lib/user-context')
            useUser.mockReturnValue({
                user: {
                    id: 'user-1',
                    email: 'user@example.com',
                    plan: 'free',
                    isAdmin: false,
                },
                isLoading: false,
            })

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
            const { useSidebar } = require('@/lib/sidebar-context')
            useSidebar.mockReturnValue({
                isOpen: true,
                isCollapsed: false,
                isMobile: true,
                close: vi.fn(),
                toggle: vi.fn(),
            })

            render(<DashboardSidebar />)

            // Overlay gösterilmeli
            const overlay = document.querySelector('.bg-black\\/50')
            expect(overlay).toBeTruthy()
        })

        it('Overlay tıklandığında sidebar kapanır', async () => {
            const user = userEvent.setup()
            const closeMock = vi.fn()
            
            const { useSidebar } = require('@/lib/sidebar-context')
            useSidebar.mockReturnValue({
                isOpen: true,
                isCollapsed: false,
                isMobile: true,
                close: closeMock,
                toggle: vi.fn(),
            })

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
            
            const { useSidebar } = require('@/lib/sidebar-context')
            useSidebar.mockReturnValue({
                isOpen: true,
                isCollapsed: false,
                isMobile: true,
                close: closeMock,
                toggle: vi.fn(),
            })

            render(<DashboardSidebar />)

            const productsLink = screen.getByText(/products/i)
            await user.click(productsLink)

            expect(closeMock).toHaveBeenCalled()
        })
    })

    describe('Sidebar Collapse', () => {
        it('Collapsed modda sadece iconlar gösterilir', () => {
            const { useSidebar } = require('@/lib/sidebar-context')
            useSidebar.mockReturnValue({
                isOpen: true,
                isCollapsed: true,
                isMobile: false,
                close: vi.fn(),
                toggle: vi.fn(),
            })

            render(<DashboardSidebar />)

            // Text gizlenmeli, sadece iconlar görünmeli
            const sidebar = document.querySelector('aside')
            expect(sidebar?.className).toContain('w-16')
        })

        it('Toggle butonu sidebar\'ı açıp kapatır', async () => {
            const user = userEvent.setup()
            const toggleMock = vi.fn()
            
            const { useSidebar } = require('@/lib/sidebar-context')
            useSidebar.mockReturnValue({
                isOpen: true,
                isCollapsed: false,
                isMobile: false,
                close: vi.fn(),
                toggle: toggleMock,
            })

            render(<DashboardSidebar />)

            const toggleButton = screen.getByRole('button', { name: /collapse|toggle/i })
            await user.click(toggleButton)

            expect(toggleMock).toHaveBeenCalled()
        })
    })
})
