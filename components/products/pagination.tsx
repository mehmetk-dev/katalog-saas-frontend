"use client"

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ProductsPaginationProps {
    currentPage: number
    totalPages: number
    itemsPerPage: number
    totalItems: number
    onPageChange: (page: number) => void
    onItemsPerPageChange: (size: number) => void
    pageSizeOptions: number[]
}

export function ProductsPagination({
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    onPageChange,
    onItemsPerPageChange,
    pageSizeOptions
}: ProductsPaginationProps) {
    if (totalPages === 0) return null

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t bg-gradient-to-r from-muted/30 via-transparent to-muted/30 rounded-xl px-4 mt-6">
            {/* Sol: Sayfa bilgisi ve sayfa boyutu */}
            <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{totalItems}</span> ürün içinden{' '}
                    <span className="font-medium text-foreground">
                        {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)}
                    </span> gösteriliyor
                </span>

                {/* Sayfa boyutu seçici */}
                <div className="hidden sm:flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sayfa başına:</span>
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
                    >
                        <SelectTrigger className="h-8 w-[70px] text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {pageSizeOptions.map((size) => (
                                <SelectItem key={size} value={size.toString()}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Sağ: Pagination kontrolleri */}
            {totalPages > 1 && (
                <div className="flex items-center gap-1">
                    {/* İlk Sayfa */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onPageChange(1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>İlk sayfa</TooltipContent>
                    </Tooltip>

                    {/* Önceki Sayfa */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onPageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Önceki sayfa</TooltipContent>
                    </Tooltip>

                    {/* Sayfa numaraları */}
                    <div className="flex items-center gap-1 mx-1">
                        {/* İlk sayfa (uzaksa) */}
                        {currentPage > 3 && totalPages > 5 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 text-xs"
                                    onClick={() => onPageChange(1)}
                                >
                                    1
                                </Button>
                                {currentPage > 4 && (
                                    <span className="text-muted-foreground text-xs px-1">...</span>
                                )}
                            </>
                        )}

                        {/* Orta sayfa numaraları */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number
                            if (totalPages <= 5) {
                                pageNum = i + 1
                            } else if (currentPage <= 3) {
                                pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                            } else {
                                pageNum = currentPage - 2 + i
                            }

                            if (
                                (pageNum === 1 && currentPage > 3 && totalPages > 5) ||
                                (pageNum === totalPages && currentPage < totalPages - 2 && totalPages > 5)
                            ) {
                                return null
                            }

                            return (
                                <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? "default" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        "h-8 w-8 text-xs font-medium transition-all",
                                        currentPage === pageNum && "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25"
                                    )}
                                    onClick={() => onPageChange(pageNum)}
                                >
                                    {pageNum}
                                </Button>
                            )
                        }).filter(Boolean)}

                        {/* Son sayfa (uzaksa) */}
                        {currentPage < totalPages - 2 && totalPages > 5 && (
                            <>
                                {currentPage < totalPages - 3 && (
                                    <span className="text-muted-foreground text-xs px-1">...</span>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 text-xs"
                                    onClick={() => onPageChange(totalPages)}
                                >
                                    {totalPages}
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Sonraki Sayfa */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onPageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Sonraki sayfa</TooltipContent>
                    </Tooltip>

                    {/* Son Sayfa */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onPageChange(totalPages)}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Son sayfa</TooltipContent>
                    </Tooltip>

                    {/* Sayfa numarasına git - masaüstü için */}
                    <div className="hidden md:flex items-center gap-2 ml-3 pl-3 border-l">
                        <span className="text-xs text-muted-foreground">Git:</span>
                        <Input
                            type="number"
                            min={1}
                            max={totalPages}
                            placeholder={currentPage.toString()}
                            className="h-8 w-14 text-xs text-center"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const target = e.target as HTMLInputElement
                                    const page = parseInt(target.value)
                                    if (page >= 1 && page <= totalPages) {
                                        onPageChange(page)
                                        target.value = ''
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
