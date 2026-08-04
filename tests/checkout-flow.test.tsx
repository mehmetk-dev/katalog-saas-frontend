import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { CheckoutPageClient } from '@/components/billing/checkout-page-client'
import { UpgradeModal } from '@/components/builder/modals/upgrade-modal'
import { I18nProvider } from '@/lib/contexts/i18n-provider'
import {
    buildCheckoutHref,
    getCheckoutTotals,
    normalizeBillingCycle,
    normalizePaidPlan,
} from '@/lib/billing/plans'

vi.mock('@/lib/contexts/user-context', () => ({
    useUser: () => ({ user: { plan: 'free' } }),
}))

vi.mock('@/components/layout/public-header', () => ({
    PublicHeader: () => <div data-testid="public-header" />,
}))

vi.mock('@/components/layout/public-footer', () => ({
    PublicFooter: () => <div data-testid="public-footer" />,
}))

const storage = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
        clear: () => storage.clear(),
    },
})

class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    value: ResizeObserverMock,
})

function renderWithTranslations(node: ReactNode) {
    return render(<I18nProvider>{node}</I18nProvider>)
}

describe('checkout flow', () => {
    it('builds and normalizes checkout routes safely', () => {
        expect(buildCheckoutHref('plus', 'monthly')).toBe('/checkout?plan=plus&billing=monthly')
        expect(normalizePaidPlan('plus')).toBe('plus')
        expect(normalizePaidPlan('unexpected')).toBe('pro')
        expect(normalizeBillingCycle('monthly')).toBe('monthly')
        expect(normalizeBillingCycle('unexpected')).toBe('yearly')
    })

    it('treats listed prices as VAT-inclusive and splits the total correctly', () => {
        expect(getCheckoutTotals('pro', 'yearly')).toEqual({
            subtotal: 8333.33,
            vat: 1666.67,
            total: 10000,
            monthlyEquivalent: 833.33,
            savings: 2000,
        })

        expect(getCheckoutTotals('plus', 'monthly')).toEqual({
            subtotal: 416.67,
            vat: 83.33,
            total: 500,
            monthlyEquivalent: 500,
            savings: 0,
        })
    })

    it('shows the selected order and only enables payment after agreement approval', () => {
        renderWithTranslations(
            <CheckoutPageClient initialPlan="pro" initialBillingCycle="yearly" />
        )

        expect(screen.getByRole('heading', { name: 'Güvenli Ödeme' })).toBeInTheDocument()
        expect(screen.getByText('Ödenecek tutar').parentElement).toHaveTextContent('₺10.000,00')
        expect(screen.queryByText('Ara toplam')).not.toBeInTheDocument()
        expect(screen.queryByText('KDV (%20)')).not.toBeInTheDocument()

        const continueButton = screen.getByRole('button', { name: 'Güvenli ödemeye geç' })
        expect(continueButton).toBeDisabled()

        fireEvent.change(screen.getByLabelText('Ad soyad'), { target: { value: 'Test Kullanıcı' } })
        fireEvent.change(screen.getByLabelText('E-posta adresi'), {
            target: { value: 'test@example.com' },
        })
        fireEvent.change(screen.getByLabelText('Telefon numarası'), {
            target: { value: '05555555555' },
        })
        fireEvent.change(screen.getByLabelText('T.C. kimlik numarası'), {
            target: { value: '11111111111' },
        })
        fireEvent.change(screen.getByLabelText('Fatura adresi'), {
            target: { value: 'Test Mahallesi No: 1' },
        })
        fireEvent.change(screen.getByLabelText('İl'), { target: { value: 'Bursa' } })
        fireEvent.change(screen.getByLabelText('İlçe'), { target: { value: 'Nilüfer' } })
        fireEvent.click(screen.getByLabelText(/Mesafeli Satış Sözleşmesi/))
        fireEvent.click(screen.getByLabelText(/İptal ve İade Koşulları/))

        expect(continueButton).toBeEnabled()
        fireEvent.click(continueButton)

        expect(screen.getByRole('status')).toHaveTextContent('Ödeme adımı hazır')
        expect(screen.getByRole('status')).toHaveTextContent(
            'Şu anda kartınızdan tahsilat yapılmadı'
        )
    })

    it('sends paid plan selections to checkout instead of showing a contact toast', () => {
        renderWithTranslations(<UpgradeModal open onOpenChange={vi.fn()} />)

        const checkoutLinks = screen.getAllByRole('link', { name: 'Seç' })
        expect(checkoutLinks.map((link) => link.getAttribute('href'))).toEqual([
            '/checkout?plan=plus&billing=yearly',
            '/checkout?plan=pro&billing=yearly',
        ])
        expect(
            screen.queryByText('Plan yükseltme için lütfen bizimle iletişime geçin.')
        ).not.toBeInTheDocument()
    })
})
