'use client'

import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'

import { UpgradeModal } from '@/components/builder/modals/upgrade-modal'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAsyncTimeout } from '@/lib/hooks/use-async-timeout'
import { useTranslation } from '@/lib/i18n-provider'
import { cn } from '@/lib/utils'

import { ROWS_PER_PAGE, SYSTEM_FIELDS_KEYS } from './import-export/constants'
import { DefaultTabs } from './import-export/default-tabs'
import { autoMapColumns, getImportFileType, parseCSVFile, parseExcelFile } from './import-export/file-utils'
import { buildImportProducts, downloadTemplateCsv } from './import-export/import-products'
import { MappingStep } from './import-export/mapping-step'
import { type ColumnMapping, type MappingStatus } from './import-export/types'

interface ImportExportModalProps {
    onImport: (products: unknown[]) => Promise<void>
    onExport: () => void
    productCount: number
    currentProductCount: number
    maxProducts: number
    isLoading?: boolean
    userPlan?: 'free' | 'plus' | 'pro'
    open?: boolean
    onOpenChange?: (open: boolean) => void
    hideTrigger?: boolean
}

export function ImportExportModal({
    onImport,
    onExport,
    productCount,
    currentProductCount,
    maxProducts,
    isLoading = false,
    userPlan = 'free',
    open: controlledOpen,
    onOpenChange,
    hideTrigger,
}: ImportExportModalProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [importStatus, setImportStatus] = useState<MappingStatus>('idle')
    const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [csvHeaders, setCsvHeaders] = useState<string[]>([])
    const [csvData, setCsvData] = useState<string[][]>([])
    const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [importProgress, setImportProgress] = useState({ percent: 0, message: '' })

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const canImport = userPlan === 'plus' || userPlan === 'pro'
    const isFreeUser = userPlan === 'free'

    const { t: rawT } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => rawT(key, params) as string, [rawT])

    const importTimeout = useAsyncTimeout({
        totalTimeoutMs: 90000,
        stuckTimeoutMs: 30000,
        timeoutMessage: t('toasts.importTimeout') || 'İçe aktarma işlemi zaman aşımına uğradı.',
        showToast: true,
        onTimeout: () => setImportStatus('mapping'),
    })

    const resetState = () => {
        if (onOpenChange) onOpenChange(false)
        else setInternalOpen(false)
        setImportStatus('idle')
        setImportResult(null)
        setCsvHeaders([])
        setCsvData([])
        setColumnMappings([])
        setCurrentPage(1)
        setImportProgress({ percent: 0, message: '' })
    }

    const totalPages = Math.max(1, Math.ceil(csvData.length / ROWS_PER_PAGE))
    const visibleRows = useMemo(() => {
        const start = (currentPage - 1) * ROWS_PER_PAGE
        return csvData.slice(start, start + ROWS_PER_PAGE).map((row, index) => ({ row, realRowIndex: start + index }))
    }, [csvData, currentPage])

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages)
    }, [currentPage, totalPages])

    const mappingSummary = useMemo(() => {
        const mapped = columnMappings.filter((m) => m.systemField && m.systemField !== 'skip' && m.systemField !== null).length
        const custom = columnMappings.filter((m) => m.systemField === null).length
        const skipped = columnMappings.filter((m) => m.systemField === 'skip').length
        return { mapped, custom, skipped, total: columnMappings.length }
    }, [columnMappings])

    const systemFields = useMemo(
        () => SYSTEM_FIELDS_KEYS.map((key) => ({
            id: key,
            label: t(`products.importExport.systemFields.${key === 'image_url' ? 'imageUrl' : key === 'product_url' ? 'productUrl' : key === 'images' ? 'additionalImages' : key}`) + (key === 'name' || key === 'price' ? ' *' : ''),
        })),
        [t],
    )

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const type = getImportFileType(file)
            if (!type) throw new Error(t('toasts.invalidFileFormat'))

            if (type === 'excel') toast.info(t('toasts.readingExcel'), { duration: 2000 })
            const parsed = type === 'excel' ? await parseExcelFile(file, t) : await parseCSVFile(file, t)
            if (!parsed.data.length) throw new Error(t('toasts.noValidData'))

            setCsvHeaders(parsed.headers)
            setCsvData(parsed.data)
            setColumnMappings(autoMapColumns(parsed.headers))
            setCurrentPage(1)
            setImportStatus('mapping')
            toast.success(t('importExport.rowsFound', { count: parsed.data.length }))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('toasts.processingError'))
        }

        e.target.value = ''
    }

    const executeImport = async () => {
        if (!columnMappings.some((m) => m.systemField === 'name')) {
            toast.error(t('toasts.nameFieldRequired'))
            return
        }
        if (!columnMappings.some((m) => m.systemField === 'price')) {
            toast.error(t('toasts.priceFieldRequired'))
            return
        }

        const products = buildImportProducts({ csvData, csvHeaders, columnMappings, isFreeUser, onProgress: importTimeout.setProgress })
        if (!products.length) {
            toast.error(t('toasts.noValidProducts'))
            return
        }

        if (currentProductCount + products.length > maxProducts) {
            toast.error(t('toasts.productLimitReached', {
                current: currentProductCount.toString(),
                incoming: products.length.toString(),
                max: maxProducts.toString(),
            }))
            return
        }

        setImportStatus('loading')
        setImportProgress({ percent: 10, message: t('importExport.preparing') || 'Hazırlanıyor...' })
        await importTimeout.execute(async () => {
            setImportProgress({ percent: 30, message: t('importExport.uploading') || 'Ürünler yükleniyor...' })
            importTimeout.setProgress(50)
            await onImport(products)
            setImportProgress({ percent: 90, message: t('importExport.finishing') || 'Tamamlanıyor...' })
            importTimeout.setProgress(100)
            setImportProgress({ percent: 100, message: `${products.length} ${t('importExport.productsReady') || 'ürün aktarıldı'}` })

            setImportStatus('success')
            setImportResult({ success: products.length, failed: 0 })
            toast.success(t('importExport.productsImported', { count: products.length }))
            setTimeout(resetState, 2000)
        }).catch((error) => {
            setImportStatus('mapping')
            toast.error(error instanceof Error ? error.message : t('toasts.processingError'))
        })
    }

    return (
        <>
            <Dialog open={open} onOpenChange={(value) => (value ? (onOpenChange ? onOpenChange(true) : setInternalOpen(true)) : resetState())}>
                {!hideTrigger && (
                    <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2" size="sm">
                            <FileSpreadsheet className="h-4 w-4" />
                            <span className="hidden sm:inline">{t('importExport.title')}</span>
                            <span className="sm:hidden">CSV</span>
                        </Button>
                    </DialogTrigger>
                )}

                <DialogContent className={cn('sm:max-w-[600px] max-h-[90vh] overflow-y-auto', importStatus === 'mapping' && 'sm:max-w-[800px]')}>
                    <DialogHeader>
                        <DialogTitle>{importStatus === 'mapping' ? t('importExport.columnMapping') : t('importExport.title')}</DialogTitle>
                        <DialogDescription>{importStatus === 'mapping' ? t('importExport.mappingDesc') : t('importExport.mainDesc')}</DialogDescription>
                    </DialogHeader>

                    {importStatus === 'mapping' ? (
                        <MappingStep
                            t={t}
                            isFreeUser={isFreeUser}
                            csvData={csvData}
                            csvHeaders={csvHeaders}
                            columnMappings={columnMappings}
                            systemFields={systemFields}
                            visibleRows={visibleRows}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            rowsPerPage={ROWS_PER_PAGE}
                            mappingSummary={mappingSummary}
                            onMappingChange={(columnIndex, systemField) => {
                                setColumnMappings((prev) => {
                                    const next = [...prev]
                                    if (systemField && systemField !== 'skip' && systemField !== 'custom') {
                                        const existing = next.findIndex((m, i) => i !== columnIndex && m.systemField === systemField)
                                        if (existing !== -1) next[existing] = { ...next[existing], systemField: null }
                                    }
                                    next[columnIndex] = {
                                        ...next[columnIndex],
                                        systemField: systemField === 'custom' ? null : systemField === 'skip' ? 'skip' : systemField,
                                    }
                                    return next
                                })
                            }}
                            onCustomNameChange={(columnIndex, customName) =>
                                setColumnMappings((prev) => prev.map((m, i) => (i === columnIndex ? { ...m, customName } : m)))
                            }
                            onCellEdit={(rowIndex, colIndex, value) =>
                                setCsvData((prev) => {
                                    const next = [...prev]
                                    const row = [...(next[rowIndex] || [])]
                                    row[colIndex] = value
                                    next[rowIndex] = row
                                    return next
                                })
                            }
                            onCancel={resetState}
                            onImport={executeImport}
                            onPageChange={setCurrentPage}
                        />
                    ) : (
                        <DefaultTabs
                            t={t}
                            canImport={canImport}
                            importStatus={importStatus}
                            importResult={importResult}
                            productCount={productCount}
                            isLoading={isLoading}
                            onOpenUpgrade={() => setShowUpgradeModal(true)}
                            onDownloadTemplate={() => {
                                downloadTemplateCsv((key) => t(key))
                                toast.success(t('toasts.templateDownloaded'))
                            }}
                            onFileUpload={handleFileUpload}
                            onResetError={() => setImportStatus('idle')}
                            onExportAndClose={() => {
                                onExport()
                                if (onOpenChange) onOpenChange(false)
                                else setInternalOpen(false)
                            }}
                            progressPercent={importProgress.percent}
                            progressMessage={importProgress.message}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
        </>
    )
}
