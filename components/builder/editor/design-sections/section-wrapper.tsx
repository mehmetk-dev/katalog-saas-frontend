import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SectionWrapperProps } from "./types"

export function SectionWrapper({ title, icon, iconBg, isOpen, onToggle, children }: SectionWrapperProps) {
    return (
        <div className="space-y-4">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
                <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", iconBg)}>
                        {icon}
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">{title}</h3>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", isOpen && "rotate-180")} />
            </button>

            <div
                className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
                <div className="overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    )
}
