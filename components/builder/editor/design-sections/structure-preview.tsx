import { ChevronRight, Layout } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import type { StructurePreviewProps } from "./types"

export function StructurePreview({
    enableCoverPage,
    enableCategoryDividers,
    selectedProductCount,
}: StructurePreviewProps) {
    const { t } = useTranslation()

    return (
        <div className="space-y-6 pt-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-center gap-3">
                <div className="h-px bg-accent flex-1 hidden sm:block" />
                <div className="flex items-center gap-2 px-6">
                    <div className="w-10 h-10 rounded-2xl bg-warning shadow-lg shadow-warning/20 flex items-center justify-center text-warning-foreground">
                        <Layout className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm sm:text-lg font-black uppercase tracking-[0.1em] text-foreground dark:text-slate-200">{t("builder.pageStructure")}</h3>
                </div>
                <div className="h-px bg-accent flex-1 hidden sm:block" />
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 snap-x px-4 items-center justify-center max-w-full">
                {/* 1. Cover Page Card */}
                <div className={cn(
                    "flex-shrink-0 w-24 h-32 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-500",
                    enableCoverPage
                        ? "border-primary bg-accent/50 shadow-lg scale-105"
                        : "border-border border-dashed bg-muted/50 opacity-40"
                )}>
                    <div className={cn(
                        "w-7 h-7 rounded-xl flex items-center justify-center text-white text-[10px] font-black shadow-sm",
                        enableCoverPage ? "bg-primary" : "bg-border"
                    )}>01</div>
                    <span className="text-[9px] font-black uppercase tracking-tight text-muted-foreground text-center px-1">{t("builder.coverLabel")}</span>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground/70 shrink-0" />

                {/* 2. Intro/Products Card */}
                <div className="flex-shrink-0 w-24 h-32 rounded-2xl border-2 border-border bg-card shadow-sm flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-10 bg-muted rounded-lg border border-border flex flex-col gap-1 p-1">
                        <div className="w-full h-1/2 bg-accent/50 rounded-sm"></div>
                        <div className="w-full h-1/2 bg-accent/50 rounded-sm"></div>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tight text-muted-foreground text-center px-1">{t("builder.productsLabel")}</span>
                    <span className="text-[8px] text-muted-foreground font-bold">{selectedProductCount} {t("builder.productUnit")}</span>
                </div>

                {enableCategoryDividers && (
                    <>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/70 shrink-0" />
                        <div className="flex-shrink-0 w-24 h-32 rounded-2xl border-2 border-primary bg-accent/50 shadow-lg scale-105 flex flex-col items-center justify-center gap-2 animate-in zoom-in-50 duration-500">
                            <div className="w-7 h-7 rounded-xl bg-primary shadow-sm flex items-center justify-center text-primary-foreground">
                                <Layout className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-tight text-muted-foreground text-center px-1">{t("builder.transitionsLabel")}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
