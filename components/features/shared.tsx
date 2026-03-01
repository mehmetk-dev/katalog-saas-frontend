"use client"

import { cn } from "@/lib/utils"

export function CheckItem({ children, color = "green" }: {
    children: React.ReactNode
    color?: "green" | "emerald"
}) {
    const colorMap = {
        green: "bg-green-100 text-green-600",
        emerald: "bg-emerald-100 text-emerald-600",
    }
    return (
        <li className="flex items-center gap-3 font-semibold text-slate-700">
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
            "absolute bg-white shadow-lg p-3 rounded-xl flex gap-3 animate-bounce",
            positionCls,
            className
        )}>
            <div
                className="w-10 h-10 bg-slate-100 rounded-lg bg-cover"
                style={{ backgroundImage: `url('${imageUrl}')` }}
            />
            <div>
                <div className="h-2 w-16 bg-slate-200 rounded mb-1" />
                <div className="h-2 w-10 bg-green-200 rounded" />
            </div>
            <div className={cn(
                "absolute -top-2 -right-2 bg-green-500 text-white",
                "text-[10px] w-5 h-5 flex items-center justify-center rounded-full"
            )}>
                ✓
            </div>
        </div>
    )
}
