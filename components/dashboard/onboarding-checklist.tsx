"use client"

import { useState } from "react"
import { CheckCircle2, Circle, ChevronRight, X } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface OnboardingChecklistProps {
    hasProducts: boolean
    hasCatalogs: boolean
}

export function OnboardingChecklist({ hasProducts, hasCatalogs }: OnboardingChecklistProps) {
    const [isVisible, setIsVisible] = useState(true)

    if (!isVisible) return null

    // Adımlar
    const steps = [
        {
            id: "product",
            title: "İlk Ürününü Ekle",
            description: "Kataloğuna eklemek için önce ürünlerini sisteme yükle.",
            cta: "Ürün Ekle",
            href: "/dashboard/products",
            completed: hasProducts,
        },
        {
            id: "catalog",
            title: "Katalog Oluştur",
            description: "Ürünlerini seç ve şablonunu belirleyerek kataloğunu yarat.",
            cta: "Katalog Oluştur",
            href: "/dashboard/builder",
            completed: hasCatalogs,
        },
        {
            id: "share",
            title: "Müşterilerinle Paylaş",
            description: "Kataloğunu PDF indir veya dijital link ile paylaş.",
            cta: "Kataloglara Git",
            href: "/dashboard/catalogs",
            completed: hasCatalogs, // Katalog varsa paylaşılabilir varsayalım
        },
    ]

    const completedCount = steps.filter((s) => s.completed).length
    const progress = (completedCount / steps.length) * 100

    if (completedCount === steps.length) return null // Hepsi bittiyse gösterme

    return (
        <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-100 shadow-sm relative overflow-hidden">
            {/* Dekoratif arka plan */}
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <svg width="200" height="200" viewBox="0 0 100 100" fill="currentColor" className="text-violet-600">
                    <circle cx="50" cy="50" r="40" />
                </svg>
            </div>

            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className="text-lg text-violet-900">Başlangıç Rehberi</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Progress value={progress} className="w-24 h-2 bg-violet-200" />
                        <span>%{Math.round(progress)} tamamlandı</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8" onClick={() => setIsVisible(false)}>
                    <X className="w-4 h-4" />
                </Button>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        className={cn(
                            "flex flex-col gap-3 p-4 rounded-lg border transition-all duration-200",
                            step.completed
                                ? "bg-white/50 border-transparent opacity-60"
                                : "bg-white border-violet-100 shadow-sm hover:shadow-md hover:border-violet-300"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className={cn("p-2 rounded-full", step.completed ? "bg-green-100 text-green-600" : "bg-violet-100 text-violet-600")}>
                                {step.completed ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 flex items-center justify-center font-bold">{index + 1}</div>}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className={cn("font-medium", step.completed && "line-through text-muted-foreground")}>{step.title}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">{step.description}</p>
                        </div>
                        {!step.completed && (
                            <Button size="sm" variant="outline" className="mt-auto w-full group border-violet-200 hover:bg-violet-50 hover:text-violet-700" asChild>
                                <Link href={step.href}>
                                    {step.cta}
                                    <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
