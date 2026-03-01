"use client"

import { Percent, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslation } from "@/lib/contexts/i18n-provider"

interface ProductsBulkActionsBarProps {
    selectedCount: number
    onClearSelection: () => void
    onBulkPriceUpdate: () => void
    onBulkDelete: () => void
    isPending: boolean
}

export function ProductsBulkActionsBar({
    selectedCount,
    onClearSelection,
    onBulkPriceUpdate,
    onBulkDelete,
    isPending
}: ProductsBulkActionsBarProps) {
    const { t } = useTranslation()

    if (selectedCount === 0) return null

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 dark:bg-gray-800 rounded-full shadow-2xl border border-gray-700">
                <span className="text-white font-medium text-sm">
                    {t("products.selected", { count: selectedCount }) as string}
                </span>
                <div className="w-px h-5 bg-gray-600" />
                <div className="flex items-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-3 text-white hover:bg-gray-700 hover:text-white"
                                onClick={onBulkPriceUpdate}
                            >
                                <Percent className="w-4 h-4" />
                                <span className="hidden md:inline ml-2">{t("products.price") as string}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("products.updatePrice") as string}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-3 text-red-400 hover:bg-red-900/50 hover:text-red-300"
                                onClick={onBulkDelete}
                                disabled={isPending}
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden md:inline ml-2">{t("common.delete") as string}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("products.deleteSelected") as string}</TooltipContent>
                    </Tooltip>
                </div>
                <div className="w-px h-5 bg-gray-600" />
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-gray-400 hover:bg-gray-700 hover:text-white rounded-full"
                    onClick={onClearSelection}
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}
