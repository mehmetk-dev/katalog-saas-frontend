"use client"

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
    t: (key: string) => string
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
                                    <p className="text-warning-soft-foreground font-medium text-sm mb-2">
                                        ⚠️ Bu ürün {deleteCatalogs.length} katalogda kullanılıyor:
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
                                        Silme işlemi sonrası ürün bu kataloglardan otomatik kaldırılacaktır.
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
                        {deleteCatalogs.length > 0 ? "Yine de Sil" : t("common.delete")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
