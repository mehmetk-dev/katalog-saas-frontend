import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CheckoutPageClient } from '@/components/billing/checkout-page-client'
import { UpgradeModal } from '@/components/builder/modals/upgrade-modal'
import { saveCheckoutDraft, startGarantiPayment } from '@/lib/actions/billing'
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

vi.mock('@/lib/actions/billing', () => ({
    saveCheckoutDraft: vi.fn(),
    startGarantiPayment: vi.fn(),
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
    const submitSpy = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})

    beforeEach(() => {
        vi.mocked(saveCheckoutDraft).mockReset()
        vi.mocked(startGarantiPayment).mockReset()
        submitSpy.mockClear()
        vi.mocked(saveCheckoutDraft).mockResolvedValue({
            success: true,
            draft: {
                id: 'draft-1',
                status: 'draft',
                createdAt: '2026-08-04T11:00:00.000Z',
                updatedAt: '2026-08-04T11:00:00.000Z',
            },
        })
        vi.mocked(startGarantiPayment).mockResolvedValue({
            success: true,
            payment: {
                orderId: 'draft-1',
                status: 'payment_pending',
                form: {
                    action: 'https://sanalposprovtest.garantibbva.com.tr/servlet/gt3dengine',
                    method: 'POST',
                    fields: {
                        orderid: 'GARANTIORDER1',
                        secure3dhash: 'SIGNED_VALUE',
                    },
                },
            },
        })
    })

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

    it('saves the order and posts a card-free form to the bank after agreement approval', async () => {
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

        expect(saveCheckoutDraft).toHaveBeenCalledWith({
            planId: 'pro',
            billingCycle: 'yearly',
            invoiceType: 'individual',
            fullName: 'Test Kullanıcı',
            email: 'test@example.com',
            phone: '05555555555',
            identityNumber: '11111111111',
            taxNumber: undefined,
            companyName: undefined,
            taxOffice: undefined,
            address: 'Test Mahallesi No: 1',
            city: 'Bursa',
            district: 'Nilüfer',
            distanceSalesAccepted: true,
            cancellationPolicyAccepted: true,
        })
        await waitFor(() => expect(startGarantiPayment).toHaveBeenCalledWith('draft-1'))
        expect(submitSpy).toHaveBeenCalledTimes(1)

        const bankForm = document.querySelector<HTMLFormElement>(
            'form[action="https://sanalposprovtest.garantibbva.com.tr/servlet/gt3dengine"]'
        )
        expect(bankForm).not.toBeNull()
        expect(bankForm?.querySelector('[name="orderid"]')).toHaveAttribute(
            'value',
            'GARANTIORDER1'
        )
        expect(bankForm?.querySelector('[name="cardnumber"]')).toBeNull()
        expect(bankForm?.querySelector('[name="cardcvv2"]')).toBeNull()
    })

    it('keeps the user on checkout when the bank connection is not configured', async () => {
        vi.mocked(startGarantiPayment).mockResolvedValueOnce({
            success: false,
            code: 'PAYMENT_UNAVAILABLE',
        })
        renderWithTranslations(
            <CheckoutPageClient initialPlan="plus" initialBillingCycle="monthly" />
        )

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
        fireEvent.click(screen.getByRole('button', { name: 'Güvenli ödemeye geç' }))

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Banka ödeme bağlantısı şu anda kullanılamıyor'
        )
        expect(submitSpy).not.toHaveBeenCalled()
    })

    it('asks anonymous customers to sign in without showing a saved state', async () => {
        vi.mocked(saveCheckoutDraft).mockResolvedValueOnce({
            success: false,
            code: 'AUTH_REQUIRED',
        })
        renderWithTranslations(
            <CheckoutPageClient initialPlan="plus" initialBillingCycle="monthly" />
        )

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
        fireEvent.click(screen.getByRole('button', { name: 'Güvenli ödemeye geç' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('hesabınıza giriş yapmalısınız')
        expect(screen.getByRole('link', { name: 'Giriş yap' })).toHaveAttribute('href', '/auth')
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('sends paid plan selections to checkout instead of showing a contact toast', () => {
        renderWithTranslations(<UpgradeModal open onOpenChange={vi.fn()} />)

        expect(
            screen.getAllByRole('link', { name: 'Seç' }).map((link) => link.getAttribute('href'))
        ).toEqual(['/checkout?plan=plus&billing=yearly', '/checkout?plan=pro&billing=yearly'])

        fireEvent.click(screen.getByRole('button', { name: 'Aylık' }))
        expect(
            screen.getAllByRole('link', { name: 'Seç' }).map((link) => link.getAttribute('href'))
        ).toEqual(['/checkout?plan=plus&billing=monthly', '/checkout?plan=pro&billing=monthly'])

        fireEvent.click(screen.getByRole('button', { name: /Yıllık/ }))
        expect(
            screen.getAllByRole('link', { name: 'Seç' }).map((link) => link.getAttribute('href'))
        ).toEqual(['/checkout?plan=plus&billing=yearly', '/checkout?plan=pro&billing=yearly'])
        expect(
            screen.queryByText('Plan yükseltme için lütfen bizimle iletişime geçin.')
        ).not.toBeInTheDocument()
    })
})
