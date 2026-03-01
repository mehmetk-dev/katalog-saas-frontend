import React from 'react'
import { Sparkles } from "lucide-react"
import { TEMPLATES } from "@/lib/constants"
import { TemplatePreviewCard } from "@/components/builder/preview/template-preview-card"
import type { TemplateSectionProps } from "./types"

export function TemplateSection({
    t,
    layout,
    onLayoutChange,
    userPlan,
    onUpgrade,
}: TemplateSectionProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null)
    const isDown = React.useRef(false)
    const [isDragging, setIsDragging] = React.useState(false)
    const [startX, setStartX] = React.useState(0)
    const [scrollLeft, setScrollLeft] = React.useState(0)
    const [clickPrevented, setClickPrevented] = React.useState(false)

    // Scrollbar hide styles
    const hideScrollbarStyle = {
        msOverflowStyle: 'none' as const,  /* IE and Edge */
        scrollbarWidth: 'none' as const,  /* Firefox */
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return
        isDown.current = true
        setIsDragging(false)
        setClickPrevented(false)
        setStartX(e.pageX - scrollRef.current.offsetLeft)
        setScrollLeft(scrollRef.current.scrollLeft)
    }

    const handleMouseLeave = () => {
        isDown.current = false
        setIsDragging(false)
    }

    const handleMouseUp = () => {
        isDown.current = false
        setIsDragging(false)
        // Reset click prevention after a short delay to allow click if it wasn't a drag
        setTimeout(() => setClickPrevented(false), 0)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDown.current || !scrollRef.current) return
        e.preventDefault()
        const x = e.pageX - scrollRef.current.offsetLeft
        const walk = (x - startX) * 2 // Scroll-fast

        // If moved significantly, start dragging
        if (Math.abs(walk) > 10) {
            setIsDragging(true)
            setClickPrevented(true)
            scrollRef.current.scrollLeft = scrollLeft - walk
        }
    }

    const handleClickCapture = (e: React.MouseEvent) => {
        if (clickPrevented) {
            e.preventDefault()
            e.stopPropagation()
        }
    }

    const handleTemplateSelect = (templateId: string, isPro: boolean) => {
        if (clickPrevented) return // Don't select if dragging
        if (isPro && userPlan === "free") {
            onUpgrade()
            return
        }
        onLayoutChange(templateId)
    }

    return (
        <div className="space-y-6 pt-6 animate-in fade-in duration-700">
            {/* PERF(F15): CSS moved to globals.css */}

            <div className="flex items-center justify-center gap-3">
                <div className="h-px bg-slate-200 flex-1 hidden sm:block" />
                <div className="flex items-center gap-2 px-6">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200 flex items-center justify-center text-white">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm sm:text-lg font-black uppercase tracking-[0.1em] text-slate-800 dark:text-slate-200">{t('builder.templateStyle') as string}</h3>
                </div>
                <div className="h-px bg-slate-200 flex-1 hidden sm:block" />
            </div>

            <div
                ref={scrollRef}
                className={`flex overflow-x-auto pb-8 gap-6 px-4 -mx-4 hide-scrollbar select-none ${isDragging ? 'dragging-scroll' : 'cursor-grab active:cursor-grabbing'}`}
                style={hideScrollbarStyle}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onClickCapture={handleClickCapture}
            >
                {TEMPLATES.map((tmpl) => (
                    <div key={tmpl.id} className="flex-shrink-0 w-64">
                        <TemplatePreviewCard
                            templateId={tmpl.id}
                            templateName={tmpl.name}
                            isPro={tmpl.isPro}
                            isSelected={layout === tmpl.id}
                            onSelect={() => handleTemplateSelect(tmpl.id, tmpl.isPro)}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
