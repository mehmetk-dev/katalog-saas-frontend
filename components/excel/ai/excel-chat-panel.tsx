"use client"

import { useEffect, useRef, useState } from "react"
import { Sparkles } from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import type { ExcelAiIntent, GeneratedProduct } from "@/lib/excel-ai/types"
import { describeOperation as describeOpInline } from "@/lib/excel-ai/operations/registry"
import type { Language } from "@/lib/translations"

import { ChatInput } from "./chat-input"
import { ChatMessageItem } from "./chat-message"
import { PendingIntentCard } from "./pending-intent-card"
import { PendingProductsCard } from "./pending-products-card"
import { QuickPrompts } from "./quick-prompts"
import {
    extractApiError,
    isIntentApiResponse,
    type ApplyResult,
    type ChatMessage,
    type QuickPrompt,
    type QuickPromptPresetId,
    type QuotaInfo,
} from "./types"
import { initialAssistantMessage, useQuickPrompts } from "./use-quick-prompts"

interface ExcelChatPanelProps {
    language: Language
    selectedCount: number
    visibleCount: number
    totalCount: number
    search: string
    onApplyIntent: (intent: ExcelAiIntent) => Promise<ApplyResult>
    onAddGeneratedProducts?: (products: GeneratedProduct[]) => void
    maxProducts?: number
    currentProductCount?: number
}

