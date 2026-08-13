import { notFound } from 'next/navigation'

import { PaymentReceiptDocument } from '@/components/billing/payment-receipt-document'
import { paymentReceiptPayloadSchema } from '@/lib/billing/payment-receipt'
import { verifyBillingDocumentToken } from '@/lib/server/billing-document-token'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface BillingDocumentPageProps {
    params: Promise<{ documentId: string }>
    searchParams: Promise<{ token?: string }>
}

interface RenderData {
    document?: {
        payload?: unknown
    }
}

function getApiBaseUrl(): string {
    return (
        process.env.API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:4000/api/v1'
    ).replace(/\/$/, '')
}

async function getRenderData(documentId: string, token: string): Promise<RenderData | null> {
    try {
        const response = await fetch(
            `${getApiBaseUrl()}/billing/documents/${documentId}/render-data?token=${encodeURIComponent(token)}`,
            { cache: 'no-store' }
        )
        if (!response.ok) return null
        return await response.json()
    } catch {
        return null
    }
}

export default async function BillingDocumentPage({
    params,
    searchParams,
}: BillingDocumentPageProps) {
    const { documentId } = await params
    const { token } = await searchParams

    if (!token || !verifyBillingDocumentToken(documentId, token)) {
        notFound()
    }

    const renderData = await getRenderData(documentId, token)
    const parsed = paymentReceiptPayloadSchema.safeParse(renderData?.document?.payload)
    if (!parsed.success) {
        notFound()
    }

    return <PaymentReceiptDocument payload={parsed.data} />
}
