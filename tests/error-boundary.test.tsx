import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from '@/components/error-boundary'

// Mock dependencies
vi.mock('@/lib/contexts/i18n-provider', () => ({
    useTranslation: () => ({ t: (key: string) => key, language: 'tr' }),
}))

// Component that throws error
function ThrowError({ shouldThrow = false }: { shouldThrow?: boolean }) {
    if (shouldThrow) {
        throw new Error('Test error')
    }
    return <div>No error</div>
}

describe('Error Boundary Testleri', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Suppress console.error for expected errors
        vi.spyOn(console, 'error').mockImplementation(() => { })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('Hata olmadığında children render eder', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        )

        expect(screen.getByText('No error')).toBeTruthy()
    })

    it('Hata olduğunda error UI gösterir', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        // Error title veya description'ı kontrol et
        const errorElement = screen.getByText(/something went wrong|went wrong|hata/i)
        expect(errorElement).toBeTruthy()
    })

    it('Reload butonu çalışır', async () => {
        const user = userEvent.setup()

        // window.location.reload mock
        const reloadMock = vi.fn()
        delete (window as { location?: Location }).location
            ; (window as { location: { reload: () => void } }).location = { reload: reloadMock }

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        const reloadButton = screen.getByText(/reload|yenile/i)
        await user.click(reloadButton)

        expect(reloadMock).toHaveBeenCalled()
    })

    it('Go Home butonu çalışır', async () => {
        const user = userEvent.setup()

        // window.location.href mock
        delete (window as { location?: Location }).location
            ; (window as { location: { href: string } }).location = { href: '' }

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        const homeButton = screen.getByText(/home|ana/i)
        await user.click(homeButton)

        expect(window.location.href).toBe('/')
    })

    it('Custom fallback gösterir', () => {
        const customFallback = <div>Custom Error Message</div>

        render(
            <ErrorBoundary fallback={customFallback}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        expect(screen.getByText('Custom Error Message')).toBeTruthy()
    })

    it('Development modunda error detayları gösterir', () => {
        const originalEnv = process.env.NODE_ENV
            ; (process.env as { NODE_ENV?: string }).NODE_ENV = 'development'

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        // Development modunda error message gösterilmeli
        expect(screen.getByText(/Test error/i)).toBeTruthy()

            ; (process.env as { NODE_ENV?: string }).NODE_ENV = originalEnv
    })

    it('Production modunda error detayları gizlenir', () => {
        const originalEnv = process.env.NODE_ENV
            ; (process.env as { NODE_ENV?: string }).NODE_ENV = 'production'

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        // Production modunda error message gösterilmemeli
        const errorMessage = screen.queryByText(/Test error/i)
        expect(errorMessage).toBeNull()

            ; (process.env as { NODE_ENV?: string }).NODE_ENV = originalEnv
    })
})
