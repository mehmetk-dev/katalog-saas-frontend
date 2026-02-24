import type { ChangeEvent } from 'react'
import { AlertCircle, CheckCircle2, Crown, Download, FileSpreadsheet, FileText, HelpCircle, Loader2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type MappingStatus } from './types'

interface DefaultTabsProps {
    t: (key: string, params?: Record<string, unknown>) => string
    canImport: boolean
    importStatus: MappingStatus
    importResult: { success: number; failed: number } | null
    productCount: number
    isLoading: boolean
    onOpenUpgrade: () => void
    onDownloadTemplate: () => void
    onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void
    onResetError: () => void
    onExportAndClose: () => void
    progressPercent?: number
    progressMessage?: string
}

export function DefaultTabs({
    t,
    canImport,
    importStatus,
    importResult,
    productCount,
    isLoading,
    onOpenUpgrade,
    onDownloadTemplate,
    onFileUpload,
    onResetError,
    onExportAndClose,
    progressPercent = 0,
    progressMessage = '',
}: DefaultTabsProps) {
    return (
        <Tabs defaultValue="import" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="import" className="gap-2"><Upload className="h-4 w-4" />{t('importExport.import')}</TabsTrigger>
                <TabsTrigger value="export" className="gap-2"><Download className="h-4 w-4" />{t('importExport.export')}</TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-4 mt-4">
                {!canImport && importStatus === 'idle' && (
                    <div className="rounded-lg border p-6 text-center">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-amber-100"><Crown className="h-8 w-8 text-amber-600" /></div>
                        <h3 className="font-semibold text-lg">{t('importExport.proFeature')}</h3>
                        <p className="mt-2">{t('importExport.proDesc')}</p>
                        <Button onClick={onOpenUpgrade} className="mt-4"><Crown className="h-4 w-4 mr-2" />{t('importExport.upgradePlan')}</Button>
                    </div>
                )}

                {canImport && importStatus === 'idle' && (
                    <>
                        <div className="rounded-lg border p-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-violet-100"><FileText className="h-5 w-5 text-violet-600" /></div>
                                <div className="flex-1">
                                    <h4 className="font-medium">1. {t('importExport.downloadTemplate')}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {t('importExport.templateDesc') || 'Doğru formatlama için örnek şablonu indirin.'}
                                    </p>
                                    <Button variant="outline" size="sm" className="mt-3" onClick={onDownloadTemplate}>
                                        <Download className="h-4 w-4 mr-2" />{t('importExport.downloadTemplate')} (.csv)
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div
                            className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={onFileUpload}
                                className="sr-only"
                                id="file-upload"
                            />
                            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                            <p className="font-medium">2. {t('importExport.uploadFile')}</p>
                            <p className="text-sm text-muted-foreground mt-1">{t('importExport.dragDrop')}</p>
                            <p className="text-xs text-muted-foreground mt-2">{t('importExport.supportedFormats')}</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="font-medium mb-2 flex items-center gap-2"><HelpCircle className="h-4 w-4" />{t('importExport.active')}</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• {t('importExport.tip1') || 'Yüklemeden sonra kolon eşleştirmesi yapabilirsiniz'}</li>
                                <li>• {t('toasts.nameFieldRequired')} &amp; {t('toasts.priceFieldRequired')}</li>
                                <li>• {t('importExport.tip2') || 'Eşleşmeyen kolonlar özel özellik olarak eklenir'}</li>
                                <li>• {t('importExport.tip3') || 'Türkçe karakterler ve farklı kolon isimleri desteklenir'}</li>
                            </ul>
                        </div>
                    </>
                )}

                {importStatus === 'loading' && (
                    <div className="py-8 text-center space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto text-violet-600" />
                        <div className="space-y-2 px-4">
                            <Progress value={progressPercent} className="h-2.5 bg-gray-100 dark:bg-gray-800 [&>div]:bg-violet-600 [&>div]:transition-all [&>div]:duration-500" />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{progressMessage || t('importExport.importing') || 'İçe aktarılıyor...'}</span>
                                <span className="font-semibold text-violet-600">{progressPercent}%</span>
                            </div>
                        </div>
                    </div>
                )}

                {importStatus === 'success' && importResult && (
                    <div className="py-12 text-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-4" />
                        <p>{t('importExport.productsImported', { count: importResult.success })}</p>
                    </div>
                )}

                {importStatus === 'error' && (
                    <div className="py-12 text-center">
                        <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
                        <Button variant="outline" className="mt-4" onClick={onResetError}>{t('auth.retry')}</Button>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="export" className="space-y-4 mt-4">
                <div className="rounded-lg border p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-green-100"><FileSpreadsheet className="h-8 w-8 text-green-600" /></div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg">{t('importExport.exportAll')}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {productCount > 0 ? t('importExport.willDownload', { count: productCount }) : t('importExport.noProductsExport')}
                            </p>
                            {productCount > 0 && (
                                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />{t('products.name')}, SKU, {t('products.description')}, {t('products.price')}, {t('products.stock')}, {t('products.category')}</div>
                                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />{t('importExport.imagesIncluded')}</div>
                                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /><strong>{t('importExport.customAttributesIncluded')}</strong></div>
                                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />{t('importExport.excelCompatible')}</div>
                                </div>
                            )}
                            <Button className="mt-4" onClick={onExportAndClose} disabled={productCount === 0 || isLoading}>
                                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                                {t('importExport.downloadCsv')}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2"><HelpCircle className="h-4 w-4" />{t('importExport.aboutExport')}</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• {t('importExport.utf8Note')}</li>
                        <li>• {t('importExport.charsNote')}</li>
                    </ul>
                </div>
            </TabsContent>
        </Tabs>
    )
}
