import crypto from 'crypto'
import { chromium, type Browser } from 'playwright'

import {
    createBillingDocumentWorker,
    type BillingDocumentBullJob,
} from '../services/billing-document-queue'
import { createBillingDocumentToken } from '../services/billing-document-token'
import {
    getBillingDocumentRelativePath,
    writeBillingDocumentFile,
} from '../services/pdf-export-storage'
import { supabase } from '../services/supabase'

let browser: Browser | null = null

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    return 'Unknown billing document error'
}

function getFrontendOrigin(): string {
    return (
        process.env.BILLING_DOCUMENT_RENDER_ORIGIN ||
        process.env.PDF_EXPORT_RENDER_ORIGIN ||
        process.env.APP_ORIGIN ||
        'http://localhost:3000'
    ).replace(/\/$/, '')
}

async function getBrowser(): Promise<Browser> {
    if (browser?.isConnected()) return browser

    browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote',
        ],
    })
    return browser
}

async function closeBrowser(): Promise<void> {
    if (!browser) return
    await browser.close().catch(() => undefined)
    browser = null
}

async function updateDocument(documentId: string, patch: Record<string, unknown>): Promise<void> {
    const { data, error } = await supabase
        .from('billing_documents')
        .update(patch)
        .eq('id', documentId)
        .select('id')
        .maybeSingle()

    if (error || !data) {
        throw new Error('Billing document update failed')
    }
}

async function markDocumentProcessing(documentId: string, attempts: number): Promise<boolean> {
    const { data, error } = await supabase
        .from('billing_documents')
        .update({
            status: 'processing',
            attempts,
            started_at: new Date().toISOString(),
            error_message: null,
        })
        .eq('id', documentId)
        .in('status', ['queued', 'processing', 'failed'])
        .select('id')
        .maybeSingle()

    if (error) throw new Error('Billing document processing transition failed')
    if (data) return true

    const { data: existing } = await supabase
        .from('billing_documents')
        .select('status')
        .eq('id', documentId)
        .maybeSingle()

    if (existing?.status === 'completed') return false
    throw new Error('Billing document is not renderable')
}

async function getDocumentNumber(documentId: string): Promise<string> {
    const { data, error } = await supabase
        .from('billing_documents')
        .select('document_number')
        .eq('id', documentId)
        .single()

    if (error || !data?.document_number) {
        throw new Error('Billing document number not found')
    }
    return String(data.document_number)
}

async function renderBillingDocument(job: BillingDocumentBullJob): Promise<void> {
    const { documentId } = job.data
    let phase = 'initializing'

    try {
        phase = 'marking-processing'
        const shouldRender = await markDocumentProcessing(documentId, job.attemptsMade + 1)
        if (!shouldRender) return

        const token = createBillingDocumentToken(documentId)
        const frontendOrigin = getFrontendOrigin()
        const renderUrl = `${frontendOrigin}/export/billing/${documentId}?token=${encodeURIComponent(token)}`

        phase = 'loading-render-page'
        const activeBrowser = await getBrowser()
        const page = await activeBrowser.newPage({
            viewport: { width: 794, height: 1123 },
            deviceScaleFactor: 1,
        })

        try {
            await page.route('**/*', (route) => {
                const requestUrl = new URL(route.request().url())
                if (requestUrl.origin !== frontendOrigin) {
                    return route.abort()
                }
                const resourceType = route.request().resourceType()
                if (['document', 'script', 'stylesheet', 'font'].includes(resourceType)) {
                    return route.continue()
                }
                return route.abort()
            })

            await page.goto(renderUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 90_000,
            })

            phase = 'waiting-render-ready'
            await page.waitForFunction(
                () =>
                    (window as typeof window & { __BILLING_DOCUMENT_READY?: boolean })
                        .__BILLING_DOCUMENT_READY === true,
                null,
                { timeout: 60_000 }
            )

            phase = 'rendering-pdf'
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: true,
                margin: { top: '0', right: '0', bottom: '0', left: '0' },
            })

            phase = 'uploading-r2'
            const documentNumber = await getDocumentNumber(documentId)
            const relativePath = getBillingDocumentRelativePath({
                documentId,
                documentNumber,
            })
            const { storagePath, size } = await writeBillingDocumentFile(
                relativePath,
                pdfBuffer
            )
            const sha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex')

            phase = 'finalizing-document'
            const { error } = await supabase.rpc('complete_billing_document', {
                p_document_id: documentId,
                p_file_path: storagePath,
                p_file_size_bytes: size,
                p_file_sha256: sha256,
            })
            if (error) throw new Error('Billing document completion failed')
        } finally {
            await page.close().catch(() => undefined)
        }
    } catch (error) {
        const message = getErrorMessage(error)
        await updateDocument(documentId, {
            status: 'failed',
            error_message: `${phase}: ${message}`.slice(0, 1000),
        }).catch(() => undefined)

        if (/browser.*closed|target.*closed|browser.*crash/i.test(message)) {
            await closeBrowser()
        }
        throw new Error(`[${phase}] ${message}`)
    }
}

export interface BillingDocumentWorkerHandle {
    close: () => Promise<void>
}

export function startBillingDocumentWorker(): BillingDocumentWorkerHandle {
    const worker = createBillingDocumentWorker(renderBillingDocument)

    worker.on('completed', (job) => {
        console.log(`[billing-document-worker] completed ${job.id}`)
    })
    worker.on('failed', (job) => {
        console.error(`[billing-document-worker] failed ${job?.id}`)
    })

    return {
        close: async () => {
            await closeBrowser()
            await worker.close()
        },
    }
}
