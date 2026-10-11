"use client"

import { AlertTriangle } from "lucide-react"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteAlertDialogProps {
    deleteId: string | null
    deleteCatalogs: { id: string; name: string }[]
    isPending: boolean
    onClose: () => void
    onConfirm: (id: string) => void
    t: (key: string, params?: Record<string, unknown>) => string
}

export function DeleteAlertDialog({
    deleteId,
    deleteCatalogs,
    isPending,
    onClose,
    onConfirm,
    t,
}: DeleteAlertDialogProps) {
    return (
        <AlertDialog open={!!deleteId} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t("products.deleteProduct")}</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <p>{t("products.deleteConfirm")}</p>
                            {deleteCatalogs.length > 0 && (
                                <div className="p-3 bg-warning-soft border border-warning/30 rounded-lg">
                                    <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-warning-soft-foreground">
                                        <AlertTriangle className="size-4 shrink-0" aria-hidden />
                                        {t("products.deleteUsedInCatalogs", { count: deleteCatalogs.length })}
                                    </p>
                                    <ul className="text-warning-soft-foreground text-sm space-y-1">
                                        {deleteCatalogs.map(c => (
                                            <li key={c.id} className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                                                {c.name}
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-warning-soft-foreground text-xs mt-2">
                                        {t("products.deleteRemovedFromCatalogs")}
                                    </p>
                                </div>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => deleteId && onConfirm(deleteId)}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground"
                    >
                        {deleteCatalogs.length > 0 ? t("products.deleteAnyway") : t("common.delete")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
