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
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <p className="text-amber-800 dark:text-amber-200 font-medium text-sm mb-2">
                                        ⚠️ Bu ürün {deleteCatalogs.length} katalogda kullanılıyor:
                                    </p>
                                    <ul className="text-amber-700 dark:text-amber-300 text-sm space-y-1">
                                        {deleteCatalogs.map(c => (
                                            <li key={c.id} className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                {c.name}
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-amber-600 dark:text-amber-400 text-xs mt-2">
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
