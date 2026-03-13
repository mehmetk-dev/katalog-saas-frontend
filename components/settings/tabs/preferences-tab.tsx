"use client"

import { CheckCircle2, Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Language } from "@/lib/translations"
import { cn } from "@/lib/utils"

type TFunction = (key: string, params?: Record<string, unknown>) => string

interface PreferencesTabProps {
  language: Language
  setLanguage: (language: Language) => void
  t: TFunction
}

export function PreferencesTab({ language, setLanguage, t }: PreferencesTabProps) {
  return (
    <Card className="border-0 shadow-md ring-1 ring-border bg-card">
      <CardHeader className="pb-4 border-b bg-muted/30 dark:bg-muted/10">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 bg-orange-100 dark:bg-orange-500/10", "text-orange-600 dark:text-orange-400 rounded-lg")}>
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-xl text-foreground">{t("settings.language")}</CardTitle>
            <CardDescription className="text-muted-foreground">{t("settings.selectLanguage")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant={language === "tr" ? "default" : "outline"}
            onClick={() => setLanguage("tr")}
            className={cn(
              "flex-1 h-auto py-4 justify-start px-4 gap-3",
              "relative overflow-hidden transition-all duration-300",
              language === "tr" ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-background" : "hover:bg-muted/50 dark:hover:bg-muted/20",
            )}
          >
            <span className="text-2xl">????</span>
            <div className="flex flex-col items-start">
              <span className={cn("font-semibold", language === "tr" ? "text-primary-foreground" : "text-foreground")}>Türkçe</span>
              <span className={cn("text-xs opacity-70", language === "tr" ? "text-primary-foreground" : "text-muted-foreground")}>{t("settings.defaultLanguage")}</span>
            </div>
            {language === "tr" && <CheckCircle2 className="w-5 h-5 ml-auto text-primary-foreground" />}
          </Button>

          <Button
            variant={language === "en" ? "default" : "outline"}
            onClick={() => setLanguage("en")}
            className={cn(
              "flex-1 h-auto py-4 justify-start px-4 gap-3",
              "relative overflow-hidden transition-all duration-300",
              language === "en" ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-background" : "hover:bg-muted/50 dark:hover:bg-muted/20",
            )}
          >
            <span className="text-2xl">????</span>
            <div className="flex flex-col items-start">
              <span className={cn("font-semibold", language === "en" ? "text-primary-foreground" : "text-foreground")}>English</span>
              <span className={cn("text-xs opacity-70", language === "en" ? "text-primary-foreground" : "text-muted-foreground")}>{t("settings.international")}</span>
            </div>
            {language === "en" && <CheckCircle2 className="w-5 h-5 ml-auto text-primary-foreground" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
