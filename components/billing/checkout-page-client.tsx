'use client'

import {
    useMemo,
    useState,
    type ChangeEvent,
    type ComponentProps,
    type FocusEvent,
    type FormEvent,
    type ReactNode,
} from 'react'
import Link from 'next/link'
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    Check,
    CreditCard,
    LockKeyhole,
    Loader2,
    LogIn,
    ShieldCheck,
    UserRound,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    saveCheckoutDraft,
    startGarantiPayment,
    type HostedPaymentForm,
} from '@/lib/actions/billing'
import {
    type BillingCycle,
    type PaidPlanId,
    CHECKOUT_PLANS,
    getCheckoutTotals,
} from '@/lib/billing/plans'
import { useTranslation } from '@/lib/contexts/i18n-provider'
import { cn } from '@/lib/utils'

interface CheckoutPageClientProps {
    initialPlan: PaidPlanId
    initialBillingCycle: BillingCycle
    initialCustomer?: {
        fullName: string
        email: string
    }
}

type InvoiceType = 'individual' | 'corporate'
type CheckoutFieldName =
    | 'fullName'
    | 'email'
    | 'phone'
    | 'identityNumber'
    | 'taxNumber'
    | 'companyName'
    | 'taxOffice'
    | 'address'
    | 'city'
    | 'district'

type CheckoutFieldErrors = Partial<Record<CheckoutFieldName, string>>

const EMPTY_CUSTOMER = { fullName: '', email: '' }

function submitHostedPaymentForm(paymentForm: HostedPaymentForm) {
    const action = new URL(paymentForm.action)
    if (action.protocol !== 'https:') {
        throw new Error('Invalid hosted payment URL')
    }

    const forbiddenCardFields = new Set([
        'cardnumber',
        'cardcvv2',
        'cardexpiredatemonth',
        'cardexpiredateyear',
    ])
    if (
        Object.keys(paymentForm.fields).some((field) =>
            forbiddenCardFields.has(field.toLowerCase())
        )
    ) {
        throw new Error('Card fields are not allowed in hosted payment forms')
    }

    const form = document.createElement('form')
    form.method = paymentForm.method
    form.action = action.toString()
    form.style.display = 'none'

    for (const [name, value] of Object.entries(paymentForm.fields)) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = name
        input.value = value
        form.appendChild(input)
    }

    document.body.appendChild(form)
    form.submit()
}

