import { ChevronLeft, ChevronRight, Columns3, Crown, Database, FileSpreadsheet, Sparkles, Unlink2, Upload, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { type SystemFieldOption, type ColumnMapping } from './types'

interface MappingStepProps {
    t: (key: string, params?: Record<string, unknown>) => string
    isFreeUser: boolean
    csvData: string[][]
    csvHeaders: string[]
    columnMappings: ColumnMapping[]
    systemFields: SystemFieldOption[]
    visibleRows: Array<{ row: string[]; realRowIndex: number }>
    currentPage: number
    totalPages: number
    rowsPerPage: number
    mappingSummary: { mapped: number; custom: number; skipped: number; total: number }
    onMappingChange: (columnIndex: number, systemField: string) => void
    onCustomNameChange: (columnIndex: number, customName: string) => void
    onCellEdit: (rowIndex: number, colIndex: number, value: string) => void
    onCancel: () => void
    onImport: () => void
    onPageChange: (page: number) => void
}

export function MappingStep({
    t,
    isFreeUser,
    csvData,
    csvHeaders,
    columnMappings,
    systemFields,
    visibleRows,
    currentPage,
    totalPages,
    rowsPerPage,
    mappingSummary,
    onMappingChange,
    onCustomNameChange,
    onCellEdit,
    onCancel,
    onImport,
    onPageChange,
}: MappingStepProps) {
    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 shrink-0">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100">
                            <Columns3 className="w-5 h-5 text-indigo-700" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-indigo-950 text-base">{t('importExport.columnMapping')}</h3>
                            <p className="text-indigo-700/70 text-sm">{csvData.length} {t('importExport.rowsToImport')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100/70 border border-indigo-200 cursor-help">
                                        <Database className="w-3.5 h-3.5 text-indigo-700" />
                                        <span className="text-indigo-800 text-sm font-medium">{mappingSummary.mapped}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('importExport.mappedFields') || 'Eşlenen Alanlar'}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-indigo-200 cursor-help">
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                        <span className="text-indigo-700 text-sm font-medium">{mappingSummary.custom}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('importExport.customFields') || 'Özel Özellikler'}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </div>

            {isFreeUser && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                        <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t('importExport.freePlanLimit')}</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">{t('importExport.freePlanLimitDesc')}</p>
                    </div>
                </div>
            )}

            <div className="border rounded-lg overflow-hidden flex-1 min-h-[400px] flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-muted/50 text-muted-foreground font-medium sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-2 py-3 w-[50px] text-center bg-muted/50 text-xs">#</th>
                                {csvHeaders.map((header, index) => (
                                    <th key={index} className="px-4 py-3 min-w-[220px] bg-muted/50 border-b align-top">
                                        <div className="space-y-2">
                                            <div className="font-semibold text-foreground flex items-center gap-2">
                                                {(() => {
                                                    const mapped = columnMappings[index]?.systemField
                                                    const sysField = mapped && mapped !== 'skip' && mapped !== null
                                                        ? systemFields.find(f => f.id === mapped)
                                                        : null
                                                    return sysField ? (
                                                        <span className="flex flex-col min-w-0">
                                                            <span className="truncate max-w-[160px] text-indigo-700" title={sysField.label}>{sysField.label}</span>
                                                            <span className="truncate max-w-[160px] text-[11px] font-normal text-muted-foreground" title={header}>{header}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="truncate max-w-[150px]" title={header}>{header}</span>
                                                    )
                                                })()}
                                                <Badge variant="secondary" className="text-[10px] h-4 px-1 shrink-0">{index + 1}</Badge>
                                            </div>

                                            <Select
                                                value={columnMappings[index]?.systemField === null ? 'custom_attribute' : (columnMappings[index]?.systemField || 'ignore')}
                                                onValueChange={(val) => onMappingChange(index, val === 'custom_attribute' ? 'custom' : val === 'ignore' ? 'skip' : val)}
                                            >
                                                <SelectTrigger className="h-9 text-xs bg-background border-input hover:border-violet-400 focus:ring-violet-500 w-full">
                                                    <SelectValue placeholder={t('importExport.selectField') || 'Seçiniz'} />
                                                </SelectTrigger>
                                                <SelectContent className="z-[9999] max-h-[300px]" position="popper" sideOffset={4}>
                                                    <SelectItem value="ignore" className="text-muted-foreground italic">
                                                        <span className="flex items-center gap-2"><Unlink2 className="w-3.5 h-3.5" />{t('importExport.ignore')}</span>
                                                    </SelectItem>
                                                    <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-b border-t my-1">
                                                        {t('importExport.systemFieldsTitle') || 'Sistem Alanları'}
                                                    </div>
                                                    {systemFields.map((f) => (
                                                        <SelectItem key={f.id} value={f.id} className="cursor-pointer">
                                                            <span className="flex items-center gap-2"><Database className="w-3.5 h-3.5 text-blue-500" />{f.label}</span>
                                                        </SelectItem>
                                                    ))}
                                                    <div className="border-t my-1" />
                                                    <SelectItem value="custom_attribute" className="text-violet-600 font-medium cursor-pointer">
                                                        <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" />+ {t('importExport.customAttribute')}</span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>

                                            {columnMappings[index]?.systemField === null && (
                                                <Input
                                                    placeholder={t('importExport.attributeNamePlaceholder') || 'Özellik adı'}
                                                    value={columnMappings[index]?.customName || ''}
                                                    onChange={(e) => onCustomNameChange(index, e.target.value)}
                                                    className="h-8 text-xs mt-1.5"
                                                />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {visibleRows.map(({ row, realRowIndex }) => (
                                <tr key={realRowIndex} className="group hover:bg-muted/30 transition-colors">
                                    <td className="px-2 py-2 text-center text-xs text-muted-foreground bg-muted/10">{realRowIndex + 1}</td>
                                    {row.map((cell, cellIndex) => (
                                        <td key={cellIndex} className="p-0 border-r last:border-r-0 relative">
                                            <Input
                                                value={cell}
                                                onChange={(e) => onCellEdit(realRowIndex, cellIndex, e.target.value)}
                                                className="h-9 w-full border-0 rounded-none bg-transparent text-xs px-3"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between px-4 py-2 border-t bg-background/95">
                    <span className="text-xs text-muted-foreground">
                        {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, csvData.length)} / {csvData.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-7 px-2" disabled={currentPage === 1} onClick={() => onPageChange(Math.max(1, currentPage - 1))}>
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        <span className="text-xs text-muted-foreground min-w-[60px] text-center">{currentPage} / {totalPages}</span>
                        <Button variant="outline" size="sm" className="h-7 px-2" disabled={currentPage === totalPages} onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="ghost" onClick={onCancel}><X className="w-4 h-4 mr-2" />{t('common.cancel')}</Button>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span className="font-medium">{csvData.length}</span>
                        <span>{t('importExport.rowsToImport')}</span>
                    </div>
                    <Button onClick={onImport} className="gap-2">
                        <Upload className="w-4 h-4" />
                        {t('importExport.import')}
                    </Button>
                </div>
            </div>
        </div>
    )
}
