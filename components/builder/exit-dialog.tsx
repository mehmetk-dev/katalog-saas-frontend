"use client"

import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ExitDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onExitWithoutSaving: () => void
    onSaveAndExit: () => void
}

export function ExitDialog({
    open,
    onOpenChange,
    onExitWithoutSaving,
    onSaveAndExit
}: ExitDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Kaydedilmemiş Değişiklikler</AlertDialogTitle>
                    <AlertDialogDescription>
                        Katalogda kaydedilmemiş değişiklikler var. Çıkmadan önce kaydetmek ister misiniz?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel onClick={() => onOpenChange(false)}>
                        İptal
                    </AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={onExitWithoutSaving}
                    >
                        Kaydetmeden Çık
                    </Button>
                    <Button
                        onClick={onSaveAndExit}
                    >
                        Kaydet ve Çık
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
