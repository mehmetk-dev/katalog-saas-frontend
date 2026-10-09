"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowRight,
    Armchair,
    Book,
    Car,
    Check,
    Download,
    Eye,
    Home,
    Loader2,
    ShoppingBag,
    Smartphone,
    Sparkles,
    ToyBrick,
    Trophy,
    Undo2,
    Utensils,
    X,
} from "lucide-react"
import { toast } from "sonner"

import {
    buildInitialCatalogState,
    createDraftSetters,
    normalizeColumnsPerRow,
    toDraft,
    type CatalogDraft,
} from "@/components/builder/builder-utils"
import {
    AppearanceSection,
    BackgroundSection,
    BrandingSection,
    StorytellingSection,
    TemplateSection,
} from "@/components/builder/editor/design-sections"
import { DesignToolsProvider, type DesignSource } from "@/components/builder/editor/design-sections/design-context"
import { CatalogPreview } from "@/components/builder/preview/catalog-preview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { DEMO_DATA } from "@/lib/demo-data"
import { cn } from "@/lib/utils"

/*
 * Giriş yapmadan katalog deneme sayfası. Builder'ın gerçek parçalarını kullanır: şablon ve tasarım
 * bölümleri (design-sections) ve önizleme (CatalogPreview, sayfalama dahil). Önceden demo kendi
 * 8 şablonluk listesini, ayar formunu ve tek sayfalık önizlemesini ayrıca taşıyordu; builder'a
 * eklenen hiçbir şey demoya yansımıyordu.
 *
 * Fark: taslak sayfada tutulur (kaydedilmez) ve yüklenen görseller sunucuya gitmez.
 */

// Ad ve açıklamalar çeviride (demoPage.industries)
export const INDUSTRIES = [
    { id: "fashion", icon: ShoppingBag },
    { id: "tech", icon: Smartphone },
    { id: "cosmetic", icon: Sparkles },
    { id: "home", icon: Home },
    { id: "furniture", icon: Armchair },
    { id: "automotive", icon: Car },
    { id: "sports", icon: Trophy },
    { id: "toys", icon: ToyBrick },
    { id: "books", icon: Book },
    { id: "food", icon: Utensils },
]

const LAST_STEP = 4

interface DemoBuilderProps {
    isEmbedded?: boolean
}

function useDemoDraft(initialName: string) {
    const [draft, setDraft] = useState<CatalogDraft>(() => ({
        ...toDraft(buildInitialCatalogState(null)),
        catalogName: initialName,
    }))
    const edit = useCallback((patch: Partial<CatalogDraft>) =>
        setDraft((current) => {
            const next = { ...current, ...patch }
            // Builder ile aynı: şablon değişince sütun sayısı uyumlu hale getirilir
            if (patch.layout !== undefined && patch.columnsPerRow === undefined) {
                next.columnsPerRow = normalizeColumnsPerRow(patch.layout, current.columnsPerRow)
            }
            return next
        }), [])
    const setters = useMemo(() => createDraftSetters(edit), [edit])
    return { draft, setters, edit }
}

