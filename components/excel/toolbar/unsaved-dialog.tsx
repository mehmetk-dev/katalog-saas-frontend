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
import { useTranslation } from "@/lib/contexts/i18n-provider"

interface UnsavedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dirtyCount: number
  onConfirmLeave: () => void
}

export function UnsavedDialog({ open, onOpenChange, dirtyCount, onConfirmLeave }: UnsavedDialogProps) {
  const { t } = useTranslation()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("excel.unsavedTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("excel.unsavedDesc", { count: dirtyCount })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmLeave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {t("excel.leaveWithout")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
