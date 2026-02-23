"use client"

import React, { useState, useRef, useEffect } from 'react'
import {
    ShoppingBag,
    Smartphone,
    Sparkles,
    Check,
    ArrowRight,
    Download,
    Share2,
    Undo2,
    Palette,
    Type,
    LayoutTemplate,
    Home,
    Armchair,
    Car,
    Trophy,
    ToyBrick,
    Book,
    Utensils
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { AnimatePresence, motion } from "framer-motion"
import { DEMO_DATA } from "@/lib/demo-data"
import { ModernGridTemplate } from "@/components/catalogs/templates/modern-grid"
import { FashionLookbookTemplate } from "@/components/catalogs/templates/fashion-lookbook"
import { MagazineTemplate } from "@/components/catalogs/templates/magazine"
import { LuxuryTemplate } from "@/components/catalogs/templates/luxury"
import { ClassicCatalogTemplate } from "@/components/catalogs/templates/classic-catalog"
import { BoldTemplate } from "@/components/catalogs/templates/bold"
import { ElegantCardsTemplate } from "@/components/catalogs/templates/elegant-cards"
import { MinimalistTemplate } from "@/components/catalogs/templates/minimalist"
import { ShowcaseTemplate } from "@/components/catalogs/templates/showcase"
import { CatalogProTemplate } from "@/components/catalogs/templates/catalog-pro"

export const INDUSTRIES = [
    { id: 'fashion', name: 'Moda ve Giyim', icon: ShoppingBag, description: 'Giyim, ayakkabı ve aksesuarlar' },
    { id: 'tech', name: 'Teknoloji ve Elektronik', icon: Smartphone, description: 'Elektronik, bilgisayar ve donanım' },
    { id: 'cosmetic', name: 'Güzellik ve Kozmetik', icon: Sparkles, description: 'Cilt bakımı, makyaj ve kişisel bakım' },
    { id: 'home', name: 'Ev ve Yaşam', icon: Home, description: 'Dekorasyon ve ev tekstili' },
    { id: 'furniture', name: 'Mobilya ve Dekorasyon', icon: Armchair, description: 'Konforlu ve şık yaşam alanları' },
    { id: 'automotive', name: 'Otomotiv ve Aksesuar', icon: Car, description: 'Araç içi ekipman ve bakım' },
    { id: 'sports', name: 'Spor ve Outdoor', icon: Trophy, description: 'Kamp ve spor ekipmanları' },
    { id: 'toys', name: 'Oyuncak ve Hobi', icon: ToyBrick, description: 'Eğitici ve eğlenceli setler' },
    { id: 'books', name: 'Kitap ve Kırtasiye', icon: Book, description: 'Ofis ve yaratıcılık araçları' },
    { id: 'food', name: 'Gıda ve Gurme', icon: Utensils, description: 'Yöresel ve gurme lezzetler' },
]

export const TEMPLATES = [
    { id: 'modern-grid', name: 'Modern Izgara', component: ModernGridTemplate, description: 'Temiz ve çok yönlü ızgara düzeni.' },
    { id: 'fashion-lookbook', name: 'Moda Lookbook', component: FashionLookbookTemplate, description: 'Büyük görsellerle dergi stili.' },
    { id: 'magazine', name: 'Magazin', component: MagazineTemplate, description: 'Hikaye odaklı profesyonel mizanpaj.' },
    { id: 'luxury', name: 'Lüks', component: LuxuryTemplate, description: 'Premium, koyu temalı zarafet.' },
    { id: 'classic-catalog', name: 'Klasik', component: ClassicCatalogTemplate, description: 'Geleneksel ve güvenilir yerleşim.' },
    { id: 'bold', name: 'Cesur', component: BoldTemplate, description: 'Güçlü renkler, dikkat çekici stil.' },
    { id: 'elegant-cards', name: 'Zarif Kartlar', component: ElegantCardsTemplate, description: 'Şık kartlarla premium sunum.' },
    { id: 'minimalist', name: 'Minimalist', component: MinimalistTemplate, description: 'Sade, az ama öz tasarım.' },
    { id: 'showcase', name: 'Vitrin', component: ShowcaseTemplate, description: 'Ürünleri ön plana çıkarır.' },
    { id: 'catalog-pro', name: 'Katalog Pro', component: CatalogProTemplate, description: 'Profesyonel iş kataloğu.' },
]

interface DemoBuilderProps {
    isEmbedded?: boolean;
    onFinish?: () => void;
}

export function DemoBuilder({ isEmbedded = false, onFinish }: DemoBuilderProps) {
    // State
    const [step, setStep] = useState(1)
    const [industry, setIndustry] = useState('fashion')
    const [templateId, setTemplateId] = useState('modern-grid')

    // Customization State
    const [catalogName, setCatalogName] = useState('Harika Kataloğum')
    const [primaryColor, setPrimaryColor] = useState('#000000')
    const [headerTextColor, setHeaderTextColor] = useState('#000000')
    const [backgroundColor, setBackgroundColor] = useState('#ffffff')
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [showPrices, setShowPrices] = useState(true)
    const [showDescriptions, setShowDescriptions] = useState(true)

    const previewRef = useRef<HTMLDivElement>(null)

    // Scroll to top on step change (only if not embedded)
    useEffect(() => {
        if (!isEmbedded) window.scrollTo(0, 0)
    }, [step, isEmbedded])

    // Get Current Template Component
    const CurrentTemplate = TEMPLATES.find(t => t.id === templateId)?.component || ModernGridTemplate
    const currentProducts = DEMO_DATA[industry] || []

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
                                    cursor-pointer p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-2 relative overflow-hidden
                                    ${industry === ind.id ? 'border-[#cf1414] bg-red-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}
                                `}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${industry === ind.id ? 'bg-[#cf1414] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <ind.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-[10px] uppercase tracking-tight leading-tight">{ind.name}</h3>
                                    {/* <p className="text-[10px] text-slate-500 font-medium line-clamp-1">{ind.description}</p> */}
                                </div>
                                {industry === ind.id && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-1 right-1 w-4 h-4 bg-[#cf1414] rounded-full flex items-center justify-center text-white"
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
                                    cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col gap-3 relative
                                    ${templateId === tmpl.id ? 'border-[#cf1414] bg-red-50/30 ring-4 ring-red-50' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'}
                                `}
                            >
                                <div className="aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden relative group">
                                    {/* Template Badge */}
                                    <div className="absolute top-2 left-2 z-20">
                                        <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider">
                                            {tmpl.name}
                                        </span>
                                    </div>

                                    {/* Actual Template Mini-Preview */}
                                    <div className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity overflow-hidden pointer-events-none bg-slate-200/30">
                                        <div
                                            className="absolute bg-white shadow-[0_5px_15px_rgba(0,0,0,0.1)] border border-slate-200"
                                            style={{
                                                width: '210mm',
                                                height: '297mm',
                                                top: '50%',
                                                left: '50%',
                                                marginLeft: '-105mm',
                                                marginTop: '-148.5mm',
                                                transform: 'scale(0.14)',
                                                transformOrigin: 'center'
                                            }}
                                        >
                                            <tmpl.component
                                                products={currentProducts.slice(0, 4)}
                                                catalogName={catalogName}
                                                primaryColor={primaryColor}
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

                                    {templateId === tmpl.id && (
                                        <div className="absolute inset-0 bg-[#cf1414]/10 backdrop-blur-[1px] flex items-center justify-center z-30">
                                            <div className="w-10 h-10 bg-white rounded-full shadow-2xl flex items-center justify-center text-[#cf1414] animate-in zoom-in duration-300">
                                                <Check className="w-5 h-5 stroke-[4px]" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="px-1 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-black text-sm uppercase tracking-tighter">{tmpl.name}</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{tmpl.description}</p>
                                    </div>
                                    {templateId === tmpl.id && (
                                        <span className="text-[10px] font-black text-[#cf1414] uppercase">Seçili</span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )
            case 3: // Customization
                return (
                    <div className="space-y-6">
                        <Tabs defaultValue="design" className="w-full">
                            <TabsList className="w-full h-12 grid grid-cols-2 bg-slate-100 p-1 rounded-xl">
                                <TabsTrigger value="design" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <Palette className="w-4 h-4 mr-2" /> Tasarım
                                </TabsTrigger>
                                <TabsTrigger value="content" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <LayoutTemplate className="w-4 h-4 mr-2" /> İçerik
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="design" className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Marka Renkleri</Label>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">Ana Renk</span>
                                                <span className="text-xs text-slate-400 font-medium">{primaryColor}</span>
                                            </div>
                                            <div className="relative group">
                                                <div className="w-12 h-12 rounded-xl shadow-inner border border-white" style={{ backgroundColor: primaryColor }} />
                                                <Input
                                                    type="color"
                                                    value={primaryColor}
                                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">Arka Plan</span>
                                                <span className="text-xs text-slate-400 font-medium">{backgroundColor}</span>
                                            </div>
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-xl shadow-inner border border-white" style={{ backgroundColor: backgroundColor }} />
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
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipografi ve Ölçek</Label>
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-900">Fiyatları Göster</span>
                                            <Switch checked={showPrices} onCheckedChange={setShowPrices} className="data-[state=checked]:bg-[#cf1414]" />
                                        </div>
                                        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                            <span className="text-sm font-bold text-slate-900">Ürün Açıklamaları</span>
                                            <Switch checked={showDescriptions} onCheckedChange={setShowDescriptions} className="data-[state=checked]:bg-[#cf1414]" />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="content" className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Katalog Kimliği</Label>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <span className="text-sm font-bold text-slate-900">Görünen İsim</span>
                                            <Input
                                                value={catalogName}
                                                onChange={(e) => setCatalogName(e.target.value)}
                                                className="h-12 rounded-xl border-slate-200 focus:border-[#cf1414] focus:ring-[#cf1414]/10 font-bold"
                                                placeholder="Örn: Yaz Koleksiyonu 2024"
                                            />
                                        </div>

                                        <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3 hover:border-slate-300 transition-colors cursor-pointer">
                                            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-400">
                                                <Smartphone className="w-5 h-5" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-black uppercase tracking-tight text-slate-900">Marka Logosu Yükle</p>
                                                <p className="text-[10px] text-slate-400 font-medium">PNG, SVG veya JPG (Max 2MB)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )
            case 4: // Final
                return (
                    <div className="flex flex-col items-center justify-center text-center space-y-6 py-10">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                            <Check className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black mb-2">Kataloğunuz Hazır!</h2>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Saniyeler içinde harika bir katalog oluşturdunuz. Bu, Katalog'un yapabileceklerinin sadece küçük bir örneği.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <Button className="gap-2" size="lg">
                                <Download className="w-4 h-4" /> PDF İndir (Demo)
                            </Button>
                            <Button variant="outline" className="gap-2" size="lg">
                                <Share2 className="w-4 h-4" /> Linki Paylaş
                            </Button>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-8 max-w-md">
                            <h4 className="font-bold text-blue-900 mb-1">Bu kataloğu kaydetmek ister misiniz?</h4>
                            <p className="text-sm text-blue-700 mb-3">Çalışmanızı kaydetmek, gerçek ürünler eklemek ve dünyayla paylaşmak için hemen kaydolun.</p>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={onFinish}>Ücretsiz Hesap Oluştur</Button>
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
                    <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border shadow-sm text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        ADIM <span className="text-[#cf1414]">{step}</span> / 4
                    </div>
                </div>
            )}

            {/* Main Layout */}
            <div className={`flex flex-col lg:flex-row ${isEmbedded ? '' : 'flex-1 h-full overflow-hidden'}`}>
                {/* LEFT SIDEBAR - CONTROLS */}
                <div className={`
                    ${isEmbedded ? 'w-full' : 'w-full lg:w-[380px] bg-white border-r z-20'} 
                    flex flex-col h-full
                `}>
                    <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="mb-8">
                            <h1 className="text-2xl font-black mb-2 uppercase tracking-tighter text-slate-900">
                                {step === 1 && "Kategori Seçin"}
                                {step === 2 && "Şablon Seçin"}
                                {step === 3 && "Kataloğu Tasarla"}
                                {step === 4 && "Harika!"}
                            </h1>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                {step === 1 && "İşinize en uygun kategoriyi belirleyin."}
                                {step === 2 && "Marka kimliğinizi yansıtan stili seçin."}
                                {step === 3 && "Detayları marka renklerinize göre uyarlayın."}
                                {step === 4 && "Kataloğunuz başarıyla oluşturuldu."}
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
                        <div className="p-6 border-t bg-slate-50/50 flex-shrink-0">
                            <div className="flex gap-4">
                                {step > 1 && (
                                    <Button variant="outline" onClick={handleBack} className="h-12 px-6 rounded-xl font-bold">
                                        <Undo2 className="w-4 h-4 mr-2" /> Geri
                                    </Button>
                                )}
                                <Button onClick={handleNext} className="h-12 ml-auto flex-1 gap-2 bg-[#cf1414] hover:bg-black text-white shadow-xl shadow-red-500/10 rounded-xl font-black uppercase tracking-tight">
                                    {step === 3 ? "Kataloğu Oluştur" : "Devam Et"} <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT SIDE - PREVIEW */}
                {!isEmbedded && (
                    <div className="flex-1 bg-slate-50 overflow-y-auto flex flex-col items-center p-4 lg:p-8 pb-32 min-h-0 relative">
                        {/* Floating Status Badge (Moved to Side) */}
                        <div className="fixed top-24 right-8 flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full border shadow-sm z-50">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Canlı Önizleme</span>
                        </div>

                        {/* Improved Preview Container (Supports growing content) */}
                        <div
                            className="shrink-0 mb-8 relative"
                            style={{
                                width: '126mm', // Exactly 210mm * 0.6
                                minHeight: '178.2mm', // Exactly 297mm * 0.6
                                height: 'auto'
                            }}
                        >
                            <div
                                ref={previewRef}
                                className="origin-top-left shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden"
                                style={{
                                    backgroundColor,
                                    width: '210mm',
                                    minHeight: '297mm',
                                    height: 'auto',
                                    transform: 'scale(0.6)',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0
                                }}
                            >
                                {/* Actual Preview Content */}
                                <div className="p-4 bg-white h-full overflow-hidden">
                                    <CurrentTemplate
                                        products={currentProducts}
                                        catalogName={catalogName}
                                        primaryColor={primaryColor}
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
                )}
            </div>
        </>
    )

    return content
}
