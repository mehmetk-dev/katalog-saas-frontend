"use client"

import type { KeyboardEventHandler } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Language } from "@/lib/translations"
import type { QuotaInfo } from "./types"

interface ChatInputProps {
    language: Language
    input: string
    onInputChange: (value: string) => void
    onSend: () => void
    isGenerating: boolean
    isApplying: boolean
    selectedCount: number
    visibleCount: number
    totalCount: number
    quota: QuotaInfo | null
    maxProducts?: number
    currentProductCount?: number
}

export function ChatInput({
    language,
    input,
    onInputChange,
    onSend,
    isGenerating,
    isApplying,
    selectedCount,
    visibleCount,
    totalCount,
    quota,
    maxProducts,
    currentProductCount,
}: ChatInputProps) {
    const onKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            onSend()
        }
    }

    return (
        <>
            <Textarea
                value={input}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={onKeyDown}
                rows={3}
                placeholder={
                    language === "tr"
                        ? "Örn: Seçili ürünlerin fiyatını %10 artır veya kimsin diye sor"
                        : "Example: Increase selected products by 10% or ask who are you"
                }
                className="min-h-20 resize-none text-sm"
                disabled={isGenerating || isApplying}
            />
            <p className="mt-2 text-[11px] text-muted-foreground">
                {language === "tr"
                    ? "İpucu: Ne değişeceğini + kapsamı birlikte yaz. Örn: Seçili ürünlerde fiyatı %10 artır. Belirsiz yazarsan sana netleştirici soru sorarım."
                    : "Tip: Write both scope and action. Example: Increase price by 10% for selected products. If ambiguous, I will ask a follow-up question."}
            </p>

            <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                    {language === "tr" ? "Seçili" : "Selected"}: {selectedCount} |{" "}
                    {language === "tr" ? "Sayfa" : "Page"}: {visibleCount} |{" "}
                    {language === "tr" ? "Toplam" : "Total"}: {totalCount}
                    {quota && (
                        <>
                            {" | "}
                            <span className={quota.remaining <= 5 ? "text-destructive font-medium" : ""}>
                                {language === "tr" ? "Kota" : "Quota"}: {quota.remaining}/{quota.limit}
                            </span>
                        </>
                    )}
                    {maxProducts != null && currentProductCount != null && maxProducts !== Infinity && (
                        <>
                            {" | "}
                            <span className={currentProductCount >= maxProducts ? "text-destructive font-medium" : ""}>
                                {language === "tr" ? "Ürün" : "Products"}: {currentProductCount}/{maxProducts}
                            </span>
                        </>
                    )}
                </span>

                <Button size="sm" onClick={onSend} disabled={!input.trim() || isGenerating || isApplying}>
                    {isGenerating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {language === "tr" ? "Gönder" : "Send"}
                </Button>
            </div>
        </>
    )
}
