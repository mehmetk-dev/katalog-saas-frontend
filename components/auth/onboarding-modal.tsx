"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sofa, Shirt, Package, Utensils, Laptop, MoreHorizontal, Loader2 } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface OnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const industries = [
  { id: "furniture", label: "Furniture", icon: Sofa },
  { id: "fashion", label: "Fashion", icon: Shirt },
  { id: "wholesale", label: "Wholesale", icon: Package },
  { id: "food", label: "Food & Beverage", icon: Utensils },
  { id: "electronics", label: "Electronics", icon: Laptop },
  { id: "other", label: "Other", icon: MoreHorizontal },
]

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleContinue = async () => {
    if (!selected) return
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    onOpenChange(false)
    router.push("/dashboard")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">What is your industry?</DialogTitle>
          <DialogDescription>Help us recommend the best templates for your product catalogs.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-4">
          {industries.map((industry) => {
            const Icon = industry.icon
            return (
              <button
                key={industry.id}
                onClick={() => setSelected(industry.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  "hover:border-primary/50 hover:bg-accent",
                  selected === industry.id ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <Icon className={cn("w-6 h-6", selected === industry.id ? "text-primary" : "text-muted-foreground")} />
                <span
                  className={cn("text-sm font-medium", selected === industry.id ? "text-primary" : "text-foreground")}
                >
                  {industry.label}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false)
              router.push("/dashboard")
            }}
          >
            Skip for now
          </Button>
          <Button onClick={handleContinue} disabled={!selected || isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
