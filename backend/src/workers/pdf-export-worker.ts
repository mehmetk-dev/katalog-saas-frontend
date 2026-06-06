import 'dotenv/config'
import { chromium, type Browser } from 'playwright'
import http from 'http'

import { supabase } from '../services/supabase'
import { createPdfExportWorker, type PdfExportBullJob } from '../services/pdf-export-queue'
import { getPdfExportRelativePath, writePdfExportFile } from '../services/pdf-export-storage'
import { createPdfExportToken } from '../services/pdf-export-token'
import { cleanupExpiredPdfExports } from './pdf-export-cleanup'

let cachedFrontendOrigin: string | null = null

function probeFrontend(host: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const req = http.get(`http://${host}:${port}/api/health`, { timeout: 3000 }, (res) => {
            resolve(res.statusCode === 200)
            res.resume()
        })
        req.on('error', () => resolve(false))
        req.on('timeout', () => {
            req.destroy()
            resolve(false)
        })
    })
}

async function discoverFrontendOrigin(): Promise<string> {
    const envValue = (process.env.PDF_EXPORT_RENDER_ORIGIN || '').replace(/\/$/, '')
    if (envValue) {
        cachedFrontendOrigin = envValue
        return envValue
    }

    const candidates = [
        { host: 'frontend', port: 3000 },
        { host: 'nextjs', port: 3000 },
        { host: 'app', port: 3000 },
        { host: 'localhost', port: 3000 },
    ]

    for (const c of candidates) {
        if (await probeFrontend(c.host, c.port)) {
            const origin = `http://${c.host}:${c.port}`
            console.log(`[pdf-export-worker] discovered frontend at ${origin}`)
            cachedFrontendOrigin = origin
            return origin
        }
    }

    const fallback = (process.env.APP_ORIGIN || 'http://localhost:3000').replace(/\/$/, '')
    console.warn(`[pdf-export-worker] could not discover frontend, using fallback: ${fallback}`)
    cachedFrontendOrigin = fallback
    return fallback
}

async function updateJob(jobId: string, patch: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.from('pdf_export_jobs').update(patch).eq('id', jobId)

    if (error) throw error
}

async function getCatalogExportName(
    catalogId: string,
    userId: string
): Promise<{ name: unknown; share_slug: unknown } | null> {
    const { data, error } = await supabase
        .from('catalogs')
        .select('name,share_slug')
        .eq('id', catalogId)
        .eq('user_id', userId)
        .single()

    if (error) {
        console.warn(`[pdf-export-worker] catalog name lookup failed for ${catalogId}:`, error.message)
        return null
    }

    return data
}

let sharedBrowser: Browser | null = null
let browserCrashCount = 0
const MAX_BROWSER_CRASHES = 3

async function getBrowser(): Promise<Browser> {
    if (sharedBrowser && sharedBrowser.isConnected()) {
        return sharedBrowser
    }
    browserCrashCount = 0
    sharedBrowser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--no-zygote',
        ],
    })
    return sharedBrowser
}

async function recoverBrowser(): Promise<void> {
    if (sharedBrowser) {
        try {
            if (sharedBrowser.isConnected()) {
                await sharedBrowser.close()
            }
        } catch {
            // browser already dead
        }
        sharedBrowser = null
    }
}

const READY_TIMEOUT_MS = Number(process.env.PDF_EXPORT_READY_TIMEOUT_MS || 300_000)

const GOTO_TIMEOUT_MS = Number(process.env.PDF_EXPORT_GOTO_TIMEOUT_MS || 120_000)

