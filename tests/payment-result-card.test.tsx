import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
    PaymentResultCard,
    PaymentResultUnavailable,
} from '@/components/billing/payment-result-card'
import { I18nProvider } from '@/lib/contexts/i18n-provider'

Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
    },
})

const basePayment = {
    orderId: '2ef97f5c-c172-4c88-aa03-14087c36ec34',
    planId: 'pro' as const,
    billingCycle: 'yearly' as const,
    total: 10000,
    currency: 'TRY',
    paidAt: null,
    updatedAt: '2026-08-13T12:00:00.000Z',
}

function renderResult(status: 'payment_pending' | 'paid' | 'payment_failed') {
    render(
        <I18nProvider>
            <PaymentResultCard payment={{ ...basePayment, status }} />
        </I18nProvider>
    )
}

describe('payment result card', () => {
    it('shows the plan as active only when the server order is paid', () => {
        renderResult('paid')

        expect(screen.getByRole('heading', { name: 'Ödeme başarılı' })).toBeInTheDocument()
        expect(screen.getByText('Pro paketiniz aktif edildi.')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Panele git' })).toHaveAttribute(
            'href',
            '/dashboard'
        )
    })

    it('keeps ambiguous callbacks pending and offers a status refresh', () => {
        renderResult('payment_pending')

        expect(screen.getByRole('heading', { name: 'Ödeme kontrol ediliyor' })).toBeInTheDocument()
        expect(screen.getByText(/Bankadan kesin sonuç henüz alınmadı/)).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Durumu yenile' })).toHaveAttribute(
            'href',
            `/checkout/result?order=${basePayment.orderId}`
        )
    })

    it('offers a safe retry after a verified decline', () => {
        renderResult('payment_failed')

        expect(screen.getByRole('heading', { name: 'Ödeme tamamlanamadı' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Tekrar dene' })).toHaveAttribute(
            'href',
            '/checkout?plan=pro&billing=yearly'
        )
    })

    it('offers sign-in instead of guessing a payment result when the order is unavailable', () => {
        render(
            <I18nProvider>
                <PaymentResultUnavailable />
            </I18nProvider>
        )

        expect(
            screen.getByRole('heading', { name: 'Ödeme durumu görüntülenemiyor' })
        ).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Giriş yap' })).toHaveAttribute('href', '/auth')
    })
})
