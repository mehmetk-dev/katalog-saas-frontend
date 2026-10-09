import { LayoutTemplate } from "lucide-react"
import { TEMPLATES } from "@/lib/constants"
import { TemplatePreviewCard } from "@/components/builder/preview/template-preview-card"
import { useDesignProps } from "./design-context"
import { SectionWrapper } from "./section-wrapper"

export function TemplateSection() {
    const { t, layout, onLayoutChange, userPlan, onUpgrade, openSections, toggleSection } = useDesignProps()
    const isOpen = openSections.template ?? true
    const current = TEMPLATES.find((tmpl) => tmpl.id === layout)

    const handleTemplateSelect = (templateId: string, isPro: boolean) => {
        if (isPro && userPlan === "free") {
            onUpgrade()
            return
        }
        onLayoutChange(templateId)
    }

    return (
        <SectionWrapper
            id="template"
            title={
                <span className="flex items-baseline gap-2">
                    {t('builder.templateStyle')}
                    {current && <span className="truncate text-xs font-normal text-muted-foreground">{current.name}</span>}
                </span>
            }
            icon={<LayoutTemplate />}
            isOpen={isOpen}
            onToggle={() => toggleSection('template')}
        >
            <div className="@container custom-scrollbar -mr-2 max-h-[30rem] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-3 @md:grid-cols-3">
                    {TEMPLATES.map((tmpl) => (
                        <TemplatePreviewCard
                            key={tmpl.id}
                            templateId={tmpl.id}
                            templateName={tmpl.name}
                            isPro={tmpl.isPro}
                            isSelected={layout === tmpl.id}
                            onSelect={() => handleTemplateSelect(tmpl.id, tmpl.isPro)}
                        />
                    ))}
                </div>
            </div>
        </SectionWrapper>
    )
}
