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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

function money(minor: number, currency = 'TRY') {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(minor / 100)
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (['succeeded', 'paid'].includes(status)) return 'default'
    if (['manual_review', 'failed', 'declined'].includes(status)) return 'destructive'
    if (['queued', 'processing', 'retry_scheduled', 'verification_pending'].includes(status))
        return 'secondary'
    return 'outline'
}

export function PaymentOperationsTab() {
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
            toast.error('Ödeme operasyonları yüklenemedi.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => void load(), [load])

    const openAlerts = useMemo(
        () => alerts.filter((alert) => alert.status !== 'resolved'),
        [alerts]
    )

    const reverse = (order: AdminPaymentOrder) => {
        const amount = Number(amounts[order.id])
        const reason = reasons[order.id]?.trim() ?? ''
        const amountMinor = Math.round(amount * 100)
        if (!Number.isFinite(amount) || amount <= 0 || reason.length < 3) {
            toast.error('Geçerli iade tutarı ve en az 3 karakter gerekçe girin.')
            return
        }
        if (!window.confirm(`${money(amountMinor)} için iptal/iade isteği oluşturulsun mu?`)) return
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
                toast.success('İptal/iade operasyonu güvenli kuyruğa alındı.')
                setAmounts((current) => ({ ...current, [order.id]: '' }))
                setReasons((current) => ({ ...current, [order.id]: '' }))
                setIdempotencyKeys((current) => ({ ...current, [order.id]: '' }))
                await load()
            } catch {
                toast.error(
                    'İptal/iade oluşturulamadı; kalan tutar ve sipariş durumunu kontrol edin.'
                )
            }
        })
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Açık alarm</CardDescription>
                        <CardTitle>{openAlerts.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Bekleyen operasyon</CardDescription>
                        <CardTitle>
                            {
                                operations.filter((item) =>
                                    [
                                        'queued',
                                        'processing',
                                        'retry_scheduled',
                                        'verification_pending',
                                    ].includes(item.status)
                                ).length
                            }
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Manuel inceleme</CardDescription>
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
                            Hata alarmları
                        </CardTitle>
                        <CardDescription>
                            Hassas veri içermeyen kalıcı ödeme alarmları.
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void load()}
                        disabled={loading || pending}
                    >
                        <RefreshCw className="size-4" />
                        Yenile
                    </Button>
                </CardHeader>
                <CardContent>
                    {openAlerts.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Açık alarm yok.</p>
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
                                                    ? 'text-red-600'
                                                    : 'text-amber-600'
                                            }
                                        />
                                        <div>
                                            <div className="font-medium">{alert.title}</div>
                                            <p className="text-muted-foreground text-sm">
                                                {alert.message}
                                            </p>
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                {alert.code} · {alert.occurrence_count} kez ·{' '}
                                                {new Date(alert.last_seen_at).toLocaleString(
                                                    'tr-TR'
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    {alert.status === 'open' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={pending}
                                            onClick={() =>
                                                startTransition(async () => {
                                                    await acknowledgeAdminPaymentAlert(alert.id)
                                                    await load()
                                                })
                                            }
                                        >
                                            İncelendi
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
                        Sipariş iptal/iade
                    </CardTitle>
                    <CardDescription>
                        Aynı gün dokunulmamış tam tutar otomatik iptal, diğer tutarlar iade olur.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sipariş</TableHead>
                                <TableHead>Paket</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead>Kalan</TableHead>
                                <TableHead>Tutar (TL)</TableHead>
                                <TableHead>Gerekçe</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders
                                .filter((order) =>
                                    ['paid', 'partially_refunded'].includes(order.status)
                                )
                                .map((order) => {
                                    const totalMinor = Math.round(Number(order.total_amount) * 100)
                                    const remaining =
                                        totalMinor - Number(order.refunded_amount_minor || 0)
                                    return (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs">
                                                {order.id.slice(0, 8)}
                                            </TableCell>
                                            <TableCell>
                                                {order.plan_id} / {order.billing_cycle}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusVariant(order.status)}>
                                                    {order.status}
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
                                                    placeholder="İade gerekçesi"
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
                                                    onClick={() => reverse(order)}
                                                >
                                                    İptal / İade
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Mutabakat operasyonları</CardTitle>
                    <CardDescription>
                        Banka sipariş sorgusu, iptal/iade ve manuel kontrol durumları.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tür</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead>Tutar</TableHead>
                                <TableHead>Banka kodu</TableHead>
                                <TableHead>Hata</TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {operations.map((operation) => (
                                <TableRow key={operation.id}>
                                    <TableCell>{operation.operation_type}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariant(operation.status)}>
                                            {operation.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{money(operation.requested_amount_minor)}</TableCell>
                                    <TableCell>{operation.bank_response_code ?? '-'}</TableCell>
                                    <TableCell className="text-xs">
                                        {operation.last_error_code ?? '-'}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {new Date(operation.created_at).toLocaleString('tr-TR')}
                                    </TableCell>
                                    <TableCell>
                                        {operation.operation_type === 'reconciliation' &&
                                            operation.status === 'manual_review' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={pending}
                                                    onClick={() =>
                                                        startTransition(async () => {
                                                            await reconcileAdminPaymentAttempt(
                                                                operation.attempt_id
                                                            )
                                                            await load()
                                                        })
                                                    }
                                                >
                                                    Tekrar sorgula
                                                </Button>
                                            )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
