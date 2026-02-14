import { Sparkles } from "lucide-react"
import { TEMPLATES } from "@/lib/constants"
import { TemplatePreviewCard } from "../template-preview-card"
import type { TemplateSectionProps } from "./types"

export function TemplateSection({
    t,
    layout,
    onLayoutChange,
    userPlan,
    onUpgrade,
}: TemplateSectionProps) {
    const handleTemplateSelect = (templateId: string, isPro: boolean) => {
        if (isPro && userPlan === "free") {
            onUpgrade()
            return
        }
        onLayoutChange(templateId)
    }

    return (
        <div className="space-y-6 pt-6 animate-in fade-in duration-700">
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

            <div className="flex overflow-x-auto pb-8 gap-6 snap-x px-4 -mx-4 scrollbar-hide">
                {TEMPLATES.map((tmpl) => (
                    <div key={tmpl.id} className="flex-shrink-0 w-64 snap-center">
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
