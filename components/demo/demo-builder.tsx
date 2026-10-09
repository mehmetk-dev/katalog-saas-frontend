"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ShoppingBag,
    Smartphone,
    Sparkles,
    Check,
    ArrowRight,
    Download,
    Undo2,
    Home,
    Armchair,
    Car,
    Trophy,
    ToyBrick,
    Book,
    Utensils,
    Eye,
    Loader2,
    X
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AnimatePresence, motion } from "framer-motion"
import { DEMO_DATA } from "@/lib/demo-data"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { ModernGridTemplate } from "@/components/catalogs/templates/modern-grid"
import { FashionLookbookTemplate } from "@/components/catalogs/templates/fashion-lookbook"
import { MagazineTemplate } from "@/components/catalogs/templates/magazine"
import { LuxuryTemplate } from "@/components/catalogs/templates/luxury"
import { BoldTemplate } from "@/components/catalogs/templates/bold"
import { ElegantCardsTemplate } from "@/components/catalogs/templates/elegant-cards"
import { MinimalistTemplate } from "@/components/catalogs/templates/minimalist"
import { CatalogProTemplate } from "@/components/catalogs/templates/catalog-pro"

// Ad ve açıklamalar çeviride (demoPage.industries / demoPage.templates)
export const INDUSTRIES = [
    { id: 'fashion', icon: ShoppingBag },
    { id: 'tech', icon: Smartphone },
    { id: 'cosmetic', icon: Sparkles },
    { id: 'home', icon: Home },
    { id: 'furniture', icon: Armchair },
    { id: 'automotive', icon: Car },
    { id: 'sports', icon: Trophy },
    { id: 'toys', icon: ToyBrick },
    { id: 'books', icon: Book },
    { id: 'food', icon: Utensils },
]

export const TEMPLATES = [
    { id: 'modern-grid', component: ModernGridTemplate },
    { id: 'fashion-lookbook', component: FashionLookbookTemplate },
    { id: 'magazine', component: MagazineTemplate },
    { id: 'luxury', component: LuxuryTemplate },
    { id: 'bold', component: BoldTemplate },
    { id: 'elegant-cards', component: ElegantCardsTemplate },
    { id: 'minimalist', component: MinimalistTemplate },
    { id: 'catalog-pro', component: CatalogProTemplate },
]

interface DemoBuilderProps {
    isEmbedded?: boolean;
    onFinish?: () => void;
}

