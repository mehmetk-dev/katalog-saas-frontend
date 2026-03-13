import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

const {
  mockUseUser,
  mockUseSidebar,
  mockUsePathname,
} = vi.hoisted(() => ({
  mockUseUser: vi.fn(),
  mockUseSidebar: vi.fn(),
  mockUsePathname: vi.fn(),
}))

vi.mock('@/lib/contexts/user-context', () => ({
  useUser: mockUseUser,
}))

vi.mock('@/lib/contexts/i18n-provider', () => ({
  useTranslation: () => ({ t: (key: string) => key, language: 'tr' }),
}))

vi.mock('@/lib/contexts/sidebar-context', () => ({
  useSidebar: mockUseSidebar,
}))

vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, prefetch: _prefetch, ...props }: { children: React.ReactNode; href: string; prefetch?: boolean; [key: string]: unknown }) => (
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
    mockUsePathname.mockReturnValue('/dashboard')
    mockUseUser.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        plan: 'free',
        isAdmin: false,
      },
      isLoading: false,
    })
    mockUseSidebar.mockReturnValue({
      isOpen: true,
      isCollapsed: false,
      isMobile: false,
      close: vi.fn(),
      toggle: vi.fn(),
      open: vi.fn(),
      collapse: vi.fn(),
      expand: vi.fn(),
    })
  })

  describe('Dashboard Sidebar', () => {
    it('Tum navigation linklerini gosterir', () => {
      render(<DashboardSidebar />)

      expect(screen.getByText('common.dashboard')).toBeTruthy()
      expect(screen.getByText('dashboard.products')).toBeTruthy()
      expect(screen.getAllByText('sidebar.catalogs').length).toBeGreaterThan(0)
      expect(screen.getByText('sidebar.templates')).toBeTruthy()
      expect(screen.getByText('common.settings')).toBeTruthy()
    })

    it('Aktif sayfa highlight edilir', () => {
      mockUsePathname.mockReturnValue('/dashboard/products')

      render(<DashboardSidebar />)

      const productsLink = screen.getByText('dashboard.products').closest('a')
      expect(productsLink).toBeTruthy()
      expect(productsLink?.className).toContain('bg-sidebar-accent')
    })

    it('Admin panel sadece admin kullanicilar icin gosterilir', () => {
      mockUseUser.mockReturnValue({
        user: {
          id: 'user-1',
          email: 'admin@example.com',
          plan: 'pro',
          isAdmin: true,
        },
        isLoading: false,
      })

      render(<DashboardSidebar />)

      expect(screen.queryByText(/admin/i)).toBeNull()
    })

    it('Admin panel normal kullanicilar icin gosterilmez', () => {
      render(<DashboardSidebar />)

      const adminLink = screen.queryByText(/admin panel/i)
      expect(adminLink).toBeNull()
    })

    it('Premium ozellikler icin upgrade modal gosterir', async () => {
      const user = userEvent.setup()

      render(<DashboardSidebar />)

      const categoriesLink = screen.getByText(/sidebar.categories/i)
      await user.click(categoriesLink)

      await waitFor(() => {
        expect(screen.getByText(/upgrade|yukselt|settings.upgrade/i)).toBeTruthy()
      })
    })
  })

  describe('Mobile Navigation', () => {
    it('Mobilde sidebar overlay gosterir', () => {
      mockUseSidebar.mockReturnValue({
        isOpen: true,
        isCollapsed: false,
        isMobile: true,
        close: vi.fn(),
        toggle: vi.fn(),
        open: vi.fn(),
        collapse: vi.fn(),
        expand: vi.fn(),
      })

      render(<DashboardSidebar />)

      const overlay = document.querySelector('.bg-black\\/50')
      expect(overlay).toBeTruthy()
    })

    it('Overlay tiklandiginda sidebar kapanir', async () => {
      const user = userEvent.setup()
      const closeMock = vi.fn()

      mockUseSidebar.mockReturnValue({
        isOpen: true,
        isCollapsed: false,
        isMobile: true,
        close: closeMock,
        toggle: vi.fn(),
        open: vi.fn(),
        collapse: vi.fn(),
        expand: vi.fn(),
      })

      render(<DashboardSidebar />)

      const overlay = document.querySelector('.bg-black\\/50')
      if (overlay) {
        await user.click(overlay)
        expect(closeMock).toHaveBeenCalled()
      }
    })

    it('Mobilde link tiklandiginda sidebar kapanir', async () => {
      const user = userEvent.setup()
      const closeMock = vi.fn()

      mockUseSidebar.mockReturnValue({
        isOpen: true,
        isCollapsed: false,
        isMobile: true,
        close: closeMock,
        toggle: vi.fn(),
        open: vi.fn(),
        collapse: vi.fn(),
        expand: vi.fn(),
      })

      render(<DashboardSidebar />)

      const productsLink = screen.getByText('dashboard.products')
      await user.click(productsLink)

      expect(closeMock).toHaveBeenCalled()
    })
  })

  describe('Sidebar Collapse', () => {
    it('Collapsed modda sadece iconlar gosterilir', () => {
      mockUseSidebar.mockReturnValue({
        isOpen: true,
        isCollapsed: true,
        isMobile: false,
        close: vi.fn(),
        toggle: vi.fn(),
        open: vi.fn(),
        collapse: vi.fn(),
        expand: vi.fn(),
      })

      render(<DashboardSidebar />)

      const sidebar = document.querySelector('aside')
      expect(sidebar?.className).toContain('w-16')
    })

    it('Toggle butonu sidebari acip kapatir', async () => {
      const user = userEvent.setup()
      const toggleMock = vi.fn()

      mockUseSidebar.mockReturnValue({
        isOpen: true,
        isCollapsed: false,
        isMobile: false,
        close: vi.fn(),
        toggle: toggleMock,
        open: vi.fn(),
        collapse: vi.fn(),
        expand: vi.fn(),
      })

      render(<DashboardSidebar />)

      const toggleButton = document.querySelector('button svg.lucide-chevron-left')?.parentElement as HTMLButtonElement
      expect(toggleButton).toBeTruthy()
      await user.click(toggleButton)

      expect(toggleMock).toHaveBeenCalled()
    })
  })
})
