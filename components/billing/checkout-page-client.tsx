'use client'

import { useMemo, useState, type ComponentProps, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import {
    AlertCircle,
    ArrowLeft,
    BadgeCheck,
    Building2,
    Check,
    CheckCircle2,
    CreditCard,
    FileText,
    LockKeyhole,
    Loader2,
    LogIn,
    ShieldCheck,
    Sparkles,
    UserRound,
} from 'lucide-react'

import { PublicFooter } from '@/components/layout/public-footer'
import { PublicHeader } from '@/components/layout/public-header'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
}

type InvoiceType = 'individual' | 'corporate'

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

export function CheckoutPageClient({ initialPlan, initialBillingCycle }: CheckoutPageClientProps) {
    const { t, language } = useTranslation()
    const [planId, setPlanId] = useState<PaidPlanId>(initialPlan)
    const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialBillingCycle)
    const [invoiceType, setInvoiceType] = useState<InvoiceType>('individual')
    const [acceptedDistanceSales, setAcceptedDistanceSales] = useState(false)
    const [acceptedPreliminaryInfo, setAcceptedPreliminaryInfo] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [authRequired, setAuthRequired] = useState(false)

    const totals = useMemo(() => getCheckoutTotals(planId, billingCycle), [planId, billingCycle])
    const plan = CHECKOUT_PLANS[planId]
    const planName =
        planId === 'plus' ? t('checkout.plans.plus.name') : t('checkout.plans.pro.name')
    const planDescription =
        planId === 'plus'
            ? t('checkout.plans.plus.description')
            : t('checkout.plans.pro.description')
    const planFeatures = t<string[]>(`checkout.plans.${planId}.features`)
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

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!canContinue || isSaving) return

        const formData = new FormData(event.currentTarget)
        const readValue = (name: string) => String(formData.get(name) ?? '')

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
        <div className="min-h-screen bg-[#f6f7f9] text-slate-950">
            <PublicHeader />

            <main className="px-4 pt-24 pb-20 sm:px-6 sm:pt-28">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8 flex flex-col gap-6 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="-mx-4 bg-slate-950 px-4 py-6 text-white sm:mx-0 sm:bg-transparent sm:p-0 sm:text-slate-950">
                            <Link
                                href="/pricing"
                                className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-300 transition-colors hover:text-white sm:text-slate-500 sm:hover:text-[#cf1414]"
                            >
                                <ArrowLeft className="size-4" />
                                {t('checkout.backToPlans')}
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="flex size-11 items-center justify-center rounded-xl bg-white text-slate-950 shadow-lg shadow-black/20 sm:bg-slate-950 sm:text-white sm:shadow-slate-900/10">
                                    <LockKeyhole className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-black tracking-[0.2em] text-[#cf1414] uppercase">
                                        FogCatalog Checkout
                                    </p>
                                    <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl sm:text-slate-950">
                                        {t('checkout.title')}
                                    </h1>
                                </div>
                            </div>
                            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:text-slate-500">
                                {t('checkout.subtitle')}
                            </p>
                        </div>

                        <ol className="grid grid-cols-3 gap-2 text-xs sm:min-w-[430px]">
                            {[
                                t('checkout.steps.plan'),
                                t('checkout.steps.payment'),
                                t('checkout.steps.confirmation'),
                            ].map((step, index) => (
                                <li
                                    key={step}
                                    className={cn(
                                        'flex min-h-14 items-center gap-2 border px-3 font-bold',
                                        index === 0 &&
                                            'border-emerald-200 bg-emerald-50 text-emerald-800',
                                        index === 1 && 'border-slate-950 bg-slate-950 text-white',
                                        index === 2 && 'border-slate-200 bg-white text-slate-400'
                                    )}
                                >
                                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-current text-[10px]">
                                        {index === 0 ? <Check className="size-3.5" /> : index + 1}
                                    </span>
                                    <span className="hidden sm:inline">{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        onChange={resetSaveFeedback}
                        className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.8fr)]"
                    >
                        <div className="space-y-6">
                            <section className="border border-slate-200 bg-white shadow-sm">
                                <SectionHeader
                                    number="1"
                                    title={t('checkout.planSection.title')}
                                    description={t('checkout.planSection.description')}
                                />

                                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
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
                                                    'relative min-h-36 border p-5 text-left transition-all focus-visible:ring-4 focus-visible:ring-slate-900/15 focus-visible:outline-none',
                                                    isSelected
                                                        ? 'border-slate-950 bg-slate-950 text-white shadow-xl shadow-slate-900/10'
                                                        : 'border-slate-200 bg-white hover:border-slate-400'
                                                )}
                                            >
                                                {candidatePlanId === 'pro' && (
                                                    <span
                                                        className={cn(
                                                            'absolute top-4 right-4 text-[10px] font-black tracking-widest uppercase',
                                                            isSelected
                                                                ? 'text-amber-300'
                                                                : 'text-amber-600'
                                                        )}
                                                    >
                                                        {t(
                                                            'checkout.planSection.mostComprehensive'
                                                        )}
                                                    </span>
                                                )}
                                                <p className="text-xs font-black tracking-[0.18em] uppercase opacity-60">
                                                    FogCatalog
                                                </p>
                                                <h3 className="mt-2 text-2xl font-black">
                                                    {candidateName}
                                                </h3>
                                                <p
                                                    className={cn(
                                                        'mt-2 max-w-xs text-sm leading-5',
                                                        isSelected
                                                            ? 'text-slate-300'
                                                            : 'text-slate-500'
                                                    )}
                                                >
                                                    {candidateDescription}
                                                </p>
                                                <p className="mt-4 text-lg font-black">
                                                    {formatMoney(candidate.monthlyPrice)} /{' '}
                                                    {t('checkout.month')}
                                                </p>
                                                {isSelected && (
                                                    <span className="absolute right-4 bottom-4 flex size-7 items-center justify-center rounded-full bg-white text-slate-950">
                                                        <Check className="size-4" />
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>

                                <div className="border-t border-slate-100 px-5 py-5 sm:px-7">
                                    <p className="mb-3 text-sm font-black">
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
                                                        'flex min-h-20 items-center justify-between border px-4 text-left transition-colors focus-visible:ring-4 focus-visible:ring-slate-900/15 focus-visible:outline-none',
                                                        selected
                                                            ? 'border-[#cf1414] bg-red-50'
                                                            : 'border-slate-200 hover:border-slate-400'
                                                    )}
                                                >
                                                    <span>
                                                        <span className="block font-black">
                                                            {cycle === 'monthly'
                                                                ? t('checkout.monthly')
                                                                : t('checkout.yearly')}
                                                        </span>
                                                        <span className="mt-1 block text-sm text-slate-500">
                                                            {formatMoney(price)}
                                                        </span>
                                                    </span>
                                                    {cycle === 'yearly' && (
                                                        <span className="bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-800 uppercase">
                                                            {t('checkout.twoMonthsFree')}
                                                        </span>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </section>

                            <section className="border border-slate-200 bg-white shadow-sm">
                                <SectionHeader
                                    number="2"
                                    title={t('checkout.invoice.title')}
                                    description={t('checkout.invoice.description')}
                                />

                                <div className="p-5 sm:p-7">
                                    <div className="mb-6 grid grid-cols-2 gap-3">
                                        <InvoiceTypeButton
                                            selected={invoiceType === 'individual'}
                                            onClick={() => {
                                                setInvoiceType('individual')
                                                resetSaveFeedback()
                                            }}
                                            icon={UserRound}
                                            label={t('checkout.invoice.individual')}
                                        />
                                        <InvoiceTypeButton
                                            selected={invoiceType === 'corporate'}
                                            onClick={() => {
                                                setInvoiceType('corporate')
                                                resetSaveFeedback()
                                            }}
                                            icon={Building2}
                                            label={t('checkout.invoice.corporate')}
                                        />
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <CheckoutField
                                            id="full-name"
                                            name="fullName"
                                            label={t('checkout.invoice.fullName')}
                                            autoComplete="name"
                                            required
                                        />
                                        <CheckoutField
                                            id="email"
                                            name="email"
                                            label={t('checkout.invoice.email')}
                                            type="email"
                                            autoComplete="email"
                                            required
                                        />
                                        <CheckoutField
                                            id="phone"
                                            name="phone"
                                            label={t('checkout.invoice.phone')}
                                            type="tel"
                                            autoComplete="tel"
                                            required
                                        />
                                        <CheckoutField
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
                                        />
                                        {invoiceType === 'corporate' && (
                                            <>
                                                <CheckoutField
                                                    id="company-name"
                                                    name="companyName"
                                                    label={t('checkout.invoice.companyName')}
                                                    autoComplete="organization"
                                                    required
                                                />
                                                <CheckoutField
                                                    id="tax-office"
                                                    name="taxOffice"
                                                    label={t('checkout.invoice.taxOffice')}
                                                    required
                                                />
                                            </>
                                        )}
                                        <div className="sm:col-span-2">
                                            <CheckoutField
                                                id="address"
                                                name="address"
                                                label={t('checkout.invoice.address')}
                                                autoComplete="street-address"
                                                required
                                            />
                                        </div>
                                        <CheckoutField
                                            id="city"
                                            name="city"
                                            label={t('checkout.invoice.city')}
                                            autoComplete="address-level1"
                                            required
                                        />
                                        <CheckoutField
                                            id="district"
                                            name="district"
                                            label={t('checkout.invoice.district')}
                                            autoComplete="address-level2"
                                            required
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="border border-slate-200 bg-white shadow-sm">
                                <SectionHeader
                                    number="3"
                                    title={t('checkout.payment.title')}
                                    description={t('checkout.payment.description')}
                                />

                                <div className="p-5 sm:p-7">
                                    <div className="border-2 border-slate-950 bg-slate-50 p-5">
                                        <div className="flex items-start gap-4">
                                            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                                                <CreditCard className="size-5" />
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <h3 className="font-black">
                                                        {t('checkout.payment.card')}
                                                    </h3>
                                                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 px-2.5 py-1 text-[10px] font-black tracking-wider text-emerald-800 uppercase">
                                                        <ShieldCheck className="size-3.5" />
                                                        3D Secure
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                                    {t('checkout.payment.hostedNotice')}
                                                </p>
                                                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black tracking-wider text-slate-500 uppercase">
                                                    <span className="border border-slate-200 bg-white px-3 py-2">
                                                        Visa
                                                    </span>
                                                    <span className="border border-slate-200 bg-white px-3 py-2">
                                                        Mastercard
                                                    </span>
                                                    <span className="border border-slate-200 bg-white px-3 py-2">
                                                        TROY
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <aside className="space-y-5 lg:sticky lg:top-24">
                            <section className="overflow-hidden border border-slate-950 bg-white shadow-2xl shadow-slate-900/10">
                                <div className="bg-slate-950 p-6 text-white">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-black tracking-[0.18em] text-slate-400 uppercase">
                                                {t('checkout.summary.title')}
                                            </p>
                                            <h2 className="mt-2 text-2xl font-black">{planName}</h2>
                                        </div>
                                        <span className="flex size-11 items-center justify-center rounded-full bg-white/10">
                                            {planId === 'pro' ? (
                                                <Sparkles className="size-5 text-amber-300" />
                                            ) : (
                                                <BadgeCheck className="size-5 text-blue-300" />
                                            )}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm leading-5 text-slate-300">
                                        {planDescription}
                                    </p>
                                </div>

                                <div className="p-6">
                                    <ul className="space-y-3 border-b border-slate-200 pb-5">
                                        {planFeatures.map((feature) => (
                                            <li
                                                key={feature}
                                                className="flex items-start gap-2.5 text-sm text-slate-600"
                                            >
                                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-5 border-y border-slate-950 py-5">
                                        <div className="flex items-end justify-between gap-4">
                                            <span className="font-black">
                                                {t('checkout.summary.total')}
                                            </span>
                                            <span className="text-3xl font-black tracking-tight">
                                                {formatMoney(totals.total)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-5">
                                        <AgreementCheckbox
                                            id="distance-sales"
                                            checked={acceptedDistanceSales}
                                            onCheckedChange={setAcceptedDistanceSales}
                                        >
                                            <Link
                                                href="/legal/distance-sales-agreement"
                                                target="_blank"
                                                className="font-bold text-slate-950 underline underline-offset-2"
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
                                                className="font-bold text-slate-950 underline underline-offset-2"
                                            >
                                                {t('checkout.agreements.cancellation')}
                                            </Link>{' '}
                                            {t('checkout.agreements.readSuffix')}
                                        </AgreementCheckbox>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={!canContinue || isSaving}
                                        className="mt-6 h-14 w-full rounded-none bg-[#cf1414] text-sm font-black tracking-wider text-white uppercase shadow-lg shadow-red-500/20 hover:bg-slate-950"
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

                                    <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                                        {t('checkout.payment.noCardStorage')}
                                    </p>
                                </div>
                            </section>

                            {saveError && (
                                <div
                                    role="alert"
                                    className="border border-red-300 bg-red-50 p-5 text-sm leading-6 text-red-950"
                                >
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="mt-0.5 size-5 shrink-0" />
                                        <div>
                                            <p className="font-bold">{saveError}</p>
                                            {authRequired && (
                                                <Link
                                                    href="/auth"
                                                    className="mt-3 inline-flex items-center gap-2 font-black underline underline-offset-4"
                                                >
                                                    <LogIn className="size-4" />
                                                    {t('checkout.payment.signIn')}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-3 border border-slate-200 bg-white text-center text-[11px] font-bold text-slate-600">
                                <TrustItem icon={ShieldCheck} label={t('checkout.trust.secure')} />
                                <TrustItem icon={FileText} label={t('checkout.trust.invoice')} />
                                <TrustItem icon={BadgeCheck} label={t('checkout.trust.support')} />
                            </div>
                        </aside>
                    </form>
                </div>
            </main>

            <PublicFooter />
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
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
            <span className="flex size-9 items-center justify-center rounded-full bg-slate-100 font-black">
                {number}
            </span>
            <div>
                <h2 className="text-lg font-black">{title}</h2>
                <p className="text-sm text-slate-500">{description}</p>
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
                'flex min-h-16 items-center gap-3 border px-4 text-left font-bold transition-colors',
                selected
                    ? 'border-slate-950 bg-slate-950 text-white'
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
}

function CheckoutField({ id, label, className, ...props }: CheckoutFieldProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-sm font-bold text-slate-700">
                {label}
            </Label>
            <Input
                id={id}
                className={cn('h-12 rounded-none border-slate-300 bg-white px-4', className)}
                {...props}
            />
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
                className="mt-0.5 size-5 rounded-none"
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

function TrustItem({ icon: Icon, label }: { icon: typeof ShieldCheck; label: string }) {
    return (
        <div className="flex min-h-24 flex-col items-center justify-center gap-2 border-r border-slate-200 px-2 last:border-r-0">
            <Icon className="size-5 text-slate-950" />
            <span>{label}</span>
        </div>
    )
}
