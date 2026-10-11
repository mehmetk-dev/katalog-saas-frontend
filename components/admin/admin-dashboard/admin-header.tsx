import { Activity } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import type { TranslationFn } from "@/components/admin/admin-dashboard/types"

interface AdminHeaderProps {
    onReload: () => void
    t: TranslationFn
}

export function AdminHeader({ onReload, t }: AdminHeaderProps) {
    return (
        <PageHeader
            title={t("admin.title")}
            description={t("admin.subtitle")}
            actions={
                <Button variant="outline" onClick={onReload}>
                    <Activity className="w-4 h-4 mr-2" />
                    {t("common.reload")}
                </Button>
            }
        />
    )
}
