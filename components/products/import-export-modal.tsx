'use client'

import { useState, useMemo } from 'react'
import * as XLSX from '@e965/xlsx'
import {
    Download,
    Upload,
    FileSpreadsheet,
    FileText,
    CheckCircle2,
    AlertCircle,
    HelpCircle,
    X,
    Loader2,
    Crown,
    ArrowRight,
    Link2,
    Unlink2,
    Sparkles,
    MoreHorizontal,
    Pencil,
    Tag,
    Database,
    FileType,
    Columns3,
    RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { UpgradeModal } from '@/components/builder/upgrade-modal'
import { useTranslation } from '@/lib/i18n-provider'
import { useAsyncTimeout } from '@/lib/hooks/use-async-timeout'
import { Progress } from '@/components/ui/progress'

interface ImportExportModalProps {
    onImport: (products: any[]) => Promise<void>
    onExport: () => void
    productCount: number
    isLoading?: boolean
    userPlan?: 'free' | 'plus' | 'pro'
    open?: boolean
    onOpenChange?: (open: boolean) => void
    hideTrigger?: boolean
}

// Sistem alanları
const SYSTEM_FIELDS_KEYS = ['name', 'sku', 'description', 'price', 'stock', 'category', 'image_url'] as const


// Otomatik eşleme için header aliases
const HEADER_ALIASES: Record<string, string> = {
    // İsim - tüm varyasyonlar
    'ad': 'name',
    'isim': 'name',
    'adi': 'name',
    'adı': 'name',
    'ürün adı': 'name',
    'urun adi': 'name',
    'ürün_adı': 'name',
    'urun_adi': 'name',
    'ürünadı': 'name',
    'urunadi': 'name',
    'ürün': 'name',
    'urun': 'name',
    'name': 'name',
    'product name': 'name',
    'product_name': 'name',
    'productname': 'name',
    'başlık': 'name',
    'baslik': 'name',
    'title': 'name',
    // SKU
    'sku': 'sku',
    'stok kodu': 'sku',
    'stok_kodu': 'sku',
    'stokkodu': 'sku',
    'kod': 'sku',
    'ürün kodu': 'sku',
    'urun kodu': 'name',
    'ürün_kodu': 'sku',
    'urun_kodu': 'sku',
    'product code': 'sku',
    'product_code': 'sku',
    'productcode': 'sku',
    'barkod': 'sku',
    'barcode': 'sku',
    // Açıklama
    'açıklama': 'description',
    'aciklama': 'description',
    'detay': 'description',
    'description': 'description',
    'desc': 'description',
    'bilgi': 'description',
    'ürün açıklaması': 'description',
    'urun aciklamasi': 'description',
    // Fiyat
    'fiyat': 'price',
    'ücret': 'price',
    'ucret': 'price',
    'tutar': 'price',
    'price': 'price',
    'birim fiyat': 'price',
    'birim_fiyat': 'price',
    'satış fiyatı': 'price',
    'satis fiyati': 'price',
    'satis_fiyati': 'price',
    'amount': 'price',
    // Stok
    'stok': 'stock',
    'adet': 'stock',
    'miktar': 'stock',
    'stock': 'stock',
    'quantity': 'stock',
    'qty': 'stock',
    'stok adedi': 'stock',
    'stok_adedi': 'stock',
    // Kategori
    'kategori': 'category',
    'category': 'category',
    'grup': 'category',
    'tür': 'category',
    'tur': 'category',
    'type': 'category',
    'ürün kategorisi': 'category',
    'urun kategorisi': 'category',
    // Görsel
    'görsel': 'image_url',
    'gorsel': 'image_url',
    'görsel url': 'image_url',
    'gorsel url': 'image_url',
    'görsel_url': 'image_url',
    'gorsel_url': 'image_url',
    'resim': 'image_url',
    'resim url': 'image_url',
    'resim_url': 'image_url',
    'image': 'image_url',
    'image_url': 'image_url',
    'imageurl': 'image_url',
    'photo': 'image_url',
    'foto': 'image_url',
    'fotoğraf': 'image_url',
    'fotograf': 'image_url',
    'url': 'image_url',
    'link': 'image_url',
}

type MappingStatus = 'idle' | 'mapping' | 'loading' | 'success' | 'error'

interface ColumnMapping {
    csvColumn: string
    systemField: string | null // null = özel özellik olarak ekle, 'skip' = atla
    customName?: string // Özel özellik için kullanıcının belirlediği isim
}

export function ImportExportModal({
    onImport,
    onExport,
    productCount,
    isLoading = false,
    userPlan = 'free',
    open: controlledOpen,
    onOpenChange,
    hideTrigger
}: ImportExportModalProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const [importStatus, setImportStatus] = useState<MappingStatus>('idle')
    const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)

    // Mapping state
    const [csvHeaders, setCsvHeaders] = useState<string[]>([])
    const [csvData, setCsvData] = useState<string[][]>([])
    const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])

    const canImport = userPlan === 'plus' || userPlan === 'pro'
    const isFreeUser = userPlan === 'free'
    const { t } = useTranslation()

    // Timeout hook for import process
    const importTimeout = useAsyncTimeout({
        totalTimeoutMs: 90000, // 90 saniye
        stuckTimeoutMs: 30000, // 30 saniye ilerleme yoksa
        timeoutMessage: t('toasts.importTimeout') || 'İçe aktarma işlemi zaman aşımına uğradı.',
        showToast: true,
        onTimeout: () => setImportStatus('error')
    })

    // CSV şablonunu indir
    const downloadTemplate = () => {
        const headers = [
            t('importExport.systemFields.name') + '*',
            t('importExport.systemFields.sku'),
            t('importExport.systemFields.description'),
            t('importExport.systemFields.price') + '*',
            t('importExport.systemFields.stock'),
            t('importExport.systemFields.category'),
            t('importExport.systemFields.imageUrl'),
            t('products.attributeNames.weight'),
            t('products.attributeNames.color'),
            t('products.attributeNames.material')
        ]

        const sampleData = [
            [
                'Ergonomik Ofis Koltuğu',
                'MOB-001',
                'Bel destekli, ayarlanabilir kolçaklar',
                '2499.99',
                '25',
                'Mobilya',
                'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500',
                '12 kg',
                'Siyah',
                'Kumaş/Metal'
            ],
            [
                'Ahşap Çalışma Masası',
                'MOB-002',
                'Doğal meşe, 150x75 cm',
                '1899.00',
                '15',
                'Mobilya',
                'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500',
                '35 kg',
                'Doğal',
                'Meşe Ahşap'
            ],
            [
                'LED Masa Lambası',
                'AKS-001',
                '3 parlaklık seviyesi, USB şarjlı',
                '349.90',
                '100',
                'Aksesuar',
                '',
                '0.8 kg',
                'Beyaz',
                'Plastik/LED'
            ],
            [
                'Dekoratif Saksı Seti',
                'DEK-001',
                '3\'lü set, farklı boyutlar',
                '189.00',
                '50',
                'Dekorasyon',
                '',
                '2 kg',
                'Terrakota',
                'Seramik'
            ]
        ]

        const csvContent = [
            headers.join(';'),
            ...sampleData.map(row =>
                row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(';')
            )
        ].join('\n')

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'urun-import-sablonu.csv'
        link.click()
        URL.revokeObjectURL(url)
        toast.success(t('toasts.templateDownloaded'))
    }

    // CSV satırını parse et (virgül, noktalı virgül, tab desteği)
    const parseCSVLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
            const char = line[i]

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"'
                    i++
                } else {
                    inQuotes = !inQuotes
                }
            } else if ((char === ';' || char === ',' || char === '\t') && !inQuotes) {
                result.push(current.trim())
                current = ''
            } else {
                current += char
            }
        }

        result.push(current.trim())
        return result
    }

    // Otomatik eşleme yap
    const autoMapColumns = (headers: string[]): ColumnMapping[] => {
        const usedFields = new Set<string>()

        return headers.map(header => {
            const normalizedHeader = header.toLowerCase().replace(/\*/g, '').trim()
            const matchedField = HEADER_ALIASES[normalizedHeader]

            if (matchedField && !usedFields.has(matchedField)) {
                usedFields.add(matchedField)
                return { csvColumn: header, systemField: matchedField }
            }

            // Eşlenemeyen kolonlar custom_attribute olarak işaretlenir (null)
            return { csvColumn: header, systemField: null }
        })
    }

    // Excel dosyasını parse et
    const parseExcelFile = (file: File): Promise<{ headers: string[]; data: string[][] }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()

            reader.onload = (event) => {
                try {
                    const arrayBuffer = event.target?.result as ArrayBuffer
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

                    // İlk çalışma sayfasını al
                    const firstSheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[firstSheetName]

                    // JSON'a çevir (header'ları ayrı olarak)
                    const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 })

                    if (jsonData.length < 2) {
                        reject(new Error(t('toasts.noValidData')))
                        return
                    }

                    // İlk satır header
                    const headers = (jsonData[0] as string[]).map(h => String(h || '').trim())

                    // Diğer satırlar veri
                    const data: string[][] = []
                    for (let i = 1; i < jsonData.length; i++) {
                        const row = jsonData[i] as string[]
                        if (row && row.some(v => v !== undefined && v !== null && String(v).trim() !== '')) {
                            data.push(row.map(v => String(v ?? '').trim()))
                        }
                    }

                    resolve({ headers, data })
                } catch (error) {
                    reject(error)
                }
            }

            reader.onerror = () => reject(new Error(t('toasts.errorOccurred')))
            reader.readAsArrayBuffer(file)
        })
    }

    // CSV dosyasını parse et
    const parseCSVFile = (file: File): Promise<{ headers: string[]; data: string[][] }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()

            reader.onload = (event) => {
                try {
                    const text = event.target?.result as string
                    const lines = text.split('\n').filter(line => line.trim())

                    if (lines.length < 2) {
                        reject(new Error(t('toasts.noValidData')))
                        return
                    }

                    const headers = parseCSVLine(lines[0])

                    const data: string[][] = []
                    for (let i = 1; i < lines.length; i++) {
                        const values = parseCSVLine(lines[i])
                        if (values.some(v => v)) {
                            data.push(values)
                        }
                    }

                    resolve({ headers, data })
                } catch (error) {
                    reject(error)
                }
            }

            reader.onerror = () => reject(new Error(t('toasts.errorOccurred')))
            reader.readAsText(file, 'UTF-8')
        })
    }

    // Dosya yükleme - CSV ve Excel desteği
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Dosya türünü belirle
        const isExcelFile =
            file.type === 'application/vnd.ms-excel' ||
            file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.name.endsWith('.xlsx') ||
            file.name.endsWith('.xls')

        const isCSVFile =
            file.type === 'text/csv' ||
            file.type === 'text/plain' ||
            file.name.endsWith('.csv')

        if (!isExcelFile && !isCSVFile) {
            toast.error(t('toasts.invalidFileFormat'))
            e.target.value = ''
            return
        }

        try {
            let result: { headers: string[]; data: string[][] }

            if (isExcelFile) {
                toast.info(t('toasts.readingExcel'), { duration: 2000 })
                result = await parseExcelFile(file)
            } else {
                result = await parseCSVFile(file)
            }

            const { headers, data } = result

            if (data.length === 0) {
                toast.error(t('toasts.noValidData'))
                e.target.value = ''
                return
            }

            // State'leri güncelle
            setCsvHeaders(headers)
            setCsvData(data)

            // Otomatik eşleme yap
            const mappings = autoMapColumns(headers)
            setColumnMappings(mappings)

            // Mapping ekranına geç
            setImportStatus('mapping')
            toast.success(t('importExport.rowsFound', { count: data.length }))

        } catch (error) {
            console.error('File parse error:', error)
            toast.error(error instanceof Error ? error.message : t('toasts.processingError'))
        }

        e.target.value = ''
    }

    // Eşleme değişikliği
    const handleMappingChange = (columnIndex: number, systemField: string) => {
        setColumnMappings(prev => {
            const newMappings = [...prev]

            // Eğer bu alan başka bir kolona atanmışsa, o kolonun eşlemesini kaldır
            if (systemField && systemField !== 'skip' && systemField !== 'custom') {
                const existingIndex = newMappings.findIndex(
                    (m, i) => i !== columnIndex && m.systemField === systemField
                )
                if (existingIndex !== -1) {
                    newMappings[existingIndex] = {
                        ...newMappings[existingIndex],
                        systemField: null
                    }
                }
            }

            newMappings[columnIndex] = {
                ...newMappings[columnIndex],
                systemField: systemField === 'custom' ? null : (systemField === 'skip' ? 'skip' : systemField)
            }

            return newMappings
        })
    }

    // Özel özellik ismini değiştir
    const handleCustomNameChange = (columnIndex: number, customName: string) => {
        setColumnMappings(prev => {
            const newMappings = [...prev]
            newMappings[columnIndex] = {
                ...newMappings[columnIndex],
                customName: customName
            }
            return newMappings
        })
    }

    // Hücre düzenleme
    const handleCellEdit = (rowIndex: number, colIndex: number, value: string) => {
        const newData = [...csvData]
        newData[rowIndex][colIndex] = value
        setCsvData(newData)
    }

    const SYSTEM_FIELDS = SYSTEM_FIELDS_KEYS.map(key => ({
        id: key,
        label: t(`importExport.systemFields.${key === 'image_url' ? 'imageUrl' : key}` as any) + (key === 'name' || key === 'price' ? ' *' : '')
    }))

    // İmport işlemini gerçekleştir
    const executeImport = async () => {
        // Zorunlu alanların kontrolü
        const nameMapped = columnMappings.some(m => m.systemField === 'name')
        const priceMapped = columnMappings.some(m => m.systemField === 'price')

        if (!nameMapped) {
            toast.error(t('toasts.nameFieldRequired'))
            return
        }
        if (!priceMapped) {
            toast.error(t('toasts.priceFieldRequired'))
            return
        }

        setImportStatus('loading')

        await importTimeout.execute(async () => {
            const products: any[] = []
            const totalRows = csvData.length

            for (let rowIdx = 0; rowIdx < csvData.length; rowIdx++) {
                const row = csvData[rowIdx]

                // Progress güncelle (veri işleme: %0-50)
                importTimeout.setProgress(Math.round((rowIdx / totalRows) * 50))

                const product: any = {
                    name: '',
                    sku: null,
                    description: null,
                    price: 0,
                    stock: 0,
                    category: null,
                    image_url: null,
                    custom_attributes: []
                }

                const customAttrs: { name: string; value: string }[] = []

                columnMappings.forEach((mapping, index) => {
                    const value = row[index]?.trim() || ''

                    if (mapping.systemField === 'skip' || !value) {
                        return
                    }

                    if (mapping.systemField === null) {
                        // Özel özellik olarak ekle
                        if (value && csvHeaders[index]) {
                            const attrName = mapping.customName?.trim() ||
                                csvHeaders[index].charAt(0).toUpperCase() + csvHeaders[index].slice(1).replace(/\*/g, '')
                            customAttrs.push({
                                name: attrName,
                                value
                            })
                        }
                        return
                    }

                    // Sistem alanlarına eşle
                    switch (mapping.systemField) {
                        case 'name':
                            product.name = value
                            break
                        case 'sku':
                            product.sku = value || null
                            break
                        case 'description':
                            product.description = value || null
                            break
                        case 'price':
                            product.price = parseFloat(value.replace(',', '.').replace(/[^\d.]/g, '')) || 0
                            break
                        case 'stock':
                            product.stock = parseInt(value) || 0
                            break
                        case 'category':
                            product.category = isFreeUser ? null : (value || null)
                            break
                        case 'image_url':
                            product.image_url = value || null
                            break
                    }
                })

                product.custom_attributes = customAttrs

                if (product.name) {
                    products.push(product)
                }
            }

            if (products.length === 0) {
                setImportStatus('error')
                toast.error(t('toasts.noValidProducts'))
                return
            }

            // Progress güncelle (API çağrısı: %50-100)
            importTimeout.setProgress(50)

            await onImport(products)

            importTimeout.setProgress(100)

            setImportStatus('success')
            setImportResult({ success: products.length, failed: 0 })
            toast.success(t('importExport.productsImported', { count: products.length }))

            setTimeout(() => {
                resetState()
            }, 2000)
        })

        // Timeout olmuşsa error durumu zaten ayarlandı
        if (importTimeout.hasTimeout) {
            setImportStatus('error')
        }
    }

    // State'i sıfırla
    const resetState = () => {
        if (onOpenChange) {
            onOpenChange(false)
        } else {
            setInternalOpen(false)
        }
        setImportStatus('idle')
        setImportResult(null)
        setCsvHeaders([])
        setCsvData([])
        setColumnMappings([])
    }

    // Eşlenmiş alanların özeti
    const mappingSummary = useMemo(() => {
        const mapped = columnMappings.filter(m => m.systemField && m.systemField !== 'skip' && m.systemField !== null).length
        const custom = columnMappings.filter(m => m.systemField === null).length
        const skipped = columnMappings.filter(m => m.systemField === 'skip').length
        return { mapped, custom, skipped, total: columnMappings.length }
    }, [columnMappings])

    return (
        <>
            <Dialog open={open} onOpenChange={(value) => {
                if (!value) resetState();
                else {
                    if (onOpenChange) onOpenChange(true)
                    else setInternalOpen(true)
                }
            }}>
                {!hideTrigger && (
                    <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2" size="sm">
                            <FileSpreadsheet className="h-4 w-4" />
                            <span className="hidden sm:inline">{t("importExport.title")}</span>
                            <span className="sm:hidden">CSV</span>
                        </Button>
                    </DialogTrigger>
                )}
                <DialogContent className={cn(
                    "sm:max-w-[600px] max-h-[90vh] overflow-y-auto",
                    importStatus === 'mapping' && "sm:max-w-[800px]"
                )}>
                    <DialogHeader>
                        <DialogTitle>
                            {importStatus === 'mapping' ? t("importExport.columnMapping") : t("importExport.title")}
                        </DialogTitle>
                        <DialogDescription>
                            {importStatus === 'mapping'
                                ? t("importExport.mappingDesc") || 'Map file columns to system fields.'
                                : t("importExport.mainDesc") || 'Add products in bulk with CSV or export your existing products.'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {importStatus === 'mapping' ? (
                        // KOLON EŞLEME EKRANI - Modern Tasarım
                        <div className="space-y-5">
                            {/* Gradient Header */}
                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 p-4">
                                <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,white)]" />
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
                                            <Columns3 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white text-lg">{t("importExport.columnMapping")}</h3>
                                            <p className="text-white/80 text-sm">{csvData.length} {t("importExport.rowsToImport")}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                                            <Database className="w-3.5 h-3.5 text-white" />
                                            <span className="text-white text-sm font-medium">{mappingSummary.mapped}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                                            <Sparkles className="w-3.5 h-3.5 text-white" />
                                            <span className="text-white text-sm font-medium">{mappingSummary.custom}</span>
                                        </div>
                                        {mappingSummary.skipped > 0 && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
                                                <Unlink2 className="w-3.5 h-3.5 text-white/70" />
                                                <span className="text-white/70 text-sm font-medium">{mappingSummary.skipped}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Free kullanıcı uyarısı */}
                            {isFreeUser && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                                        <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                            {t("importExport.freePlanLimit")}
                                        </p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">
                                            {t("importExport.freePlanLimitDesc")}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Eşleme ve Düzenleme Tablosu */}
                            <div className="border rounded-lg overflow-hidden flex-1 min-h-[400px] flex flex-col">
                                <div className="overflow-auto flex-1">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead className="bg-muted/50 text-muted-foreground font-medium sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="px-2 py-3 w-[50px] text-center bg-muted/50 text-xs">#</th>
                                                {csvHeaders.map((header, index) => (
                                                    <th key={index} className="px-4 py-3 min-w-[200px] bg-muted/50 border-b">
                                                        <div className="space-y-2">
                                                            <div className="font-semibold text-foreground flex items-center gap-2">
                                                                <span className="truncate">{header}</span>
                                                                <Badge variant="secondary" className="text-[10px] h-4 px-1">{index + 1}</Badge>
                                                            </div>
                                                            <Select
                                                                value={columnMappings[index]?.systemField === null ? 'custom_attribute' : (columnMappings[index]?.systemField || 'ignore')}
                                                                onValueChange={(val) => handleMappingChange(index, val === 'custom_attribute' ? 'custom' : val === 'ignore' ? 'skip' : val)}
                                                            >
                                                                <SelectTrigger className="h-8 text-xs bg-background border-input/80">
                                                                    <SelectValue placeholder="Seçiniz" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="ignore" className="text-muted-foreground italic">{t("importExport.ignore")}</SelectItem>
                                                                    {SYSTEM_FIELDS.map(f => (
                                                                        <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                                                                    ))}
                                                                    <SelectItem value="custom_attribute" className="text-violet-600 font-medium">+ {t("importExport.customAttribute")}</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            {columnMappings[index]?.systemField === null && (
                                                                <Input
                                                                    placeholder={t("importExport.attributeName")}
                                                                    value={columnMappings[index]?.customName || ''}
                                                                    onChange={(e) => handleCustomNameChange(index, e.target.value)}
                                                                    className="h-7 text-xs mt-1.5 bg-yellow-50 border-yellow-200 focus:border-yellow-400 focus:ring-yellow-400/20"
                                                                />
                                                            )}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {csvData.map((row, rowIndex) => (
                                                <tr key={rowIndex} className="group hover:bg-muted/30 transition-colors">
                                                    <td className="px-2 py-2 text-center text-xs text-muted-foreground bg-muted/10">{rowIndex + 1}</td>
                                                    {row.map((cell, cellIndex) => (
                                                        <td key={cellIndex} className="p-0 border-r last:border-r-0 relative">
                                                            <Input
                                                                value={cell}
                                                                onChange={(e) => handleCellEdit(rowIndex, cellIndex, e.target.value)}
                                                                className="h-9 w-full border-0 rounded-none bg-transparent hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-inset focus:ring-violet-500 text-xs px-3"
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-muted/30 px-4 py-2 text-xs text-muted-foreground text-center border-t shrink-0">
                                    <span className="opacity-70 italic">
                                        * {t("importExport.editHint") || "Tablodaki hücrelere tıklayarak verileri düzenleyebilirsiniz."}
                                    </span>
                                </div>
                            </div>

                            {/* Alt Aksiyonlar */}
                            <div className="flex items-center justify-between pt-4 border-t">
                                <Button variant="ghost" onClick={resetState} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-4 h-4 mr-2" />
                                    {t("common.cancel")}
                                </Button>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                                        <FileSpreadsheet className="w-4 h-4" />
                                        <span className="font-medium">{csvData.length}</span>
                                        <span>{t("importExport.rowsToImport")}</span>
                                    </div>
                                    <Button
                                        onClick={executeImport}
                                        className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25"
                                    >
                                        <Upload className="w-4 h-4" />
                                        {t("importExport.import")}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // NORMAL EKRAN (Tabs)
                        <Tabs defaultValue="import" className="mt-4">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="import" className="gap-2">
                                    <Upload className="h-4 w-4" />
                                    {t("importExport.import")}
                                </TabsTrigger>
                                <TabsTrigger value="export" className="gap-2">
                                    <Download className="h-4 w-4" />
                                    {t("importExport.export")}
                                </TabsTrigger>
                            </TabsList>

                            {/* İÇE AKTARMA */}
                            <TabsContent value="import" className="space-y-4 mt-4">
                                {/* Free kullanıcılar için Pro badge */}
                                {!canImport && importStatus === 'idle' && (
                                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center">
                                        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                            <Crown className="h-8 w-8 text-white" />
                                        </div>
                                        <h3 className="font-semibold text-lg text-amber-900 dark:text-amber-100">
                                            {t("importExport.proFeature")}
                                        </h3>
                                        <p className="text-amber-700 dark:text-amber-300 mt-2 max-w-sm mx-auto">
                                            {t("importExport.proDesc")}
                                        </p>
                                        <div className="flex items-center justify-center gap-2 mt-4">
                                            <Button
                                                onClick={() => setShowUpgradeModal(true)}
                                                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                                            >
                                                <Crown className="h-4 w-4 mr-2" />
                                                {t("importExport.upgradePlan")}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                                            {t("importExport.freeDesc") || "You can download the template or add products manually."}
                                        </p>
                                    </div>
                                )}

                                {canImport && importStatus === 'idle' && (
                                    <>
                                        {/* Şablon İndir */}
                                        <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-violet-100 dark:bg-violet-900 rounded-lg">
                                                    <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-violet-900 dark:text-violet-100">
                                                        1. {t("importExport.downloadTemplate")}
                                                    </h4>
                                                    <p className="text-sm text-violet-700 dark:text-violet-300 mt-1">
                                                        {t("importExport.templateDesc") || "Download the sample template for the correct format."}
                                                    </p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="mt-3 border-violet-300 w-full justify-center sm:w-auto"
                                                        onClick={downloadTemplate}
                                                    >
                                                        <Download className="h-4 w-4 mr-2" />
                                                        {t("importExport.downloadTemplate")} (.csv)
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dosya Yükle */}
                                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                                            <input
                                                type="file"
                                                accept=".csv,.xlsx,.xls"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <label
                                                htmlFor="file-upload"
                                                className="cursor-pointer"
                                            >
                                                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                                                <p className="font-medium">2. {t("importExport.uploadFile")}</p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {t("importExport.dragDrop")}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {t("importExport.supportedFormats")}
                                                </p>
                                            </label>
                                        </div>

                                        {/* İpuçları */}
                                        <div className="bg-muted/50 rounded-lg p-4">
                                            <h4 className="font-medium mb-2 flex items-center gap-2">
                                                <HelpCircle className="h-4 w-4" />
                                                {t("importExport.active")}
                                            </h4>
                                            <ul className="text-sm text-muted-foreground space-y-1">
                                                <li>• {t("importExport.tip1") || "You can map columns after upload"}</li>
                                                <li>• {t("toasts.nameFieldRequired")} & {t("toasts.priceFieldRequired")}</li>
                                                <li>• {t("importExport.tip2") || "Unmatched columns are added as custom attributes"}</li>
                                                <li>• {t("importExport.tip3") || "Turkish characters and different column names are supported"}</li>
                                            </ul>
                                        </div>
                                    </>
                                )}

                                {importStatus === 'loading' && (
                                    <div className="py-12 text-center">
                                        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                                        <p className="font-medium">{t("common.loading")}</p>
                                        <p className="text-sm text-muted-foreground">{t("common.wait") || "Please wait"}</p>
                                    </div>
                                )}

                                {importStatus === 'success' && importResult && (
                                    <div className="py-12 text-center">
                                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                                        </div>
                                        <p className="font-medium text-lg">{t("importExport.importSuccess")}</p>
                                        <p className="text-muted-foreground mt-1">
                                            {t("importExport.productsImported", { count: importResult.success })}
                                        </p>
                                    </div>
                                )}

                                {importStatus === 'error' && (
                                    <div className="py-12 text-center">
                                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <AlertCircle className="h-8 w-8 text-red-600" />
                                        </div>
                                        <p className="font-medium text-lg">{t("importExport.importFailed")}</p>
                                        <p className="text-muted-foreground mt-1">
                                            {t("importExport.checkFile") || "Check your file and try again"}
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="mt-4"
                                            onClick={() => setImportStatus('idle')}
                                        >
                                            {t("auth.retry")}
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>

                            {/* DIŞA AKTARMA */}
                            <TabsContent value="export" className="space-y-4 mt-4">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl">
                                            <FileSpreadsheet className="h-8 w-8 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg text-green-900 dark:text-green-100">
                                                {t("importExport.exportAll")}
                                            </h3>
                                            <p className="text-green-700 dark:text-green-300 mt-1">
                                                {productCount > 0
                                                    ? t("importExport.willDownload", { count: productCount })
                                                    : t("importExport.noProductsExport")
                                                }
                                            </p>

                                            {productCount > 0 && (
                                                <div className="mt-4 space-y-2">
                                                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        {t("products.name")}, SKU, {t("products.description")}, {t("products.price")}, {t("products.stock")}, {t("products.category")}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        {t("importExport.imagesIncluded")}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <strong>{t("importExport.customAttributesIncluded")}</strong>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        {t("importExport.excelCompatible")}
                                                    </div>
                                                </div>
                                            )}

                                            <Button
                                                className="mt-4 bg-green-600 hover:bg-green-700"
                                                onClick={() => {
                                                    onExport()
                                                    if (onOpenChange) {
                                                        onOpenChange(false)
                                                    } else {
                                                        setInternalOpen(false)
                                                    }
                                                }}
                                                disabled={productCount === 0 || isLoading}
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Download className="h-4 w-4 mr-2" />
                                                )}
                                                {t("importExport.downloadCsv")}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Export Bilgi */}
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <HelpCircle className="h-4 w-4" />
                                        {t("importExport.aboutExport")}
                                    </h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• {t("importExport.utf8Note")}</li>
                                        <li>• {t("importExport.charsNote")}</li>
                                    </ul>
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>

            {/* Upgrade Modal for Free Users */}
            <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
        </>
    )
}