async function renderPdf(job: PdfExportBullJob): Promise<void> {
    const { jobId, userId, catalogId } = job.data

    try {
        await updateJob(jobId, {
            status: 'processing',
            progress: 15,
            attempts: job.attemptsMade + 1,
            started_at: new Date().toISOString(),
        })

        const token = createPdfExportToken(jobId)
        const frontendOrigin = await discoverFrontendOrigin()
        const renderUrl = `${frontendOrigin}/export/catalog/${jobId}?token=${encodeURIComponent(token)}`

        const browser = await getBrowser()
        const page = await browser.newPage({
            viewport: { width: 794, height: 1123 },
            deviceScaleFactor: job.data.quality === 'high' ? 2 : 1,
        })

        try {
            await page.route('**/*', (route) => {
                const resourceType = route.request().resourceType()

                if (resourceType === 'image' || resourceType === 'font' || resourceType === 'stylesheet') {
                    return route.continue()
                }

                if (resourceType === 'script') {
                    const urlLower = route.request().url().toLowerCase()
                    if (
                        urlLower.includes('analytics') ||
                        urlLower.includes('sentry') ||
                        urlLower.includes('gtag') ||
                        urlLower.includes('google-analytics') ||
                        urlLower.includes('googletagmanager') ||
                        urlLower.includes('hotjar') ||
                        urlLower.includes('clarity') ||
                        urlLower.includes('facebook') ||
                        urlLower.includes('tiktok')
                    ) {
                        return route.abort()
                    }
                    return route.continue()
                }

                return route.continue()
            })

            await page.goto(renderUrl, { waitUntil: 'domcontentloaded', timeout: GOTO_TIMEOUT_MS })
            await updateJob(jobId, { progress: 35 })

            await page.waitForFunction(
                () =>
                    (window as typeof window & { __PDF_EXPORT_READY?: boolean })
                        .__PDF_EXPORT_READY === true,
                null,
                { timeout: READY_TIMEOUT_MS }
            )

            const pageCount = await page
                .locator('.catalog-page-wrapper')
                .count()
                .catch(() => null)
            await updateJob(jobId, { progress: 50, page_count: pageCount })

            await page.waitForFunction(
                () => {
                    const images = Array.from(document.querySelectorAll<HTMLImageElement>('img'))
                    if (images.length === 0) return true
                    return images.every((img) => img.complete)
                },
                null,
                { timeout: READY_TIMEOUT_MS }
            )
            await updateJob(jobId, { progress: 70 })

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: true,
                margin: { top: '0', right: '0', bottom: '0', left: '0' },
            })

            const catalogName = await getCatalogExportName(catalogId, userId)
            const relativePath = getPdfExportRelativePath({
                jobId,
                catalogName: catalogName?.name,
                catalogSlug: catalogName?.share_slug,
            })
            await updateJob(jobId, { progress: 90 })
            const { size } = await writePdfExportFile(relativePath, pdfBuffer)
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

            await updateJob(jobId, {
                status: 'completed',
                progress: 100,
                file_path: relativePath,
                file_size_bytes: size,
                completed_at: new Date().toISOString(),
                expires_at: expiresAt,
                error_message: null,
            })
        } finally {
            await page.close().catch(() => undefined)
        }
    } catch (error) {
        browserCrashCount++
        if (browserCrashCount >= MAX_BROWSER_CRASHES || (error instanceof Error && error.message?.includes('Browser closed'))) {
            await recoverBrowser()
        }
        await updateJob(jobId, {
            status: 'failed',
            progress: 0,
            error_message: error instanceof Error ? error.message : 'PDF export failed',
        }).catch(() => undefined)
        throw error
    }
}

const worker = createPdfExportWorker(renderPdf)

worker.on('completed', (job) => {
    console.log(`[pdf-export-worker] completed ${job.id}`)
})

worker.on('failed', (job, error) => {
    console.error(`[pdf-export-worker] failed ${job?.id}:`, error)
})

async function shutdown(): Promise<void> {
    await recoverBrowser()
    await worker.close()
    process.exit(0)
}

process.on('SIGTERM', () => void shutdown())
process.on('SIGINT', () => void shutdown())

void worker.waitUntilReady().then(async () => {
    const origin = await discoverFrontendOrigin()
    console.log(`[pdf-export-worker] ready — frontend: ${origin}`)
})

const CLEANUP_INTERVAL_MS = Number(process.env.PDF_EXPORT_CLEANUP_INTERVAL_MS || 60 * 60 * 1000)
async function runCleanupTick(): Promise<void> {
    try {
        const { processed } = await cleanupExpiredPdfExports()
        if (processed > 0) {
            console.log(`[pdf-export-worker] cleanup expired ${processed} job(s)`)
        }
    } catch (error) {
        console.error('[pdf-export-worker] cleanup tick failed:', error)
    }
}
void runCleanupTick()
setInterval(() => void runCleanupTick(), CLEANUP_INTERVAL_MS)
