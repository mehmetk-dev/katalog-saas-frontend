"use client"

import { Bot, Send } from "lucide-react"

import type { Language } from "@/lib/translations"
import type { ChatMessage } from "./types"

interface ChatMessageProps {
    message: ChatMessage
    language: Language
    disabled: boolean
    onSuggestionClick: (suggestion: string) => void
}

export function ChatMessageItem({ message, language, disabled, onSuggestionClick }: ChatMessageProps) {
    const isAssistant = message.role === "assistant"
    return (
        <div className={isAssistant ? "mr-6 rounded-md border bg-muted/40 px-3 py-2" : "ml-6 rounded-md bg-primary/10 px-3 py-2"}>
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                {isAssistant ? <Bot className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                {isAssistant
                    ? language === "tr" ? "Asistan" : "Assistant"
                    : language === "tr" ? "Sen" : "You"}
            </div>
            <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-5">{message.content}</pre>

            {message.clarificationQuestion && (
                <p className="mt-2 text-xs font-medium text-foreground/90">{message.clarificationQuestion}</p>
            )}

            {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {message.suggestions.map((suggestion, idx) => (
                        <button
                            key={`${message.id}-sg-${idx}`}
                            type="button"
                            disabled={disabled}
                            onClick={() => onSuggestionClick(suggestion)}
                            className="rounded-md border bg-background px-2 py-1 text-[11px] hover:bg-muted disabled:opacity-50"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
