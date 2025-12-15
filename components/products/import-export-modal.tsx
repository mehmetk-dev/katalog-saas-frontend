'use client'

import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
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
    Columns3
} from 'lucide-react'
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
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'

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
const SYSTEM_FIELDS = [
    { key: 'name', label: 'Ürün Adı', required: true },
    { key: 'sku', label: 'SKU (Stok Kodu)', required: false },
    { key: 'description', label: 'Açıklama', required: false },
    { key: 'price', label: 'Fiyat', required: true },
    { key: 'stock', label: 'Stok', required: false },
    { key: 'category', label: 'Kategori', required: false },
    { key: 'image_url', label: 'Görsel URL', required: false },
] as const

// Otomatik eşleme için header aliases
const HEADER_ALIASES: Record<string, string> = {
    // İsim
    'ad': 'name',
    'isim': 'name',
    'ürün adı': 'name',
    'ürün': 'name',
    'name': 'name',
    'product name': 'name',
    'başlık': 'name',
    'title': 'name',
    // SKU
    'sku': 'sku',
    'stok kodu': 'sku',
    'kod': 'sku',
    'ürün kodu': 'sku',
    'product code': 'sku',
    // Açıklama
    'açıklama': 'description',
    'detay': 'description',
    'description': 'description',
    'desc': 'description',
    // Fiyat
    'fiyat': 'price',
    'ücret': 'price',
    'tutar': 'price',
    'price': 'price',
    'birim fiyat': 'price',
    'satış fiyatı': 'price',
    // Stok
    'stok': 'stock',
    'adet': 'stock',
    'miktar': 'stock',
    'stock': 'stock',
    'quantity': 'stock',
    // Kategori
    'kategori': 'category',
    'category': 'category',
    'grup': 'category',
    'tür': 'category',
    'type': 'category',
    // Görsel
    'görsel': 'image_url',
    'görsel url': 'image_url',
    'resim': 'image_url',
    'image': 'image_url',
    'image_url': 'image_url',
    'photo': 'image_url',
    'foto': 'image_url',
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

    // Mapping state
    const [csvHeaders, setCsvHeaders] = useState<string[]>([])
    const [csvData, setCsvData] = useState<string[][]>([])
    const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])

    const canImport = userPlan === 'plus' || userPlan === 'pro'
    const isFreeUser = userPlan === 'free'

    // CSV şablonunu indir
    const downloadTemplate = () => {
        const headers = [
            'Ad*',
            'SKU',
            'Açıklama',
            'Fiyat*',
            'Stok',
            'Kategori',
            'Görsel URL',
            'Ağırlık',
            'Renk',
            'Malzeme'
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
        toast.success('Örnek şablon indirildi')
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
                        reject(new Error('Dosyada yeterli veri bulunamadı'))
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

            reader.onerror = () => reject(new Error('Dosya okunamadı'))
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
                        reject(new Error('Dosyada yeterli veri bulunamadı'))
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

            reader.onerror = () => reject(new Error('Dosya okunamadı'))
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
            toast.error('Lütfen CSV veya Excel dosyası yükleyin (.csv, .xlsx, .xls)')
            e.target.value = ''
            return
        }

        try {
            let result: { headers: string[]; data: string[][] }

            if (isExcelFile) {
                toast.info('Excel dosyası okunuyor...', { duration: 2000 })
                result = await parseExcelFile(file)
            } else {
                result = await parseCSVFile(file)
            }

            const { headers, data } = result

            if (data.length === 0) {
                toast.error('Dosyada geçerli veri bulunamadı')
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
            toast.success(`${data.length} satır bulundu. Kolon eşlemesini yapın.`)

        } catch (error) {
            console.error('File parse error:', error)
            toast.error(error instanceof Error ? error.message : 'Dosya işlenirken hata oluştu')
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

    // İmport işlemini gerçekleştir
    const executeImport = async () => {
        // Zorunlu alanların kontrolü
        const nameMapped = columnMappings.some(m => m.systemField === 'name')
        const priceMapped = columnMappings.some(m => m.systemField === 'price')

        if (!nameMapped) {
            toast.error('Ürün Adı alanını eşlemeniz zorunludur')
            return
        }
        if (!priceMapped) {
            toast.error('Fiyat alanını eşlemeniz zorunludur')
            return
        }

        setImportStatus('loading')

        try {
            const products: any[] = []

            for (const row of csvData) {
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
                            // Kullanıcı özel isim belirlemişse onu kullan, yoksa CSV header'ını kullan
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
                            // Free kullanıcılar için kategori atla
                            product.category = isFreeUser ? null : (value || null)
                            break
                        case 'image_url':
                            product.image_url = value || null
                            break
                    }
                })

                product.custom_attributes = customAttrs

                // Sadece adı olan ürünleri ekle
                if (product.name) {
                    products.push(product)
                }
            }

            if (products.length === 0) {
                setImportStatus('error')
                toast.error('Geçerli ürün bulunamadı')
                return
            }

            await onImport(products)

            setImportStatus('success')
            setImportResult({ success: products.length, failed: 0 })
            toast.success(`${products.length} ürün başarıyla içe aktarıldı!`)

            // 2 saniye sonra modal'ı kapat
            setTimeout(() => {
                resetState()
            }, 2000)

        } catch (error) {
            setImportStatus('error')
            toast.error('Ürünler içe aktarılamadı')
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
                        <span className="hidden sm:inline">İçe/Dışa Aktar</span>
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
                        {importStatus === 'mapping' ? 'Kolon Eşleme' : 'Ürün İçe/Dışa Aktarma'}
                    </DialogTitle>
                    <DialogDescription>
                        {importStatus === 'mapping'
                            ? 'Dosyadaki kolonları sistem alanlarına eşleyin.'
                            : 'CSV dosyası ile toplu ürün ekleyin veya mevcut ürünlerinizi dışa aktarın.'
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
                                        <h3 className="font-semibold text-white text-lg">Kolon Eşleme</h3>
                                        <p className="text-white/80 text-sm">{csvData.length} satır içe aktarılacak</p>
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
                                        Ücretsiz Plan Kısıtlaması
                                    </p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                        Kategori alanı ücretsiz planda desteklenmez. Kategorilerinizi içe aktarmak için Plus veya Pro'ya yükseltin.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Eşleme Kartları - Kompakt */}
                        <ScrollArea className="h-[300px] pr-2">
                            <div className="space-y-2">
                                {csvHeaders.map((header, index) => {
                                    const mapping = columnMappings[index]
                                    const sampleValue = csvData[0]?.[index] || ''
                                    const isMapped = mapping?.systemField && mapping.systemField !== 'skip' && mapping.systemField !== null
                                    const isCustom = mapping?.systemField === null
                                    const isSkipped = mapping?.systemField === 'skip'

                                    return (
                                        <div
                                            key={index}
                                            className={cn(
                                                "relative rounded-lg border p-2 transition-all",
                                                isMapped && "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
                                                isCustom && "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800",
                                                isSkipped && "bg-gray-50 border-gray-200 opacity-60 dark:bg-gray-950/30 dark:border-gray-700",
                                                !isMapped && !isCustom && !isSkipped && "bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Sol: Kolon Adı ve Önizleme */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm truncate">{header}</span>
                                                        <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                                            ({sampleValue || 'boş'})
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Ok */}
                                                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />

                                                {/* Sağ: Hedef Seçimi */}
                                                <div className="shrink-0 w-[160px]">
                                                    <Select
                                                        value={
                                                            mapping?.systemField === null ? 'custom' :
                                                                mapping?.systemField === 'skip' ? 'skip' :
                                                                    mapping?.systemField || 'custom'
                                                        }
                                                        onValueChange={(value) => handleMappingChange(index, value)}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue placeholder="Eşle..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="skip">
                                                                <span className="text-gray-500">Atla</span>
                                                            </SelectItem>
                                                            <SelectItem value="custom">
                                                                <span className="text-violet-600">Özel Özellik</span>
                                                            </SelectItem>
                                                            <div className="border-t my-1" />
                                                            {SYSTEM_FIELDS.map(field => {
                                                                const isUsed = columnMappings.some(
                                                                    (m, i) => i !== index && m.systemField === field.key
                                                                )
                                                                const isCategoryDisabled = field.key === 'category' && isFreeUser
                                                                return (
                                                                    <SelectItem
                                                                        key={field.key}
                                                                        value={field.key}
                                                                        disabled={isUsed || isCategoryDisabled}
                                                                    >
                                                                        <span className="flex items-center gap-1">
                                                                            {field.label}
                                                                            {field.required && (
                                                                                <Badge variant="destructive" className="text-[8px] h-3 px-1">*</Badge>
                                                                            )}
                                                                        </span>
                                                                    </SelectItem>
                                                                )
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>

                        {/* Alt Aksiyonlar */}
                        <div className="flex items-center justify-between pt-4 border-t">
                            <Button variant="ghost" onClick={resetState} className="text-muted-foreground hover:text-foreground">
                                <X className="w-4 h-4 mr-2" />
                                İptal
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                                    <FileSpreadsheet className="w-4 h-4" />
                                    <span className="font-medium">{csvData.length}</span>
                                    <span>ürün hazır</span>
                                </div>
                                <Button
                                    onClick={executeImport}
                                    className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25"
                                >
                                    <Upload className="w-4 h-4" />
                                    İçe Aktar
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
                                İçe Aktar
                            </TabsTrigger>
                            <TabsTrigger value="export" className="gap-2">
                                <Download className="h-4 w-4" />
                                Dışa Aktar
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
                                        Toplu İçe Aktarma - Pro Özellik
                                    </h3>
                                    <p className="text-amber-700 dark:text-amber-300 mt-2 max-w-sm mx-auto">
                                        CSV ile toplu ürün import etme özelliği Plus ve Pro planlara özeldir.
                                    </p>
                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <a href="/pricing">
                                            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
                                                <Crown className="h-4 w-4 mr-2" />
                                                Planı Yükselt
                                            </Button>
                                        </a>
                                    </div>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                                        Şablonu indirebilir, tek tek ürün ekleyebilirsiniz.
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
                                                    1. Örnek Şablonu İndirin
                                                </h4>
                                                <p className="text-sm text-violet-700 dark:text-violet-300 mt-1">
                                                    Doğru format için örnek şablonu indirin. İçinde 10 örnek ürün bulunmaktadır.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-3 border-violet-300"
                                                    onClick={downloadTemplate}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Şablonu İndir (.csv)
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
                                            <p className="font-medium">2. CSV Dosyanızı Yükleyin</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Sürükle & bırak veya tıklayarak seçin
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Desteklenen formatlar: CSV, Excel (.xlsx, .xls)
                                            </p>
                                        </label>
                                    </div>

                                    {/* İpuçları */}
                                    <div className="bg-muted/50 rounded-lg p-4">
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                            <HelpCircle className="h-4 w-4" />
                                            İpuçları
                                        </h4>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            <li>• Dosya yüklendikten sonra <strong>kolon eşleme</strong> yapabilirsiniz</li>
                                            <li>• <strong>Ad</strong> ve <strong>Fiyat</strong> alanları zorunludur</li>
                                            <li>• Eşlenmeyen kolonlar otomatik "Özel Özellik" olarak eklenir</li>
                                            <li>• Türkçe karakterler ve farklı kolon isimleri desteklenir</li>
                                        </ul>
                                    </div>
                                </>
                            )}

                            {importStatus === 'loading' && (
                                <div className="py-12 text-center">
                                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                                    <p className="font-medium">Ürünler içe aktarılıyor...</p>
                                    <p className="text-sm text-muted-foreground">Lütfen bekleyin</p>
                                </div>
                            )}

                            {importStatus === 'success' && importResult && (
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                                    </div>
                                    <p className="font-medium text-lg">İçe Aktarma Başarılı!</p>
                                    <p className="text-muted-foreground mt-1">
                                        {importResult.success} ürün başarıyla eklendi
                                    </p>
                                </div>
                            )}

                            {importStatus === 'error' && (
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle className="h-8 w-8 text-red-600" />
                                    </div>
                                    <p className="font-medium text-lg">İçe Aktarma Başarısız</p>
                                    <p className="text-muted-foreground mt-1">
                                        Dosyanızı kontrol edip tekrar deneyin
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => setImportStatus('idle')}
                                    >
                                        Tekrar Dene
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
                                            Tüm Ürünleri Dışa Aktar
                                        </h3>
                                        <p className="text-green-700 dark:text-green-300 mt-1">
                                            {productCount > 0
                                                ? `${productCount} ürününüz CSV formatında indirilecek`
                                                : 'Henüz dışa aktarılacak ürün yok'
                                            }
                                        </p>

                                        {productCount > 0 && (
                                            <div className="mt-4 space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Ad, SKU, Açıklama, Fiyat, Stok, Kategori
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Görsel URL'leri dahil
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <strong>Özel özellikler dahil</strong> (Renk, Ağırlık, Malzeme vb.)
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Excel ve Google Sheets uyumlu
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
                                            CSV Olarak İndir
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Export Bilgi */}
                            <div className="bg-muted/50 rounded-lg p-4">
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <HelpCircle className="h-4 w-4" />
                                    Dışa Aktarma Hakkında
                                </h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• Dosya UTF-8 formatında kaydedilir</li>
                                    <li>• Türkçe karakterler korunur</li>
                                    <li>• Excel'de açmak için "UTF-8" encoding seçin</li>
                                    <li>• Google Sheets'te doğrudan açabilirsiniz</li>
                                </ul>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    )
}