export function ExcelChatPanel({
    language,
    selectedCount,
    visibleCount,
    totalCount,
    search,
    onApplyIntent,
    onAddGeneratedProducts,
    maxProducts,
    currentProductCount,
}: ExcelChatPanelProps) {
    const [input, setInput] = useState("")
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: crypto.randomUUID(), role: "assistant", content: initialAssistantMessage(language) },
    ])
    const [pendingIntent, setPendingIntent] = useState<ExcelAiIntent | null>(null)
    const [pendingProducts, setPendingProducts] = useState<GeneratedProduct[] | null>(null)
    const [quota, setQuota] = useState<QuotaInfo | null>(null)
    const [selectedPresetId, setSelectedPresetId] = useState<QuickPromptPresetId | null>(null)
    const [showQuickPrompts, setShowQuickPrompts] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isApplying, setIsApplying] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement | null>(null)

    const quickPrompts = useQuickPrompts(language)

    const addMessage = (message: ChatMessage) => {
        setMessages((prev) => [...prev, message])
    }

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }, [messages, pendingIntent, isGenerating, isApplying])

    const sendMessage = async (messageOverride?: string) => {
        const message = (messageOverride ?? input).trim()
        if (!message || isGenerating || isApplying) return

        const presetId = messageOverride ? null : selectedPresetId
        setShowQuickPrompts(false)
        addMessage({ id: crypto.randomUUID(), role: "user", content: message })
        setInput("")
        setSelectedPresetId(null)
        setIsGenerating(true)

        // Last 4 turns (excluding the message we just appended) — keeps follow-ups
        // in context without bloating the prompt. Skip the onboarding message.
        const history = messages
            .slice(1)
            .slice(-4)
            .map((m) => ({ role: m.role, content: m.content }))

        try {
            const response = await fetch("/api/excel-ai/intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    selectedCount,
                    visibleCount,
                    totalCount,
                    search,
                    language,
                    presetId: presetId || undefined,
                    history: history.length > 0 ? history : undefined,
                }),
            })

            const payload = await response.json().catch(() => null)

            if (!response.ok) {
                const apiError = extractApiError(payload)
                const messageText =
                    language === "tr"
                        ? apiError === "Unauthorized"
                            ? "Oturum doğrulaması başarısız oldu. Sayfayı yenileyip tekrar dene."
                            : "Yapay zeka isteği şu anda işlenemedi. Komutu daha net yazarak tekrar deneyebilirsin."
                        : apiError === "Unauthorized"
                            ? "Authentication failed. Refresh the page and try again."
                            : "AI request could not be processed right now. Try again with a clearer command."

                setPendingIntent(null)
                addMessage({ id: crypto.randomUUID(), role: "assistant", content: messageText })
                return
            }

            if (payload && typeof payload === "object" && "_quota" in payload) {
                const q = (payload as { _quota?: QuotaInfo })._quota
                if (q) setQuota(q)
            }

            if (!isIntentApiResponse(payload)) {
                addMessage({
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content:
                        language === "tr"
                            ? "Yanıtı işlerken sorun yaşadım. Komutu yeniden yazıp tekrar dener misin?"
                            : "I had trouble parsing the response. Please try your command again.",
                })
                setPendingIntent(null)
                return
            }

            if (payload.mode === "intent") {
                setPendingIntent(payload.intent)
                setPendingProducts(null)

                const operationSummary = payload.intent.operations
                    .map((op) => `- ${describeOpInline(op, language)}`)
                    .join("\n")
                const header =
                    payload.assistantMessage ||
                    (language === "tr" ? "Önizleme hazır." : "Preview ready.")

                addMessage({
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: `${header}\n${operationSummary}`,
                })
                return
            }

            if (payload.mode === "generate_products") {
                setPendingIntent(null)
                setPendingProducts(payload.products)

                const productList = payload.products
                    .slice(0, 5)
                    .map((p) => `- ${p.name} (${p.category || "-"}) — ${p.price}`)
                    .join("\n")
                const moreText =
                    payload.products.length > 5
                        ? language === "tr"
                            ? `\n... ve ${payload.products.length - 5} ürün daha`
                            : `\n... and ${payload.products.length - 5} more`
                        : ""

                addMessage({
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: `${payload.assistantMessage}\n\n${productList}${moreText}`,
                })
                return
            }

            setPendingIntent(null)
            setPendingProducts(null)

            if (payload.mode === "chat") {
                addMessage({
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: payload.assistantMessage,
                })
                return
            }

            // mode === "clarification": render suggestions as clickable buttons.
            addMessage({
                id: crypto.randomUUID(),
                role: "assistant",
                content: payload.assistantMessage,
                clarificationQuestion: payload.clarificationQuestion,
                suggestions: payload.suggestedCommands?.length ? payload.suggestedCommands : undefined,
            })
        } catch {
            addMessage({
                id: crypto.randomUUID(),
                role: "assistant",
                content:
                    language === "tr"
                        ? "İsteği tam çözemedim. Ne değişmesini istediğini bir örnekle yazar mısın?"
                        : "I could not resolve this request. Can you describe the exact change with an example?",
            })
        } finally {
            setIsGenerating(false)
        }
    }

    const handleApplyIntent = async () => {
        if (!pendingIntent || isApplying) return

        setIsApplying(true)
        try {
            const result = await onApplyIntent(pendingIntent)
            addMessage({
                id: crypto.randomUUID(),
                role: "assistant",
                content:
                    language === "tr"
                        ? `Uygulandı: ${result.targetProducts} ürün üzerinde ${result.changedCells} hücre güncellendi. Kaydetmeden veritabanına yazılmaz.`
                        : `Applied: ${result.changedCells} cells updated across ${result.targetProducts} products. No database writes until Save.`,
            })
            setPendingIntent(null)
        } catch {
            addMessage({
                id: crypto.randomUUID(),
                role: "assistant",
                content:
                    language === "tr"
                        ? "Uygulama sırasında hata oluştu. Komutu daraltıp tekrar deneyebilirsin."
                        : "Failed to apply intent. Try narrowing the command and retry.",
            })
        } finally {
            setIsApplying(false)
        }
    }

    const handleAddGeneratedProducts = () => {
        if (!pendingProducts || !onAddGeneratedProducts) return

        onAddGeneratedProducts(pendingProducts)
        addMessage({
            id: crypto.randomUUID(),
            role: "assistant",
            content:
                language === "tr"
                    ? `${pendingProducts.length} ürün tabloya eklendi. Kaydetmeden veritabanına yazılmaz.`
                    : `${pendingProducts.length} products added to the table. No database writes until Save.`,
        })
        setPendingProducts(null)
    }

    const handleQuickPromptSelect = (prompt: QuickPrompt) => {
        setInput(prompt.text)
        setSelectedPresetId(prompt.id)
        setShowQuickPrompts(false)
    }

    return (
        <div className="flex h-full flex-col bg-background">
            <div className="border-b px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Sparkles className="h-4 w-4" />
                    {language === "tr" ? "AI Toplu İşlem" : "AI Bulk Actions"}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                    {language === "tr"
                        ? "Sohbet eder, önizleme oluşturur ve değişikliği yerelde uygular. Veritabanına sadece Kaydet ile yazar."
                        : "It can chat, build previews, and apply local edits. Database writes only when Save is clicked."}
                </p>
            </div>

            <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-3 p-3">
                    {messages.map((message) => (
                        <ChatMessageItem
                            key={message.id}
                            message={message}
                            language={language}
                            disabled={isGenerating || isApplying}
                            onSuggestionClick={(suggestion) => void sendMessage(suggestion)}
                        />
                    ))}

                    {pendingIntent && (
                        <PendingIntentCard
                            intent={pendingIntent}
                            language={language}
                            selectedCount={selectedCount}
                            visibleCount={visibleCount}
                            totalCount={totalCount}
                            isApplying={isApplying}
                            isGenerating={isGenerating}
                            onApply={() => void handleApplyIntent()}
                            onDismiss={() => setPendingIntent(null)}
                        />
                    )}

                    {pendingProducts && onAddGeneratedProducts && (
                        <PendingProductsCard
                            products={pendingProducts}
                            language={language}
                            isApplying={isApplying}
                            isGenerating={isGenerating}
                            onAdd={handleAddGeneratedProducts}
                            onDismiss={() => setPendingProducts(null)}
                        />
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            <div className="border-t p-3">
                {showQuickPrompts && <QuickPrompts prompts={quickPrompts} onSelect={handleQuickPromptSelect} />}

                <ChatInput
                    language={language}
                    input={input}
                    onInputChange={(value) => {
                        setInput(value)
                        setSelectedPresetId(null)
                    }}
                    onSend={() => void sendMessage()}
                    isGenerating={isGenerating}
                    isApplying={isApplying}
                    selectedCount={selectedCount}
                    visibleCount={visibleCount}
                    totalCount={totalCount}
                    quota={quota}
                    maxProducts={maxProducts}
                    currentProductCount={currentProductCount}
                />
            </div>
        </div>
    )
}