export function DemoBuilder({ isEmbedded = false }: DemoBuilderProps) {
    const { t } = useTranslation()
    // State
    const [step, setStep] = useState(1)
    const [industry, setIndustry] = useState('fashion')
    const [templateId, setTemplateId] = useState('modern-grid')

    // Customization State
    const [catalogName, setCatalogName] = useState(() => t('demoPage.defaultName'))
    const [primaryColor, setPrimaryColor] = useState('#000000')
    const [headerTextColor] = useState('#000000')
    const [backgroundColor, setBackgroundColor] = useState('#ffffff')
    const [logoUrl] = useState<string | null>(null)
    const [showPrices, setShowPrices] = useState(true)
    const [showDescriptions, setShowDescriptions] = useState(true)

    const previewRef = useRef<HTMLDivElement>(null)
    const [showMobilePreview, setShowMobilePreview] = useState(false)

    // Scroll to top on step change (only if not embedded)
    useEffect(() => {
        if (!isEmbedded) window.scrollTo(0, 0)
    }, [step, isEmbedded])

    const router = useRouter()

    // Responsive scale
    const [scale, setScale] = useState(0.75)
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) setScale(0.45) // Mobile
            else if (window.innerWidth < 1024) setScale(0.65) // Tablet
            else setScale(0.75) // Desktop
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Get Current Template Component
    const CurrentTemplate = TEMPLATES.find(t => t.id === templateId)?.component || ModernGridTemplate
    const currentProducts = DEMO_DATA[industry] || []

    const [isExporting, setIsExporting] = useState(false)

    const handleDownloadPdf = async () => {
        if (!previewRef.current) return
        setIsExporting(true)
        // Mobilde önizleme gizli (display: none) olduğu için önce açılır; aksi halde PDF boş çıkıyordu
        const wasHidden = previewRef.current.offsetParent === null
        if (wasHidden) {
            setShowMobilePreview(true)
            await new Promise((resolve) => setTimeout(resolve, 300))
        }
        try {
            const node = previewRef.current
            if (!node) throw new Error("preview_missing")
            const { toJpeg } = await import('html-to-image')
            const { default: jsPDF } = await import('jspdf')
            // Önizleme ekrana sığsın diye küçültülmüş; PDF tam boyuttan alınır
            const dataUrl = await toJpeg(node, {
                quality: 0.95,
                pixelRatio: 2,
                backgroundColor,
                style: { transform: 'none' },
            })
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
            pdf.addImage(dataUrl, 'JPEG', 0, 0, 210, 297)
            pdf.save(`${catalogName || 'katalog'}-demo.pdf`)
        } catch (err) {
            console.error('PDF export error:', err)
            toast.error(t('demoPage.pdfFailed'))
        } finally {
            if (wasHidden) setShowMobilePreview(false)
            setIsExporting(false)
        }
    }

    const handleNext = () => setStep(prev => prev + 1)
    const handleBack = () => setStep(prev => prev - 1)

    // Render Steps logic (The complex UI parts)
    const renderStepContent = () => {
        switch (step) {
            case 1: // Industry Selection
                return (
                    <div className="grid grid-cols-2 gap-2">
                        {INDUSTRIES.map((ind) => (
                            <motion.div
                                key={ind.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIndustry(ind.id)}
                                className={`
                                    cursor-pointer p-3 rounded-xl border transition-colors flex flex-col items-center text-center gap-2 relative overflow-hidden
                                    ${industry === ind.id ? 'border-foreground bg-muted' : 'border-border bg-card hover:border-foreground/30'}
                                `}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${industry === ind.id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}>
                                    <ind.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-medium leading-tight">{t(`demoPage.industries.${ind.id}`)}</h3>
                                </div>
                                {industry === ind.id && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-1 right-1 w-4 h-4 bg-foreground rounded-full flex items-center justify-center text-background"
                                    >
                                        <Check className="w-2.5 h-2.5" />
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )
            case 2: // Template Selection
                return (
                    <div className="grid grid-cols-2 gap-4">
                        {TEMPLATES.map((tmpl) => (
                            <motion.div
                                key={tmpl.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setTemplateId(tmpl.id)}
                                className={`
                                    cursor-pointer rounded-xl border transition-colors flex flex-col relative overflow-hidden
                                    ${templateId === tmpl.id ? 'border-foreground ring-1 ring-foreground' : 'border-border bg-card hover:border-foreground/30'}
                                `}
                            >
                                {/* Template Preview - A4 aspect ratio */}
                                <div className="w-full relative overflow-hidden bg-muted/50" style={{ aspectRatio: '210/297' }}>
                                    {/* CSS override: NextImage fill modunun transform:scale altında çalışmamasını düzelt */}
                                    <style>{`
                                        .demo-card-preview img {
                                            position: absolute !important;
                                            width: 100% !important;
                                            height: 100% !important;
                                            inset: 0 !important;
                                        }
                                        .demo-card-preview [data-nimg] {
                                            position: absolute !important;
                                            inset: 0 !important;
                                        }
                                    `}</style>
                                    {/* Auto-scaling preview container */}
                                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                        <div
                                            className="demo-card-preview absolute top-0 left-0 bg-card origin-top-left overflow-hidden"
                                            style={{
                                                width: '794px',
                                                height: '1123px',
                                                transform: 'scale(var(--preview-scale, 0.2))',
                                            }}
                                            ref={(el) => {
                                                if (el && el.parentElement) {
                                                    const parentWidth = el.parentElement.offsetWidth
                                                    const s = parentWidth / 794
                                                    el.style.setProperty('--preview-scale', String(s))
                                                    el.style.transform = `scale(${s})`

                                                    // Force eager loading: NextImage lazy loading çalışmaz transform:scale altında
                                                    requestAnimationFrame(() => {
                                                        el.querySelectorAll('img[loading="lazy"]').forEach(img => {
                                                            img.setAttribute('loading', 'eager')
                                                        })
                                                    })
                                                }
                                            }}
                                        >
                                            <div className="w-full h-full" style={{ width: '794px', height: '1123px' }}>
                                                <tmpl.component
                                                    products={currentProducts.slice(0, 6)}
                                                    catalogName={catalogName}
                                                    primaryColor={primaryColor}
                                                    backgroundColor={backgroundColor}
                                                    headerTextColor={headerTextColor}
                                                    showPrices={showPrices}
                                                    showDescriptions={showDescriptions}
                                                    logoUrl={logoUrl}
                                                    showAttributes={true}
                                                    showSku={true}
                                                    isFreeUser={false}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Selection overlay */}
                                    {templateId === tmpl.id && (
                                        <div className="absolute inset-0 bg-foreground/5 flex items-center justify-center z-30">
                                            <div className="w-10 h-10 bg-card rounded-full shadow-sm flex items-center justify-center text-foreground animate-in zoom-in duration-300">
                                                <Check className="w-5 h-5 stroke-[4px]" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Bottom info bar */}
                                <div className="px-3 py-2.5 flex items-center justify-between border-t border-border">
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold truncate">{t(`demoPage.templates.${tmpl.id}.name`)}</h3>
                                        <p className="text-xs text-muted-foreground truncate">{t(`demoPage.templates.${tmpl.id}.desc`)}</p>
                                    </div>
                                    {templateId === tmpl.id && (
                                        <span className="text-xs font-medium text-foreground shrink-0 ml-2">{t("demoPage.selected")}</span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )
            case 3: // Customization
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <Label className="text-sm font-medium text-foreground">{t("demoPage.identity")}</Label>
                            <div className="space-y-2">
                                <span className="text-sm font-bold text-foreground">{t("demoPage.displayName")}</span>
                                <Input
                                    value={catalogName}
                                    onChange={(e) => setCatalogName(e.target.value)}
                                    className="h-11"
                                    placeholder={t("demoPage.namePlaceholder")}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-sm font-medium text-foreground">{t("demoPage.brandColors")}</Label>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-4 rounded-xl border border-border bg-muted/40 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-foreground">{t("demoPage.primaryColor")}</span>
                                        <span className="text-xs text-muted-foreground font-medium">{primaryColor}</span>
                                    </div>
                                    <div className="relative group">
                                        <div className="w-12 h-12 rounded-xl shadow-inner border border-border" style={{ backgroundColor: primaryColor }} />
                                        <Input
                                            type="color"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-border bg-muted/40 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-foreground">{t("demoPage.background")}</span>
                                        <span className="text-xs text-muted-foreground font-medium">{backgroundColor}</span>
                                    </div>
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-xl shadow-inner border border-border" style={{ backgroundColor: backgroundColor }} />
                                        <Input
                                            type="color"
                                            value={backgroundColor}
                                            onChange={(e) => setBackgroundColor(e.target.value)}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-sm font-medium text-foreground">{t("demoPage.details")}</Label>
                            <div className="p-4 rounded-xl border border-border bg-muted/40 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-foreground">{t("demoPage.showPrices")}</span>
                                    <Switch checked={showPrices} onCheckedChange={setShowPrices} />
                                </div>
                                <div className="flex items-center justify-between border-t border-border pt-4">
                                    <span className="text-sm font-bold text-foreground">{t("demoPage.showDescriptions")}</span>
                                    <Switch checked={showDescriptions} onCheckedChange={setShowDescriptions} />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            case 4: // Final
                return (
                    <div className="flex flex-col items-center justify-center text-center space-y-6 py-10">
                        <div className="w-20 h-20 bg-success-soft text-success rounded-full flex items-center justify-center animate-bounce">
                            <Check className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-semibold tracking-tight mb-2">{t("demoPage.readyTitle")}</h2>
                            <p className="text-muted-foreground max-w-md mx-auto">{t("demoPage.readyDesc")}</p>
                        </div>
                        <div className="flex gap-4">
                            <Button variant="outline" onClick={handleBack} className="gap-2" size="lg">
                                <Undo2 className="w-4 h-4" /> {t("demoPage.back")}
                            </Button>
                            <Button
                                className="gap-2"
                                size="lg"
                                disabled={isExporting}
                                onClick={handleDownloadPdf}
                            >
                                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {t("demoPage.downloadPdf")}
                            </Button>
                        </div>
                        <div className="mt-8 max-w-md rounded-xl border border-border bg-muted/40 p-5">
                            <h4 className="mb-1 font-semibold text-foreground">{t("demoPage.saveTitle")}</h4>
                            <p className="mb-4 text-sm text-muted-foreground">{t("demoPage.saveDesc")}</p>
                            {/* Önceden /auth/register'a gidiyordu; böyle bir sayfa yok (404) */}
                            <Button variant="brand" className="w-full" onClick={() => router.push('/auth?tab=signup')}>{t("demoPage.signup")}</Button>
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    const content = (
        <>
            {/* Step Indicator Overlay */}
            {!isEmbedded && (
                <div className="absolute top-2 right-6 z-40 hidden lg:block">
                    <div className="bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border shadow-sm text-xs font-medium text-muted-foreground">
                        {step} / 4
                    </div>
                </div>
            )}

            {/* Main Layout */}
            <div className={`flex flex-col lg:flex-row ${isEmbedded ? '' : 'flex-1 lg:h-full lg:overflow-hidden overflow-y-auto relative'}`}>
                {/* LEFT SIDEBAR - CONTROLS */}
                <div className={`
                    ${isEmbedded ? 'w-full' : 'w-full lg:w-[380px] bg-card lg:border-r z-20 shrink-0'} 
                    ${showMobilePreview ? 'hidden lg:flex' : 'flex'} flex-col lg:h-full pb-20 lg:pb-0
                `}>
                    <div className="p-4 lg:p-8 lg:overflow-y-auto flex-1 custom-scrollbar">
                        <div className="mb-8">
                            <h1 className="text-2xl font-semibold tracking-tight mb-2 text-foreground">
                                {t(`demoPage.steps.${step}.title`)}
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                {t(`demoPage.steps.${step}.desc`)}
                            </p>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderStepContent()}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer Controls */}
                    {step < 4 && (
                        <div className="p-6 border-t bg-muted/50 flex-shrink-0">
                            <div className="flex gap-4">
                                {step > 1 && (
                                    <Button variant="outline" onClick={handleBack} size="lg" className="h-11 px-3 sm:px-6 shrink-0">
                                        <Undo2 className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">{t("demoPage.back")}</span>
                                    </Button>
                                )}
                                <Button onClick={handleNext} variant="brand" size="lg" className="h-11 w-full flex-1 gap-2">
                                    {step === 3 ? t("demoPage.create") : t("demoPage.next")} <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Mobile Preview Button */}
                    <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
                        <Button
                            onClick={() => setShowMobilePreview(true)}
                            className="w-full h-11 bg-primary text-primary-foreground font-medium rounded-md shadow-sm flex items-center justify-center gap-2 text-base"
                        >
                            <Eye className="w-5 h-5" /> {t("demoPage.preview")}
                        </Button>
                    </div>
                </div>

                {/* RIGHT SIDE - PREVIEW */}
                {!isEmbedded && (
                    <div className={`
                        ${showMobilePreview ? 'fixed inset-0 z-50 bg-muted overflow-auto touch-pan-y flex flex-col items-center justify-center p-4' : 'hidden'} 
                        lg:flex lg:relative lg:flex-1 lg:bg-muted lg:overflow-y-auto flex-col items-center p-4 lg:p-8 lg:pb-32 min-h-0
                    `}>
                        {/* Status Badge */}
                        <div className="hidden lg:flex fixed top-24 right-8 items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-full border shadow-sm z-50">
                            <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                            <span className="text-sm font-medium text-foreground">{t("demoPage.livePreview")}</span>
                        </div>

                        {/* Mobile Close Button */}
                        {showMobilePreview && (
                            <div className="lg:hidden fixed top-4 right-4 z-[60]">
                                <Button variant="secondary" size="icon" aria-label={t("common.close")} className="rounded-full shadow-lg bg-background/80 backdrop-blur-md text-foreground hover:bg-card border border-border w-12 h-12" onClick={() => setShowMobilePreview(false)}>
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                        )}

                        {/* Improved Preview Container (Supports growing content) */}
                        <div className="w-full max-w-full flex justify-center pt-8 lg:pt-0">
                            <div
                                className="shrink-0 mb-8 relative"
                                style={{
                                    width: `${210 * scale}mm`,
                                    height: `${297 * scale}mm`,
                                    overflow: 'hidden'
                                }}
                            >
                                <div
                                    ref={previewRef}
                                    className="origin-top-left shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-border overflow-hidden"
                                    style={{
                                        backgroundColor,
                                        width: '210mm',
                                        height: '297mm',
                                        transform: `scale(${scale})`,
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Actual Preview Content */}
                                    {/* bg-card seçilen arka plan rengini örtüyordu */}
                                    <div className="catalog-light h-full overflow-hidden p-4" style={{ backgroundColor }}>
                                        <CurrentTemplate
                                            products={currentProducts}
                                            catalogName={catalogName}
                                            primaryColor={primaryColor}
                                            backgroundColor={backgroundColor}
                                            headerTextColor={headerTextColor}
                                            showPrices={showPrices}
                                            showDescriptions={showDescriptions}
                                            logoUrl={logoUrl}
                                            showAttributes={true}
                                            showSku={true}
                                            isFreeUser={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )

    return content
}
