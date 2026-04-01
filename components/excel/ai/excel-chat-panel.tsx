"use client"

import { useEffect, useMemo, useRef, useState, type KeyboardEventHandler } from "react"
import { Bot, Loader2, Send, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import type { ExcelAiIntent, ExcelAiOperation, GeneratedProduct } from "@/lib/excel-ai/types"
import type { Language } from "@/lib/translations"

interface ApplyResult {
  changedCells: number
  targetProducts: number
}

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

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

type QuickPromptPresetId =
  | "intro_capabilities"
  | "increase_selected_price_10"
  | "map_all_to_existing_categories"
  | "set_all_stock_zero"

interface QuickPrompt {
  id: QuickPromptPresetId
  text: string
}

interface QuotaInfo {
  remaining: number
  limit: number
}

type IntentApiResponse =
  | {
    mode: "intent"
    intent: ExcelAiIntent
    assistantMessage?: string
    _quota?: QuotaInfo
  }
  | {
    mode: "chat"
    assistantMessage: string
    capabilities?: string[]
    _quota?: QuotaInfo
  }
  | {
    mode: "clarification"
    assistantMessage: string
    clarificationQuestion: string
    suggestedCommands?: string[]
    _quota?: QuotaInfo
  }
  | {
    mode: "generate_products"
    assistantMessage: string
    products: GeneratedProduct[]
    _quota?: QuotaInfo
  }

function isIntentApiResponse(payload: unknown): payload is IntentApiResponse {
  if (!payload || typeof payload !== "object") return false
  if (!("mode" in payload)) return false
  const mode = (payload as { mode?: unknown }).mode
  return mode === "intent" || mode === "chat" || mode === "clarification" || mode === "generate_products"
}

function extractApiError(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null
  if (!("error" in payload)) return null

  const errorValue = (payload as { error?: unknown }).error
  return typeof errorValue === "string" && errorValue.trim().length > 0 ? errorValue : null
}

function getScopeLabel(scope: ExcelAiIntent["scope"], language: Language): string {
  if (language === "tr") {
    if (scope === "selected") return "Seçili"
    if (scope === "all") return "Tüm ürünler"
    return "Mevcut sayfa"
  }

  if (scope === "selected") return "Selected"
  if (scope === "all") return "All products"
  return "Current page"
}

function describeOperation(op: ExcelAiOperation, language: Language): string {
  if (op.type === "set") {
    return language === "tr" ? `${op.field} alanını ${String(op.value)} yap` : `Set ${op.field} to ${String(op.value)}`
  }

  if (op.type === "multiply") {
    return language === "tr" ? `${op.field} alanını x${op.value} ile çarp` : `Multiply ${op.field} by x${op.value}`
  }

  if (op.type === "append_text") {
    return language === "tr" ? `${op.field} sonuna metin ekle` : `Append text to ${op.field}`
  }

  if (op.type === "prepend_text") {
    return language === "tr" ? `${op.field} başına metin ekle` : `Prepend text to ${op.field}`
  }

  if (op.type === "generate_description") {
    return language === "tr" ? "Ürün adına göre açıklama üret" : "Generate description from product name"
  }

  if (op.type === "generate_category") {
    return language === "tr" ? "Mevcut kategorilere akıllı yerleştir" : "Map into existing categories"
  }

  if (op.type === "generate_sku") {
    return language === "tr" ? "Rastgele SKU öner" : "Generate random SKU"
  }

  if (op.type === "generate_price") {
    return language === "tr" ? "Ortalama fiyat hesapla" : "Generate average price"
  }

  if (op.type === "enrich_description") {
    return language === "tr" ? "Mevcut açıklamaları zenginleştir" : "Enrich existing descriptions"
  }

  if (op.type === "fix_name") {
    return language === "tr" ? "Ürün adlarını düzelt" : "Fix product names"
  }

  if (op.type === "translate") {
    const targetLabel = op.targetLanguage === "tr" ? (language === "tr" ? "Türkçe" : "Turkish") : (language === "tr" ? "İngilizce" : "English")
    return language === "tr" ? `${op.field} alanını ${targetLabel}'ye çevir` : `Translate ${op.field} to ${targetLabel}`
  }

  if (op.type === "round_price") {
    const strategyLabel = op.strategy === "charm"
      ? (language === "tr" ? "psikolojik" : "charm")
      : op.strategy === "floor"
        ? (language === "tr" ? "aşağı" : "floor")
        : (language === "tr" ? "en yakın" : "nearest")
    return language === "tr" ? `Fiyatları yuvarla (${strategyLabel})` : `Round prices (${strategyLabel})`
  }

  if (op.type === "fill_empty") {
    return language === "tr" ? `Boş ${op.field} alanlarını doldur` : `Fill empty ${op.field} fields`
  }

  return language === "tr" ? `${op.field} alanını temizle` : `Clear ${op.field}`
}

function estimateTargetCount(scope: ExcelAiIntent["scope"], selectedCount: number, visibleCount: number, totalCount: number): number {
  if (scope === "selected") return selectedCount
  if (scope === "all") return totalCount
  return visibleCount
}

function initialAssistantMessage(language: Language): string {
  if (language === "tr") {
    return [
      "Ben FogCatalog Yapay Zeka Asistanıyım.",
      "Bu panelde sadece mevcut ürünler için toplu düzenleme önizlemesi oluştururum.",
      "Kapsamı yaz: seçili, mevcut sayfa veya tüm ürünler.",
      "Örnek: tüm ürünlere SKU üret, seçili ürünlerin fiyatını %10 artır, ürün adına göre açıklama üret.",
      "Not: Değişiklikleri önce yerelde uygularım, veritabanına sadece Kaydet ile yazarım.",
    ].join("\n")
  }

  return [
    "I am the FogCatalog AI Assistant.",
    "You can chat naturally or ask for bulk edits.",
    "Example: Increase selected products by 10%, who are you, what can you do?",
    "Note: edits stay local until Save.",
  ].join("\n")
}

function buildChatModeMessage(payload: Extract<IntentApiResponse, { mode: "chat" }>): string {
  return payload.assistantMessage
}

function buildClarificationMessage(payload: Extract<IntentApiResponse, { mode: "clarification" }>, language: Language): string {
  const suggestionTitle = language === "tr" ? "Örnek komutlar:" : "Example commands:"
  const suggestions =
    payload.suggestedCommands && payload.suggestedCommands.length > 0
      ? `\n\n${suggestionTitle}\n${payload.suggestedCommands.map((item) => `- ${item}`).join("\n")}`
      : ""

  return `${payload.assistantMessage}\n${payload.clarificationQuestion}${suggestions}`
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
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: initialAssistantMessage(language),
    },
  ])
  const [pendingIntent, setPendingIntent] = useState<ExcelAiIntent | null>(null)
  const [pendingProducts, setPendingProducts] = useState<GeneratedProduct[] | null>(null)
  const [quota, setQuota] = useState<QuotaInfo | null>(null)
  const [selectedPresetId, setSelectedPresetId] = useState<QuickPromptPresetId | null>(null)
  const [showQuickPrompts, setShowQuickPrompts] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const quickPrompts = useMemo<QuickPrompt[]>(() => {
    if (language === "tr") {
      return [
        { id: "intro_capabilities", text: "Kimsin ve neler yapabiliyorsun?" },
        { id: "increase_selected_price_10", text: "Seçili ürünlerin fiyatını %10 artır" },
        { id: "map_all_to_existing_categories", text: "Tüm ürünleri mevcut kategorilere akıllı şekilde yerleştir" },
      ]
    }

    return [
      { id: "intro_capabilities", text: "Who are you and what can you do?" },
      { id: "increase_selected_price_10", text: "Increase selected products' price by 10%" },
      { id: "set_all_stock_zero", text: "Set stock to 0 for all products" },
    ]
  }, [language])

  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message])
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, pendingIntent, isGenerating, isApplying])

  const handleGenerateIntent = async () => {
    const message = input.trim()
    if (!message || isGenerating || isApplying) return

    const presetId = selectedPresetId
    setShowQuickPrompts(false)
    addMessage({ id: crypto.randomUUID(), role: "user", content: message })
    setInput("")
    setSelectedPresetId(null)
    setIsGenerating(true)

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
        const messageText =
          language === "tr"
            ? "Yanıtı işlerken sorun yaşadım. Komutu yeniden yazıp tekrar dener misin?"
            : "I had trouble parsing the response. Please try your command again."

        setPendingIntent(null)
        addMessage({ id: crypto.randomUUID(), role: "assistant", content: messageText })
        return
      }

      if (payload.mode === "intent") {
        setPendingIntent(payload.intent)
        setPendingProducts(null)

        const scopeLabel = getScopeLabel(payload.intent.scope, language)
        const operationSummary = payload.intent.operations.map((op) => `- ${describeOperation(op, language)}`).join("\n")
        const header =
          payload.assistantMessage ||
          (language === "tr"
            ? `Önizleme hazır. Kapsam: ${scopeLabel}. İşlemler:`
            : `Preview ready. Scope: ${scopeLabel}. Operations:`)

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
          content: buildChatModeMessage(payload),
        })
        return
      }

      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: buildClarificationMessage(payload, language),
      })
    } catch {
      const messageText =
        language === "tr"
          ? "İsteği tam çözemedim. Ne değişmesini istediğini bir örnekle yazar mısın?"
          : "I could not resolve this request. Can you describe the exact change with an example?"

      addMessage({ id: crypto.randomUUID(), role: "assistant", content: messageText })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApplyIntent = async () => {
    if (!pendingIntent || isApplying) return

    setIsApplying(true)
    try {
      const result = await onApplyIntent(pendingIntent)
      const successMessage =
        language === "tr"
          ? `Uygulandı: ${result.targetProducts} ürün üzerinde ${result.changedCells} hücre güncellendi. Kaydetmeden veritabanına yazılmaz.`
          : `Applied: ${result.changedCells} cells updated across ${result.targetProducts} products. No database writes until Save.`

      addMessage({ id: crypto.randomUUID(), role: "assistant", content: successMessage })
      setPendingIntent(null)
    } catch {
      const failMessage =
        language === "tr"
          ? "Uygulama sırasında hata oluştu. Komutu daraltıp tekrar deneyebilirsin."
          : "Failed to apply intent. Try narrowing the command and retry."

      addMessage({ id: crypto.randomUUID(), role: "assistant", content: failMessage })
    } finally {
      setIsApplying(false)
    }
  }

  const handleAddGeneratedProducts = () => {
    if (!pendingProducts || !onAddGeneratedProducts) return

    onAddGeneratedProducts(pendingProducts)

    const successMessage =
      language === "tr"
        ? `${pendingProducts.length} ürün tabloya eklendi. Kaydetmeden veritabanına yazılmaz.`
        : `${pendingProducts.length} products added to the table. No database writes until Save.`

    addMessage({ id: crypto.randomUUID(), role: "assistant", content: successMessage })
    setPendingProducts(null)
  }

  const onInputKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void handleGenerateIntent()
    }
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
            <div
              key={message.id}
              className={message.role === "user" ? "ml-6 rounded-md bg-primary/10 px-3 py-2" : "mr-6 rounded-md border bg-muted/40 px-3 py-2"}
            >
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                {message.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                {message.role === "assistant" ? (language === "tr" ? "Asistan" : "Assistant") : language === "tr" ? "Sen" : "You"}
              </div>
              <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-5">{message.content}</pre>
            </div>
          ))}

          {pendingIntent && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
              <div className="text-xs font-semibold text-primary">{language === "tr" ? "Bekleyen Önizleme" : "Pending Preview"}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {language === "tr" ? "Kapsam" : "Scope"}: {getScopeLabel(pendingIntent.scope, language)}
                {" | "}
                {language === "tr" ? "Tahmini ürün" : "Estimated products"}: {estimateTargetCount(pendingIntent.scope, selectedCount, visibleCount, totalCount)}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => void handleApplyIntent()} disabled={isApplying || isGenerating}>
                  {isApplying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {language === "tr" ? "Uygula" : "Apply"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPendingIntent(null)} disabled={isApplying || isGenerating}>
                  {language === "tr" ? "İptal" : "Dismiss"}
                </Button>
              </div>
            </div>
          )}

          {pendingProducts && onAddGeneratedProducts && (
            <div className="rounded-md border border-green-500/30 bg-green-500/5 p-3">
              <div className="text-xs font-semibold text-green-700 dark:text-green-400">
                {language === "tr" ? "Oluşturulan Ürünler" : "Generated Products"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {pendingProducts.length} {language === "tr" ? "ürün tabloya eklenecek" : "products will be added to the table"}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={handleAddGeneratedProducts} disabled={isApplying || isGenerating}>
                  {language === "tr" ? "Tabloya Ekle" : "Add to Table"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPendingProducts(null)} disabled={isApplying || isGenerating}>
                  {language === "tr" ? "İptal" : "Dismiss"}
                </Button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        {showQuickPrompts && (
          <div className="mb-2 flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                onClick={() => {
                  setInput(prompt.text)
                  setSelectedPresetId(prompt.id)
                  setShowQuickPrompts(false)
                }}
                className="rounded-md border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
              >
                {prompt.text}
              </button>
            ))}
          </div>
        )}

        <Textarea
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
            setSelectedPresetId(null)
          }}
          onKeyDown={onInputKeyDown}
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
            {language === "tr" ? "Seçili" : "Selected"}: {selectedCount} | {language === "tr" ? "Sayfa" : "Page"}: {visibleCount} |{" "}
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

          <Button size="sm" onClick={() => void handleGenerateIntent()} disabled={!input.trim() || isGenerating || isApplying}>
            {isGenerating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {language === "tr" ? "Gönder" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  )
}
