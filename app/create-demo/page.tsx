
"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Palette,
    Type,
    ArrowRight,
    Check,
    ShoppingBag,
    Smartphone,
    Sparkles,
    Download,
    Share2,
    Undo2,
    LayoutTemplate
} from "lucide-react"
import NextImage from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DEMO_DATA } from "@/lib/demo-data"

// Templates
import { ModernGridTemplate } from "@/components/catalogs/templates/modern-grid"
import { FashionLookbookTemplate } from "@/components/catalogs/templates/fashion-lookbook"
import { MagazineTemplate } from "@/components/catalogs/templates/magazine"
import { LuxuryTemplate } from "@/components/catalogs/templates/luxury"
import { ClassicCatalogTemplate } from "@/components/catalogs/templates/classic-catalog"

const INDUSTRIES = [
    { id: 'fashion', name: 'Fashion & Apparel', icon: ShoppingBag, description: 'Clothing, shoes, accessories' },
    { id: 'tech', name: 'Tech & Gadgets', icon: Smartphone, description: 'Electronics, computers, gear' },
    { id: 'cosmetic', name: 'Beauty & Cosmetics', icon: Sparkles, description: 'Skincare, makeup, wellness' },
]

const TEMPLATES = [
    { id: 'modern-grid', name: 'Modern Grid', component: ModernGridTemplate, description: 'Clean, versatile grid layout.' },
    { id: 'fashion-lookbook', name: 'Fashion Lookbook', component: FashionLookbookTemplate, description: 'Editorial style with large imagery.' },
    { id: 'magazine', name: 'Magazine', component: MagazineTemplate, description: 'Story-driven, journalistic layout.' },
    { id: 'luxury', name: 'Luxury', component: LuxuryTemplate, description: 'Premium, dark-themed elegance.' },
    { id: 'classic-catalog', name: 'Classic', component: ClassicCatalogTemplate, description: 'Traditional, trustworthy layout.' },
]

