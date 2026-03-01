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
import { useTranslation } from "@/lib/contexts/i18n-provider"

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
    const { t } = useTranslation()
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('builder.unsavedChanges') as string}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('builder.unsavedDesc') as string}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel onClick={() => onOpenChange(false)}>
                        {t('builder.cancelBtn') as string}
                    </AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={onExitWithoutSaving}
                    >
                        {t('builder.exitWithoutSave') as string}
                    </Button>
                    <Button
                        onClick={onSaveAndExit}
                    >
                        {t('builder.saveAndExit') as string}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
