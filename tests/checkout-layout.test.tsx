import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import CheckoutLayout from '@/app/checkout/layout'

vi.mock('@/components/dashboard/dashboard-app-shell', () => ({
    DashboardAppShell: ({ children }: { children: ReactNode }) => (
        <div data-testid="dashboard-app-shell">{children}</div>
    ),
}))

describe('checkout layout', () => {
    it('keeps checkout and bank result routes inside the dashboard shell', () => {
        render(
            <CheckoutLayout>
                <p>Ödeme içeriği</p>
            </CheckoutLayout>
        )

        expect(screen.getByTestId('dashboard-app-shell')).toContainElement(
            screen.getByText('Ödeme içeriği')
        )
    })
})