export default function CreateDemoPage() {
    // State
    const [step, setStep] = useState(1)
    const [industry, setIndustry] = useState('fashion')
    const [templateId, setTemplateId] = useState('modern-grid')

    // Customization State
    const [catalogName, setCatalogName] = useState('My Awesome Catalog')
    const [primaryColor, setPrimaryColor] = useState('#000000')
    const [headerTextColor, setHeaderTextColor] = useState('#000000')
    const [backgroundColor, setBackgroundColor] = useState('#ffffff')
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [showPrices, setShowPrices] = useState(true)
    const [showDescriptions, setShowDescriptions] = useState(true)

    const previewRef = useRef<HTMLDivElement>(null)

    // Scroll to top on step change
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [step])

    // Get Current Template Component
    const CurrentTemplate = TEMPLATES.find(t => t.id === templateId)?.component || ModernGridTemplate
    const currentProducts = DEMO_DATA[industry] || []

    const handleNext = () => setStep(prev => prev + 1)
    const handleBack = () => setStep(prev => prev - 1)

    // Render Steps
    const renderStepContent = () => {
        switch (step) {
            case 1: // Industry Selection
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {INDUSTRIES.map((ind) => (
                            <div
                                key={ind.id}
                                onClick={() => setIndustry(ind.id)}
                                className={`
                                    cursor-pointer p-6 rounded-xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-4 hover:border-black/20 hover:shadow-lg
                                    ${industry === ind.id ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-100 bg-white'}
                                `}
                            >
                                <div className={`p-4 rounded-full ${industry === ind.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    <ind.icon className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{ind.name}</h3>
                                    <p className="text-sm text-slate-500 mt-1">{ind.description}</p>
                                </div>
                                {industry === ind.id && (
                                    <div className="mt-2 text-blue-600 font-bold text-sm flex items-center gap-1">
                                        <Check className="w-4 h-4" /> Selected
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )
            case 2: // Template Selection
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {TEMPLATES.map((tmpl) => (
                            <div
                                key={tmpl.id}
                                onClick={() => setTemplateId(tmpl.id)}
                                className={`
                                    cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 flex flex-col gap-3 hover:border-black/20 hover:shadow-lg
                                    ${templateId === tmpl.id ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-100 bg-white'}
                                `}
                            >
                                <div className="aspect-[4/3] bg-slate-200 rounded-lg overflow-hidden relative">
                                    {/* Mini Preview Placeholder */}
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest">
                                        {tmpl.name} Preview
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold">{tmpl.name}</h3>
                                    <p className="text-xs text-slate-500">{tmpl.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            case 3: // Customization
                return (
                    <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label>Catalog Name</Label>
                                <Input
                                    value={catalogName}
                                    onChange={(e) => setCatalogName(e.target.value)}
                                    className="font-bold text-lg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Primary Color</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded border" style={{ backgroundColor: primaryColor }} />
                                        <Input
                                            type="color"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="w-full h-10 p-1 cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Header Text Color</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded border" style={{ backgroundColor: headerTextColor }} />
                                        <Input
                                            type="color"
                                            value={headerTextColor}
                                            onChange={(e) => setHeaderTextColor(e.target.value)}
                                            className="w-full h-10 p-1 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Background Color</Label>
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded border" style={{ backgroundColor: backgroundColor }} />
                                    <Input
                                        type="color"
                                        value={backgroundColor}
                                        onChange={(e) => setBackgroundColor(e.target.value)}
                                        className="w-full h-10 p-1 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-2 border-t mt-2">
                                <Label className="cursor-pointer" htmlFor="showPrices">Show Prices</Label>
                                <Switch id="showPrices" checked={showPrices} onCheckedChange={setShowPrices} />
                            </div>

                            <div className="flex items-center justify-between py-2 border-t">
                                <Label className="cursor-pointer" htmlFor="showDesc">Show Descriptions</Label>
                                <Switch id="showDesc" checked={showDescriptions} onCheckedChange={setShowDescriptions} />
                            </div>
                        </div>
                    </div>
                )
            case 4: // Final
                return (
                    <div className="flex flex-col items-center justify-center text-center space-y-6 py-10">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                            <Check className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black mb-2">Your Catalog is Ready!</h2>
                            <p className="text-slate-500 max-w-md mx-auto">
                                You've created a stunning catalog in seconds. This is just a preview of what Katalog can do.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <Button className="gap-2" size="lg">
                                <Download className="w-4 h-4" /> Download PDF (Demo)
                            </Button>
                            <Button variant="outline" className="gap-2" size="lg">
                                <Share2 className="w-4 h-4" /> Share Link
                            </Button>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-8 max-w-md">
                            <h4 className="font-bold text-blue-900 mb-1">Want to save this catalog?</h4>
                            <p className="text-sm text-blue-700 mb-3">Sign up now to save your work, add real products, and publish to the world.</p>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Create Free Account</Button>
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Navbar */}
            <header className="bg-white border-b h-16 flex items-center px-6 sticky top-0 z-50 justify-between">
                <div className="flex items-center gap-2 font-black text-xl tracking-tight">
                    <span className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-lg">K</span>
                    Katalog Demo
                </div>
                <div className="text-sm font-medium text-slate-500">
                    Step {step} of 4
                </div>
            </header>

            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-64px)]">
                {/* LEFT SIDEBAR - CONTROLS */}
                <div className="w-full lg:w-[450px] bg-white border-r overflow-y-auto flex flex-col shadow-xl z-20">
                    <div className="p-8 flex-1">
                        <div className="mb-8">
                            <h1 className="text-3xl font-black mb-2">
                                {step === 1 && "Choose Your Industry"}
                                {step === 2 && "Pick a Style"}
                                {step === 3 && "Customize It"}
                                {step === 4 && "Ready to Launch!"}
                            </h1>
                            <p className="text-slate-500">
                                {step === 1 && "Select the category that best fits your products."}
                                {step === 2 && "Select a template that matches your brand identity."}
                                {step === 3 && "Make it yours with colors, fonts, and settings."}
                                {step === 4 && "Your catalog is generated and ready to go."}
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
                        <div className="p-6 border-t bg-slate-50 sticky bottom-0">
                            <div className="flex gap-4">
                                {step > 1 && (
                                    <Button variant="outline" onClick={handleBack} className="gap-2">
                                        <Undo2 className="w-4 h-4" /> Back
                                    </Button>
                                )}
                                <Button onClick={handleNext} className="ml-auto w-full gap-2 bg-black hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20">
                                    {step === 3 ? "Generate Catalog" : "Continue"} <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT MAIN - PREVIEW */}
                <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col">
                    {/* Preview Toolbar */}
                    <div className="h-10 bg-white border-b flex items-center justify-between px-4 text-xs font-mono text-slate-400">
                        <span>LIVE PREVIEW</span>
                        <span>{templateId} • {industry}</span>
                    </div>

                    {/* Catalog Container */}
                    <div className="flex-1 overflow-auto p-4 lg:p-10 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
                        <div
                            ref={previewRef}
                            className="w-full max-w-[1000px] aspect-[1.414/1] bg-white shadow-2xl rounded-sm overflow-hidden ring-1 ring-black/5 transform transition-all duration-500 origin-center scale-[0.8] lg:scale-100 hover:scale-[1.02]"
                        >
                            <CurrentTemplate
                                catalogName={catalogName}
                                products={currentProducts}
                                primaryColor={primaryColor}
                                headerTextColor={headerTextColor}
                                backgroundColor={backgroundColor}
                                showPrices={showPrices}
                                showDescriptions={showDescriptions}
                                showAttributes={true}
                                showSku={true}
                                showUrls={false}
                                isFreeUser={false}
                                pageNumber={1}
                                totalPages={1}
                                columnsPerRow={2}
                                productImageFit="cover"
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
