"use client"

import type { QuickPrompt } from "./types"

interface QuickPromptsProps {
    prompts: QuickPrompt[]
    onSelect: (prompt: QuickPrompt) => void
}

export function QuickPrompts({ prompts, onSelect }: QuickPromptsProps) {
    return (
        <div className="mb-2 flex flex-wrap gap-2">
            {prompts.map((prompt) => (
                <button
                    key={prompt.id}
                    type="button"
                    onClick={() => onSelect(prompt)}
                    className="rounded-md border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                >
                    {prompt.text}
                </button>
            ))}
        </div>
    )
}