export function CheckoutPageClient({
    initialPlan,
    initialBillingCycle,
    initialCustomer = EMPTY_CUSTOMER,
}: CheckoutPageClientProps) {
    const { t, language } = useTranslation()
    const [planId, setPlanId] = useState<PaidPlanId>(initialPlan)
    const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialBillingCycle)
    const [invoiceType, setInvoiceType] = useState<InvoiceType>('individual')
    const [acceptedDistanceSales, setAcceptedDistanceSales] = useState(false)
    const [acceptedPreliminaryInfo, setAcceptedPreliminaryInfo] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [authRequired, setAuthRequired] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({})

    const totals = useMemo(() => getCheckoutTotals(planId, billingCycle), [planId, billingCycle])
    const plan = CHECKOUT_PLANS[planId]
    const planName =
        planId === 'plus' ? t('checkout.plans.plus.name') : t('checkout.plans.pro.name')
    const canContinue = acceptedDistanceSales && acceptedPreliminaryInfo

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat(language === 'en' ? 'en-US' : 'tr-TR', {
            style: 'currency',
            currency: 'TRY',
            maximumFractionDigits: 2,
        }).format(amount)

    const resetSaveFeedback = () => {
        setSaveError(null)
        setAuthRequired(false)
    }

    const validateFieldValue = (field: CheckoutFieldName, rawValue: string): string | undefined => {
        const value = rawValue.trim()

        switch (field) {
            case 'fullName':
                return value.length >= 2 ? undefined : t('checkout.validation.fullName')
            case 'email':
                return value.length <= 64 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                    ? undefined
                    : t('checkout.validation.email')
            case 'phone': {
                if (!value) return t('checkout.validation.phoneRequired')
                if (!/^[0-9+() .-]+$/.test(value)) {
                    return t('checkout.validation.phoneCharacters')
                }
                const digitCount = value.replace(/\D/g, '').length
                if (digitCount < 10) return t('checkout.validation.phoneTooShort')
                if (digitCount > 15) return t('checkout.validation.phoneTooLong')
                return undefined
            }
            case 'identityNumber':
                return /^\d{11}$/.test(value)
                    ? undefined
                    : t('checkout.validation.identityNumber')
            case 'taxNumber':
                return /^\d{10}$/.test(value)
                    ? undefined
                    : t('checkout.validation.taxNumber')
            case 'companyName':
                return value.length >= 2 ? undefined : t('checkout.validation.companyName')
            case 'taxOffice':
                return value.length >= 2 ? undefined : t('checkout.validation.taxOffice')
            case 'address':
                return value.length >= 10 ? undefined : t('checkout.validation.address')
            case 'city':
                return value.length >= 2 ? undefined : t('checkout.validation.city')
            case 'district':
                return value.length >= 2 ? undefined : t('checkout.validation.district')
        }
    }

    const updateFieldError = (field: CheckoutFieldName, value: string) => {
        const nextError = validateFieldValue(field, value)
        setFieldErrors((current) => {
            if (current[field] === nextError) return current
            const next = { ...current }
            if (nextError) next[field] = nextError
            else delete next[field]
            return next
        })
    }

    const validationProps = (field: CheckoutFieldName) => ({
        error: fieldErrors[field],
        onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            updateFieldError(field, event.currentTarget.value)
        },
        onBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            updateFieldError(field, event.currentTarget.value)
        },
    })

    const changeInvoiceType = (nextType: InvoiceType) => {
        setInvoiceType(nextType)
        setFieldErrors((current) => {
            const next = { ...current }
            delete next.identityNumber
            delete next.taxNumber
            delete next.companyName
            delete next.taxOffice
            return next
        })
        resetSaveFeedback()
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!canContinue || isSaving) return

        const formData = new FormData(event.currentTarget)
        const readValue = (name: string) => String(formData.get(name) ?? '')

        const fieldsToValidate: CheckoutFieldName[] = [
            'fullName',
            'email',
            'phone',
            invoiceType === 'corporate' ? 'taxNumber' : 'identityNumber',
            ...(invoiceType === 'corporate'
                ? (['companyName', 'taxOffice'] as CheckoutFieldName[])
                : []),
            'address',
            'city',
            'district',
        ]
        const nextFieldErrors: CheckoutFieldErrors = {}
        for (const field of fieldsToValidate) {
            const error = validateFieldValue(field, readValue(field))
            if (error) nextFieldErrors[field] = error
        }

        if (Object.keys(nextFieldErrors).length > 0) {
            setFieldErrors(nextFieldErrors)
            resetSaveFeedback()
            const firstInvalidField = fieldsToValidate.find((field) => nextFieldErrors[field])
            if (firstInvalidField) {
                const input = event.currentTarget.elements.namedItem(firstInvalidField)
                if (input instanceof HTMLElement) input.focus()
            }
            return
        }

        setIsSaving(true)
        resetSaveFeedback()

        try {
            const result = await saveCheckoutDraft({
                planId,
                billingCycle,
                invoiceType,
                fullName: readValue('fullName'),
                email: readValue('email'),
                phone: readValue('phone'),
                identityNumber:
                    invoiceType === 'individual' ? readValue('identityNumber') : undefined,
                taxNumber: invoiceType === 'corporate' ? readValue('taxNumber') : undefined,
                companyName: invoiceType === 'corporate' ? readValue('companyName') : undefined,
                taxOffice: invoiceType === 'corporate' ? readValue('taxOffice') : undefined,
                address: readValue('address'),
                city: readValue('city'),
                district: readValue('district'),
                distanceSalesAccepted: true,
                cancellationPolicyAccepted: true,
            })

            if (!result.success && result.code === 'AUTH_REQUIRED') {
                setAuthRequired(true)
                setSaveError(t('checkout.payment.authRequired'))
                return
            }

            if (!result.success) {
                setSaveError(
                    result.code === 'VALIDATION_ERROR'
                        ? t('checkout.payment.validationError')
                        : t('checkout.payment.saveError')
                )
                return
            }

            const paymentResult = await startGarantiPayment(result.draft.id)
            if (paymentResult.success) {
                submitHostedPaymentForm(paymentResult.payment.form)
                return
            }
            if (paymentResult.code === 'AUTH_REQUIRED') {
                setAuthRequired(true)
                setSaveError(t('checkout.payment.authRequired'))
                return
            }
            setSaveError(
                paymentResult.code === 'PAYMENT_UNAVAILABLE'
                    ? t('checkout.payment.unavailable')
                    : t('checkout.payment.startError')
            )
        } catch {
            setSaveError(t('checkout.payment.saveError'))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="min-h-full bg-slate-50 text-slate-950">
            <div className="px-1 py-4 sm:px-2 sm:py-6">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-6 border-b border-slate-200 pb-6">
                        <Link
                            href="/pricing"
                            className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-[#b91c1c]"
                        >
                            <ArrowLeft className="size-4" />
                            {t('checkout.backToPlans')}
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                            {t('checkout.title')}
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                            {t('checkout.subtitle')}
                        </p>
                    </header>

                    <form
                        noValidate
                        onSubmit={handleSubmit}
                        onChange={resetSaveFeedback}
                        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.72fr)]"
                    >
                        <div className="space-y-5">
                            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03]">
                                <SectionHeader
                                    number="1"
                                    title={t('checkout.planSection.title')}
                                    description={t('checkout.planSection.description')}
                                />

                                <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
                                    {(['plus', 'pro'] as const).map((candidatePlanId) => {
                                        const candidate = CHECKOUT_PLANS[candidatePlanId]
                                        const isSelected = planId === candidatePlanId
                                        const candidateName =
                                            candidatePlanId === 'plus'
                                                ? t('checkout.plans.plus.name')
                                                : t('checkout.plans.pro.name')
                                        const candidateDescription =
                                            candidatePlanId === 'plus'
                                                ? t('checkout.plans.plus.description')
                                                : t('checkout.plans.pro.description')

                                        return (
                                            <button
                                                key={candidatePlanId}
                                                type="button"
                                                onClick={() => {
                                                    setPlanId(candidatePlanId)
                                                    resetSaveFeedback()
                                                }}
                                                aria-pressed={isSelected}
                                                className={cn(
                                                    'relative rounded-lg border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:outline-none',
                                                    isSelected
                                                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                                                        : 'border-slate-200 bg-white hover:border-slate-400'
                                                )}
                                            >
                                                {candidatePlanId === 'pro' && (
                                                    <span className="absolute top-4 right-4 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                                                        {t(
                                                            'checkout.planSection.mostComprehensive'
                                                        )}
                                                    </span>
                                                )}
                                                <h3
                                                    className={cn(
                                                        'text-lg font-semibold',
                                                        candidatePlanId === 'pro' && 'pr-24'
                                                    )}
                                                >
                                                    {candidateName}
                                                </h3>
                                                <p
                                                    className="mt-1 max-w-xs text-sm leading-5 text-slate-500"
                                                >
                                                    {candidateDescription}
                                                </p>
                                                <p className="mt-4 text-base font-semibold text-slate-950">
                                                    {formatMoney(candidate.monthlyPrice)} /{' '}
                                                    {t('checkout.month')}
                                                </p>
                                                {isSelected && (
                                                    <span className="absolute right-4 bottom-4 flex size-6 items-center justify-center rounded-full bg-slate-900 text-white">
                                                        <Check className="size-3.5" />
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>

                                <div className="border-t border-slate-100 px-5 py-5 sm:px-6">
                                    <p className="mb-3 text-sm font-semibold text-slate-800">
                                        {t('checkout.planSection.billingPeriod')}
                                    </p>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {(['monthly', 'yearly'] as const).map((cycle) => {
                                            const selected = billingCycle === cycle
                                            const price =
                                                cycle === 'monthly'
                                                    ? plan.monthlyPrice
                                                    : plan.yearlyPrice
                                            return (
                                                <button
                                                    key={cycle}
                                                    type="button"
                                                    onClick={() => {
                                                        setBillingCycle(cycle)
                                                        resetSaveFeedback()
                                                    }}
                                                    aria-pressed={selected}
                                                    className={cn(
                                                        'flex min-h-16 items-center justify-between rounded-lg border px-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:outline-none',
                                                        selected
                                                            ? 'border-[#b91c1c] bg-red-50/60 ring-1 ring-[#b91c1c]'
                                                            : 'border-slate-200 hover:border-slate-400'
                                                    )}
                                                >
                                                    <span>
                                                        <span className="block font-semibold">
                                                            {cycle === 'monthly'
                                                                ? t('checkout.monthly')
                                                                : t('checkout.yearly')}
                                                        </span>
                                                        <span className="mt-1 block text-sm text-slate-500">
                                                            {formatMoney(price)}
                                                        </span>
                                                    </span>
                                                    {cycle === 'yearly' && (
                                                        <span className="text-xs font-medium text-emerald-700">
                                                            {t('checkout.twoMonthsFree')}
                                                        </span>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03]">
                                <SectionHeader
                                    number="2"
                                    title={t('checkout.invoice.title')}
                                    description={t('checkout.invoice.description')}
                                />

                                <div className="p-5 sm:p-6">
                                    <div className="mb-6 grid grid-cols-2 gap-3">
                                        <InvoiceTypeButton
                                            selected={invoiceType === 'individual'}
                                            onClick={() => changeInvoiceType('individual')}
                                            icon={UserRound}
                                            label={t('checkout.invoice.individual')}
                                        />
                                        <InvoiceTypeButton
                                            selected={invoiceType === 'corporate'}
                                            onClick={() => changeInvoiceType('corporate')}
                                            icon={Building2}
                                            label={t('checkout.invoice.corporate')}
                                        />
                                    </div>

                                    {(initialCustomer.fullName || initialCustomer.email) && (
                                        <p className="mb-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
                                            {t('checkout.invoice.accountPrefill')}
                                        </p>
                                    )}

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <CheckoutField
                                            id="full-name"
                                            name="fullName"
                                            label={t('checkout.invoice.fullName')}
                                            autoComplete="name"
                                            defaultValue={initialCustomer.fullName}
                                            maxLength={120}
                                            required
                                            {...validationProps('fullName')}
                                        />
                                        <CheckoutField
                                            id="email"
                                            name="email"
                                            label={t('checkout.invoice.email')}
                                            type="email"
                                            autoComplete="email"
                                            defaultValue={initialCustomer.email}
                                            maxLength={64}
                                            required
                                            {...validationProps('email')}
                                        />
                                        <CheckoutField
                                            id="phone"
                                            name="phone"
                                            label={t('checkout.invoice.phone')}
                                            type="tel"
                                            autoComplete="tel"
                                            inputMode="tel"
                                            maxLength={20}
                                            placeholder="05xx xxx xx xx"
                                            required
                                            {...validationProps('phone')}
                                        />
                                        <CheckoutField
                                            key={invoiceType}
                                            id="identity-number"
                                            name={
                                                invoiceType === 'corporate'
                                                    ? 'taxNumber'
                                                    : 'identityNumber'
                                            }
                                            label={
                                                invoiceType === 'corporate'
                                                    ? t('checkout.invoice.taxNumber')
                                                    : t('checkout.invoice.identityNumber')
                                            }
                                            inputMode="numeric"
                                            pattern={
                                                invoiceType === 'corporate'
                                                    ? '[0-9]{10}'
                                                    : '[0-9]{11}'
                                            }
                                            maxLength={invoiceType === 'corporate' ? 10 : 11}
                                            required
                                            {...validationProps(
                                                invoiceType === 'corporate'
                                                    ? 'taxNumber'
                                                    : 'identityNumber'
                                            )}
                                        />
                                        {invoiceType === 'corporate' && (
                                            <>
                                                <CheckoutField
                                                    id="company-name"
                                                    name="companyName"
                                                    label={t('checkout.invoice.companyName')}
                                                    autoComplete="organization"
                                                    maxLength={200}
                                                    required
                                                    {...validationProps('companyName')}
                                                />
                                                <CheckoutField
                                                    id="tax-office"
                                                    name="taxOffice"
                                                    label={t('checkout.invoice.taxOffice')}
                                                    maxLength={120}
                                                    required
                                                    {...validationProps('taxOffice')}
                                                />
                                            </>
                                        )}
                                        <div className="sm:col-span-2">
                                            <CheckoutTextarea
                                                id="address"
                                                name="address"
                                                label={
                                                    invoiceType === 'corporate'
                                                        ? t('checkout.invoice.addressCorporate')
                                                        : t('checkout.invoice.addressIndividual')
                                                }
                                                hint={
                                                    invoiceType === 'corporate'
                                                        ? t('checkout.invoice.addressCorporateHint')
                                                        : t('checkout.invoice.addressIndividualHint')
                                                }
                                                autoComplete="street-address"
                                                maxLength={500}
                                                rows={3}
                                                required
                                                {...validationProps('address')}
                                            />
                                        </div>
                                        <CheckoutField
                                            id="city"
                                            name="city"
                                            label={t('checkout.invoice.city')}
                                            autoComplete="address-level1"
                                            maxLength={100}
                                            required
                                            {...validationProps('city')}
                                        />
                                        <CheckoutField
                                            id="district"
                                            name="district"
                                            label={t('checkout.invoice.district')}
                                            autoComplete="address-level2"
                                            maxLength={100}
                                            required
                                            {...validationProps('district')}
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03]">
                                <SectionHeader
                                    number="3"
                                    title={t('checkout.payment.title')}
                                    description={t('checkout.payment.description')}
                                />

                                <div className="p-5 sm:p-6">
                                    <div className="flex items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
                                            <CreditCard className="size-5" />
                                        </span>
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900">
                                                {t('checkout.payment.card')}
                                            </h3>
                                            <p className="mt-1 text-sm leading-6 text-slate-600">
                                                {t('checkout.payment.bankEntryNotice')}
                                            </p>
                                            <p className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">
                                                <ShieldCheck className="size-4 text-emerald-700" />
                                                {t('checkout.payment.noCardStorage')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <aside className="space-y-4 lg:sticky lg:top-6">
                            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.04]">
                                <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                                    <h2 className="text-base font-semibold text-slate-950">
                                        {t('checkout.summary.title')}
                                    </h2>
                                </div>

                                <div className="p-5 sm:p-6">
                                    <dl className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between gap-4">
                                            <dt className="text-slate-500">
                                                {t('checkout.result.plan')}
                                            </dt>
                                            <dd className="font-medium text-slate-900">{planName}</dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <dt className="text-slate-500">
                                                {t('checkout.summary.period')}
                                            </dt>
                                            <dd className="font-medium text-slate-900">
                                                {billingCycle === 'monthly'
                                                    ? t('checkout.monthly')
                                                    : t('checkout.yearly')}
                                            </dd>
                                        </div>
                                        <div className="mt-5 flex items-end justify-between gap-4 border-t border-slate-200 pt-5">
                                            <dt className="font-medium text-slate-700">
                                                {t('checkout.summary.total')}
                                            </dt>
                                            <dd className="text-2xl font-bold tracking-tight text-slate-950">
                                                {formatMoney(totals.total)}
                                            </dd>
                                        </div>
                                    </dl>

                                    <div className="space-y-4 pt-5">
                                        <AgreementCheckbox
                                            id="distance-sales"
                                            checked={acceptedDistanceSales}
                                            onCheckedChange={setAcceptedDistanceSales}
                                        >
                                            <Link
                                                href="/legal/distance-sales-agreement"
                                                target="_blank"
                                                className="font-medium text-slate-900 underline underline-offset-2"
                                            >
                                                {t('checkout.agreements.distanceSales')}
                                            </Link>{' '}
                                            {t('checkout.agreements.acceptSuffix')}
                                        </AgreementCheckbox>

                                        <AgreementCheckbox
                                            id="preliminary-info"
                                            checked={acceptedPreliminaryInfo}
                                            onCheckedChange={setAcceptedPreliminaryInfo}
                                        >
                                            <Link
                                                href="/legal/cancellation-policy"
                                                target="_blank"
                                                className="font-medium text-slate-900 underline underline-offset-2"
                                            >
                                                {t('checkout.agreements.cancellation')}
                                            </Link>{' '}
                                            {t('checkout.agreements.readSuffix')}
                                        </AgreementCheckbox>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={!canContinue || isSaving}
                                        className="mt-6 h-12 w-full rounded-lg bg-[#b91c1c] text-sm font-semibold text-white shadow-none hover:bg-[#991b1b]"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <LockKeyhole className="size-4" />
                                        )}
                                        {isSaving
                                            ? t('checkout.payment.saving')
                                            : t('checkout.payment.continue')}
                                    </Button>
                                </div>
                            </section>

                            {saveError && (
                                <div
                                    role="alert"
                                    className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-950"
                                >
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="mt-0.5 size-5 shrink-0" />
                                        <div>
                                            <p className="font-semibold">{saveError}</p>
                                            {authRequired && (
                                                <Link
                                                    href="/auth"
                                                    className="mt-3 inline-flex items-center gap-2 font-semibold underline underline-offset-4"
                                                >
                                                    <LogIn className="size-4" />
                                                    {t('checkout.payment.signIn')}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </aside>
                    </form>
                </div>
            </div>
        </div>
    )
}

function SectionHeader({
    number,
    title,
    description,
}: {
    number: string
    title: string
    description: string
}) {
    return (
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
            <span className="pt-1 text-xs font-semibold tracking-wider text-[#b91c1c]">
                0{number}
            </span>
            <div>
                <h2 className="text-base font-semibold text-slate-950 sm:text-lg">{title}</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
            </div>
        </div>
    )
}

function InvoiceTypeButton({
    selected,
    onClick,
    icon: Icon,
    label,
}: {
    selected: boolean
    onClick: () => void
    icon: typeof UserRound
    label: string
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={cn(
                'flex min-h-12 items-center gap-3 rounded-lg border px-4 text-left text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:outline-none',
                selected
                    ? 'border-[#b91c1c] bg-red-50/60 text-slate-950 ring-1 ring-[#b91c1c]'
                    : 'border-slate-200 hover:border-slate-400'
            )}
        >
            <Icon className="size-5" />
            {label}
        </button>
    )
}

interface CheckoutFieldProps extends ComponentProps<typeof Input> {
    id: string
    label: string
    error?: string
    hint?: string
}

function CheckoutField({ id, label, error, hint, className, ...props }: CheckoutFieldProps) {
    const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
        .filter(Boolean)
        .join(' ')

    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-sm font-medium text-slate-700">
                {label}
            </Label>
            <Input
                id={id}
                className={cn(
                    'h-11 rounded-lg border-slate-300 bg-white px-3.5 shadow-none focus-visible:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-900/10 aria-invalid:border-red-500',
                    className
                )}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy || undefined}
                {...props}
            />
            {hint && (
                <p id={`${id}-hint`} className="text-xs leading-5 text-slate-500">
                    {hint}
                </p>
            )}
            {error && (
                <p id={`${id}-error`} className="text-xs font-semibold text-red-700" aria-live="polite">
                    {error}
                </p>
            )}
        </div>
    )
}

interface CheckoutTextareaProps extends ComponentProps<typeof Textarea> {
    id: string
    label: string
    error?: string
    hint?: string
}

function CheckoutTextarea({
    id,
    label,
    error,
    hint,
    className,
    ...props
}: CheckoutTextareaProps) {
    const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
        .filter(Boolean)
        .join(' ')

    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-sm font-medium text-slate-700">
                {label}
            </Label>
            <Textarea
                id={id}
                className={cn(
                    'min-h-24 resize-y rounded-lg border-slate-300 bg-white px-3.5 py-3 shadow-none focus-visible:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-900/10 aria-invalid:border-red-500',
                    className
                )}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy || undefined}
                {...props}
            />
            {hint && (
                <p id={`${id}-hint`} className="text-xs leading-5 text-slate-500">
                    {hint}
                </p>
            )}
            {error && (
                <p id={`${id}-error`} className="text-xs font-semibold text-red-700" aria-live="polite">
                    {error}
                </p>
            )}
        </div>
    )
}

interface AgreementCheckboxProps {
    id: string
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    children: ReactNode
}

function AgreementCheckbox({ id, checked, onCheckedChange, children }: AgreementCheckboxProps) {
    return (
        <div className="flex items-start gap-3">
            <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(value) => onCheckedChange(value === true)}
                className="mt-0.5 size-5 rounded-[4px]"
            />
            <Label
                htmlFor={id}
                className="cursor-pointer text-xs leading-5 font-normal text-slate-600"
            >
                {children}
            </Label>
        </div>
    )
}
