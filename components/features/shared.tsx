"use client"

import { cn } from "@/lib/utils"

export function CheckItem({ children, color = "green" }: {
    children: React.ReactNode
    color?: "green" | "emerald"
}) {
    const colorMap = {
        green: "bg-success-soft text-success",
        emerald: "bg-success-soft text-success",
    }
    return (
        <li className="flex items-center gap-3 font-semibold text-foreground">
            <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                colorMap[color]
            )}>
                ✓
            </div>
            {children}
        </li>
    )
}

export function FloatingProductBadge({
    imageUrl, position, className
}: {
    imageUrl: string
    position: "right" | "left"
    className?: string
}) {
    const positionCls = position === "right"
        ? "-right-8 -top-6"
        : "-left-8 bottom-10"

    return (
        <div className={cn(
            "absolute bg-card shadow-lg p-3 rounded-xl flex gap-3 animate-bounce",
            positionCls,
            className
        )}>
            <div
                className="w-10 h-10 bg-muted rounded-lg bg-cover"
                style={{ backgroundImage: `url('${imageUrl}')` }}
            />
            <div>
                <div className="h-2 w-16 bg-accent rounded mb-1" />
                <div className="h-2 w-10 bg-success-soft rounded" />
            </div>
            <div className={cn(
                "absolute -top-2 -right-2 bg-success text-success-foreground",
                "text-[10px] w-5 h-5 flex items-center justify-center rounded-full"
            )}>
                ✓
            </div>
        </div>
    )
}