export function DemoBuilder({ isEmbedded = false }: DemoBuilderProps) {
    const { t } = useTranslation()
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [industry, setIndustry] = useState("fashion")
    const [showMobilePreview, setShowMobilePreview] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const exportRef = useRef<HTMLDivElement>(null)

    const { draft, setters, edit } = useDemoDraft(t("demoPage.defaultName"))
    const products = useMemo(() => DEMO_DATA[industry] || [], [industry])

    const source = useMemo<DesignSource>(() => ({
        draft,
        setters,
        edit,
        products,
        // Demoda tüm şablonlar denenebilir
        userPlan: "pro",
        onUpgrade: () => undefined,
    }), [draft, setters, edit, products])

    const previewProps = {
        catalogName: draft.catalogName,
        products,
        layout: draft.layout,
        primaryColor: draft.primaryColor,
        headerTextColor: draft.headerTextColor,
        showPrices: draft.showPrices,
        showDescriptions: draft.showDescriptions,
        showAttributes: draft.showAttributes,
        showSku: draft.showSku,
        showUrls: draft.showUrls,
        productImageFit: draft.productImageFit,
        columnsPerRow: draft.columnsPerRow,
        backgroundColor: draft.backgroundColor,
        backgroundImage: draft.backgroundImage,
        backgroundImageFit: draft.backgroundImageFit,
        backgroundGradient: draft.backgroundGradient,
        logoUrl: draft.logoUrl ?? undefined,
        logoPosition: draft.logoPosition ?? undefined,
        logoSize: draft.logoSize,
        titlePosition: draft.titlePosition,
        enableCoverPage: draft.enableCoverPage,
        coverImageUrl: draft.coverImageUrl ?? undefined,
        coverDescription: draft.coverDescription ?? undefined,
        enableCategoryDividers: draft.enableCategoryDividers,
        categoryOrder: draft.categoryOrder,
        theme: draft.coverTheme,
        isFreeUser: false,
    }

    // PDF: önizleme ekran dışında "dışa aktarma" modunda (tüm sayfalar, tam boyut) çizilir, her
    // sayfa yakalanıp tek PDF'e eklenir — builder'daki çok sayfalı çıktının aynısı
    const handleDownloadPdf = useCallback(async () => {
        setIsExporting(true)
        try {
            await new Promise((resolve) => setTimeout(resolve, 800))
            const container = exportRef.current
            const pages = container ? Array.from(container.querySelectorAll<HTMLElement>(".catalog-page")) : []
            if (pages.length === 0) throw new Error("no_pages")
            const { toJpeg } = await import("html-to-image")
            const { default: jsPDF } = await import("jspdf")
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
            for (const [index, page] of pages.entries()) {
                const dataUrl = await toJpeg(page, { quality: 0.92, pixelRatio: 2, backgroundColor: "#ffffff" })
                if (index > 0) pdf.addPage()
                pdf.addImage(dataUrl, "JPEG", 0, 0, 210, 297)
            }
            pdf.save(`${draft.catalogName || "katalog"}-demo.pdf`)
        } catch (error) {
            console.error("Demo PDF export error:", error)
            toast.error(t("demoPage.pdfFailed"))
        } finally {
            setIsExporting(false)
        }
    }, [draft.catalogName, t])

    const stepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="grid grid-cols-2 gap-2">
                        {INDUSTRIES.map((ind) => {
                            const selected = industry === ind.id
                            return (
                                <button
                                    key={ind.id}
                                    type="button"
                                    onClick={() => setIndustry(ind.id)}
                                    aria-pressed={selected}
                                    className={cn(
                                        "relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors",
                                        selected ? "border-foreground bg-muted" : "border-border bg-card hover:border-foreground/30",
                                    )}
                                >
                                    <span className={cn("flex size-10 items-center justify-center rounded-lg", selected ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
                                        <ind.icon className="size-5" />
                                    </span>
                                    <span className="text-xs font-medium leading-tight">{t(`demoPage.industries.${ind.id}`)}</span>
                                    {selected ? (
                                        <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-foreground text-background">
                                            <Check className="size-2.5" />
                                        </span>
                                    ) : null}
                                </button>
                            )
                        })}
                    </div>
                )
            case 2:
                return <TemplateSection />
            case 3:
                return (
                    <div className="space-y-3">
                        <div className="space-y-2 rounded-xl border bg-card p-4">
                            <Label htmlFor="demo-catalog-name">{t("demoPage.displayName")}</Label>
                            <Input
                                id="demo-catalog-name"
                                value={draft.catalogName}
                                onChange={(e) => setters.setCatalogName(e.target.value)}
                                placeholder={t("demoPage.namePlaceholder")}
                                maxLength={100}
                            />
                        </div>
                        <AppearanceSection />
                        <BrandingSection />
                        <BackgroundSection />
                        <StorytellingSection />
                    </div>
                )
            default:
                return (
                    <div className="flex flex-col items-center gap-6 py-6 text-center">
                        <span className="flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
                            <Check className="size-8" />
                        </span>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-semibold tracking-tight">{t("demoPage.readyTitle")}</h2>
                            <p className="mx-auto max-w-md text-sm text-muted-foreground">{t("demoPage.readyDesc")}</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep(LAST_STEP - 1)}>
                                <Undo2 className="size-4" /> {t("demoPage.back")}
                            </Button>
                            <Button onClick={handleDownloadPdf} disabled={isExporting}>
                                {isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                                {t("demoPage.downloadPdf")}
                            </Button>
                        </div>
                        <div className="w-full max-w-md rounded-xl border border-border bg-muted/40 p-5 text-left">
                            <h3 className="mb-1 font-semibold text-foreground">{t("demoPage.saveTitle")}</h3>
                            <p className="mb-4 text-sm text-muted-foreground">{t("demoPage.saveDesc")}</p>
                            <Button variant="brand" className="w-full" onClick={() => router.push("/auth?tab=signup")}>
                                {t("demoPage.signup")}
                            </Button>
                        </div>
                    </div>
                )
        }
    }

    return (
        <DesignToolsProvider source={source} uploadMode="local">
            <div className={cn("flex flex-col lg:flex-row", !isEmbedded && "relative min-h-0 flex-1 lg:h-full lg:overflow-hidden")}>
                {/* Sol: adımlar */}
                <div
                    className={cn(
                        isEmbedded ? "w-full" : "w-full shrink-0 bg-card lg:w-[420px] lg:border-r",
                        showMobilePreview ? "hidden lg:flex" : "flex",
                        "flex-col pb-20 lg:h-full lg:pb-0",
                    )}
                >
                    <div className="custom-scrollbar flex-1 p-4 lg:overflow-y-auto lg:p-6">
                        <div className="mb-6 space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">{step} / {LAST_STEP}</p>
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t(`demoPage.steps.${step}.title`)}</h1>
                            <p className="text-sm text-muted-foreground">{t(`demoPage.steps.${step}.desc`)}</p>
                        </div>
                        {stepContent()}
                    </div>

                    {step < LAST_STEP ? (
                        <div className="flex shrink-0 gap-3 border-t bg-muted/40 p-4">
                            {step > 1 ? (
                                <Button variant="outline" size="lg" className="h-11 shrink-0" onClick={() => setStep((s) => s - 1)}>
                                    <Undo2 className="size-4" />
                                    <span className="hidden sm:inline">{t("demoPage.back")}</span>
                                </Button>
                            ) : null}
                            <Button variant="brand" size="lg" className="h-11 flex-1" onClick={() => setStep((s) => s + 1)}>
                                {step === LAST_STEP - 1 ? t("demoPage.create") : t("demoPage.next")}
                                <ArrowRight className="size-4" />
                            </Button>
                        </div>
                    ) : null}

                    {/* Mobil: önizlemeyi aç */}
                    {!isEmbedded ? (
                        <div className="fixed inset-x-4 bottom-4 z-40 lg:hidden">
                            <Button className="h-11 w-full" onClick={() => setShowMobilePreview(true)}>
                                <Eye className="size-4" /> {t("demoPage.preview")}
                            </Button>
                        </div>
                    ) : null}
                </div>

                {/* Sağ: builder'ın gerçek önizlemesi */}
                {!isEmbedded ? (
                    <div className={cn(showMobilePreview ? "fixed inset-0 z-50 flex flex-col bg-muted" : "hidden", "lg:relative lg:flex lg:min-h-0 lg:flex-1 lg:flex-col")}>
                        {showMobilePreview ? (
                            // Önizleme araç çubuğundaki düğmelerin üstüne binmesin diye altta
                            <div className="fixed inset-x-4 bottom-4 z-[60] lg:hidden">
                                <Button variant="secondary" className="h-11 w-full shadow-md" onClick={() => setShowMobilePreview(false)}>
                                    <X className="size-4" /> {t("common.close")}
                                </Button>
                            </div>
                        ) : null}
                        <CatalogPreview {...previewProps} />
                    </div>
                ) : null}
            </div>

            {/* PDF için ekran dışında, tam boyutlu tüm sayfalar */}
            {isExporting ? (
                <div ref={exportRef} aria-hidden className="pointer-events-none fixed left-[-10000px] top-0">
                    <CatalogPreview {...previewProps} isExporting />
                </div>
            ) : null}
        </DesignToolsProvider>
    )
}
