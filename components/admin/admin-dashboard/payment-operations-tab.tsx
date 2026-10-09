'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { AlertTriangle, Banknote, RefreshCw, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

import {
    acknowledgeAdminPaymentAlert,
    createAdminPaymentReversal,
    getAdminPaymentOperationsData,
    reconcileAdminPaymentAttempt,
} from '@/lib/actions/admin'
import type {
    AdminPaymentAlert,
    AdminPaymentOperation,
    AdminPaymentOrder,
} from '@/components/admin/admin-dashboard/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/lib/contexts/i18n-provider'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

const PENDING_STATUSES = ['queued', 'processing', 'retry_scheduled', 'verification_pending']

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (['succeeded', 'paid'].includes(status)) return 'default'
    if (['manual_review', 'failed', 'declined'].includes(status)) return 'destructive'
    if (PENDING_STATUSES.includes(status)) return 'secondary'
    return 'outline'
}

export function PaymentOperationsTab() {
    const { t: baseT, language } = useTranslation()
    const t = (key: string, params?: Record<string, unknown>) =>
        baseT(`admin.paymentOps.${key}`, params) as string
    // Bankadan/DB'den gelen kodlar: çevirisi yoksa ham değer gösterilir
    const label = (group: string, value: string) =>
        baseT<Record<string, string>>(`admin.paymentOps.${group}`)?.[value] ?? value
    const locale = language === 'en' ? 'en-US' : 'tr-TR'
    const money = (minor: number, currency = 'TRY') =>
        new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 100)
    const formatDate = (value: string) => new Date(value).toLocaleString(locale)

    const [orders, setOrders] = useState<AdminPaymentOrder[]>([])
    const [operations, setOperations] = useState<AdminPaymentOperation[]>([])
    const [alerts, setAlerts] = useState<AdminPaymentAlert[]>([])
    const [amounts, setAmounts] = useState<Record<string, string>>({})
    const [reasons, setReasons] = useState<Record<string, string>>({})
    const [idempotencyKeys, setIdempotencyKeys] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [pending, startTransition] = useTransition()

    const load = useCallback(async () => {
        try {
            setLoading(true)
            const data = await getAdminPaymentOperationsData()
            setOrders(data.orders)
            setOperations(data.operations)
            setAlerts(data.alerts)
        } catch {
            toast.error(t('loadError'))
        } finally {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => void load(), [load])

    const refundableOrders = useMemo(
        () => orders.filter((order) => ['paid', 'partially_refunded'].includes(order.status)),
        [orders]
    )

    const openAlerts = useMemo(
        () => alerts.filter((alert) => alert.status !== 'resolved'),
        [alerts]
    )

    // Hata yakalanmazsa transition içindeki hata tüm admin sayfasını hata ekranına düşürür
    const runAction = (action: () => Promise<void>) =>
        startTransition(async () => {
            try {
                await action()
            } catch {
                toast.error(t('actionError'))
            }
            await load()
        })

    const reverse = (order: AdminPaymentOrder, remainingMinor: number) => {
        const amount = Number(amounts[order.id])
        const reason = reasons[order.id]?.trim() ?? ''
        const amountMinor = Math.round(amount * 100)
        if (!Number.isFinite(amount) || amount <= 0 || reason.length < 3) {
            toast.error(t('invalidReversal'))
            return
        }
        if (amountMinor > remainingMinor) {
            toast.error(t('exceedsRemaining', { amount: money(remainingMinor, order.currency) }))
            return
        }
        if (!window.confirm(t('confirmReversal', { amount: money(amountMinor, order.currency) })))
            return
        const idempotencyKey = idempotencyKeys[order.id] || crypto.randomUUID()
        setIdempotencyKeys((current) => ({ ...current, [order.id]: idempotencyKey }))
        startTransition(async () => {
            try {
                await createAdminPaymentReversal({
                    orderId: order.id,
                    amountMinor,
                    reason,
                    idempotencyKey,
                })
                toast.success(t('reversalQueued'))
                setAmounts((current) => ({ ...current, [order.id]: '' }))
                setReasons((current) => ({ ...current, [order.id]: '' }))
                setIdempotencyKeys((current) => ({ ...current, [order.id]: '' }))
                await load()
            } catch {
                toast.error(t('reversalError'))
            }
        })
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t('openAlerts')}</CardDescription>
                        <CardTitle>{openAlerts.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t('pendingOperations')}</CardDescription>
                        <CardTitle>
                            {
                                operations.filter((item) => PENDING_STATUSES.includes(item.status))
                                    .length
                            }
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t('manualReview')}</CardDescription>
                        <CardTitle>
                            {operations.filter((item) => item.status === 'manual_review').length}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="size-5" />
                            {t('alertsTitle')}
                        </CardTitle>
                        <CardDescription>{t('alertsDesc')}</CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void load()}
                        disabled={loading || pending}
                    >
                        <RefreshCw className="size-4" />
                        {t('refresh')}
                    </Button>
                </CardHeader>
                <CardContent>
                    {openAlerts.length === 0 ? (
                        <p className="text-muted-foreground text-sm">{t('noAlerts')}</p>
                    ) : (
                        <div className="space-y-3">
                            {openAlerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3"
                                >
                                    <div className="flex gap-3">
                                        <AlertTriangle
                                            className={
                                                alert.severity === 'critical'
                                                    ? 'text-destructive'
                                                    : 'text-warning-soft-foreground'
                                            }
                                        />
                                        <div>
                                            <div className="font-medium">{alert.title}</div>
                                            <p className="text-muted-foreground text-sm">
                                                {alert.message}
                                            </p>
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                {alert.code} ·{' '}
                                                {t('occurrences', {
                                                    count: alert.occurrence_count,
                                                })}{' '}
                                                · {formatDate(alert.last_seen_at)}
                                            </p>
                                        </div>
                                    </div>
                                    {alert.status === 'open' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={pending}
                                            onClick={() =>
                                                runAction(() =>
                                                    acknowledgeAdminPaymentAlert(alert.id)
                                                )
                                            }
                                        >
                                            {t('acknowledge')}
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Banknote className="size-5" />
                        {t('reversalTitle')}
                    </CardTitle>
                    <CardDescription>{t('reversalDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {refundableOrders.length === 0 ? (
                        <p className="text-muted-foreground text-sm">{t('noRefundableOrders')}</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('order')}</TableHead>
                                    <TableHead>{t('plan')}</TableHead>
                                    <TableHead>{t('status')}</TableHead>
                                    <TableHead>{t('remaining')}</TableHead>
                                    <TableHead>{t('amount')}</TableHead>
                                    <TableHead>{t('reason')}</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {refundableOrders.map((order) => {
                                    const totalMinor = Math.round(Number(order.total_amount) * 100)
                                    const remaining =
                                        totalMinor - Number(order.refunded_amount_minor || 0)
                                    return (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs">
                                                {order.id.slice(0, 8)}
                                            </TableCell>
                                            <TableCell>
                                                {order.plan_id} /{' '}
                                                {label('cycles', order.billing_cycle)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusVariant(order.status)}>
                                                    {label('statuses', order.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {money(remaining, order.currency)}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    className="w-28"
                                                    inputMode="decimal"
                                                    placeholder={(remaining / 100).toFixed(2)}
                                                    value={amounts[order.id] ?? ''}
                                                    onChange={(event) => {
                                                        setAmounts((current) => ({
                                                            ...current,
                                                            [order.id]: event.target.value.replace(
                                                                ',',
                                                                '.'
                                                            ),
                                                        }))
                                                        setIdempotencyKeys((current) => ({
                                                            ...current,
                                                            [order.id]: '',
                                                        }))
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    className="min-w-44"
                                                    placeholder={t('reasonPlaceholder')}
                                                    value={reasons[order.id] ?? ''}
                                                    onChange={(event) => {
                                                        setReasons((current) => ({
                                                            ...current,
                                                            [order.id]: event.target.value,
                                                        }))
                                                        setIdempotencyKeys((current) => ({
                                                            ...current,
                                                            [order.id]: '',
                                                        }))
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    disabled={pending}
                                                    onClick={() => reverse(order, remaining)}
                                                >
                                                    {t('reverse')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('operationsTitle')}</CardTitle>
                    <CardDescription>{t('operationsDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {operations.length === 0 ? (
                        <p className="text-muted-foreground text-sm">{t('noOperations')}</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('type')}</TableHead>
                                    <TableHead>{t('status')}</TableHead>
                                    <TableHead>{t('operationAmount')}</TableHead>
                                    <TableHead>{t('bankCode')}</TableHead>
                                    <TableHead>{t('error')}</TableHead>
                                    <TableHead>{t('date')}</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {operations.map((operation) => (
                                    <TableRow key={operation.id}>
                                        <TableCell>
                                            {label('operationTypes', operation.operation_type)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariant(operation.status)}>
                                                {label('statuses', operation.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {money(operation.requested_amount_minor)}
                                        </TableCell>
                                        <TableCell>{operation.bank_response_code ?? '-'}</TableCell>
                                        <TableCell className="text-xs">
                                            {operation.last_error_code ?? '-'}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {formatDate(operation.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            {operation.operation_type === 'reconciliation' &&
                                                operation.status === 'manual_review' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={pending}
                                                        onClick={() =>
                                                            runAction(() =>
                                                                reconcileAdminPaymentAttempt(
                                                                    operation.attempt_id
                                                                )
                                                            )
                                                        }
                                                    >
                                                        {t('retry')}
                                                    </Button>
                                                )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
