import { Activity } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { TranslationFn } from "@/components/admin/admin-dashboard/types"

interface AdminHeaderProps {
    onReload: () => void
    t: TranslationFn
}

export function AdminHeader({ onReload, t }: AdminHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("admin.title")}</h1>
                <p className="text-muted-foreground">{t("admin.subtitle")}</p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onReload}>
                    <Activity className="w-4 h-4 mr-2" />
                    {t("common.reload")}
                </Button>
            </div>
        </div>
    )
}
