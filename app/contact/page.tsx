"use client"

import { useState, type FormEvent } from "react"
import { AlertCircle, CheckCircle2, Clock, Loader2, Mail, MapPin, Phone, Send, type LucideIcon } from "lucide-react"

import { PublicFooter } from "@/components/layout/public-footer"
import { PublicHeader } from "@/components/layout/public-header"
import { FeatureIcon, MarketingPage, PageHero, Section } from "@/components/marketing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { sendContactMessage } from "@/lib/actions/contact"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { FOGCATALOG_COMPANY } from "@/lib/legal/fogcatalog-company"
import { cn } from "@/lib/utils"

/** id'ler sunucu tarafındaki SUBJECT_LABELS ile aynı */
const SUBJECTS = [
  { id: "genel", key: "general" },
  { id: "destek", key: "support" },
  { id: "fiyat", key: "pricing" },
  { id: "isbirligi", key: "collaboration" },
] as const

function InfoItem({ icon, label, value, href }: { icon: LucideIcon; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start gap-4">
      <FeatureIcon icon={icon} />
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        {href ? (
          <a href={href} className="break-words font-medium text-foreground hover:underline">
            {value}
          </a>
        ) : (
          <p className="font-medium text-foreground">{value}</p>
        )}
      </div>
    </div>
  )
}

export default function ContactPage() {
  const { t } = useTranslation()
  const [selectedSubject, setSelectedSubject] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Public sayfalarda Toaster yok; hata formun içinde gösterilir
  const showError = (message: string) => setFormError(message)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    const form = event.currentTarget
    const formData = new FormData(form)
    const name = String(formData.get("name") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()
    const message = String(formData.get("message") ?? "").trim()

    if (!name || !email || !selectedSubject || !message) return showError(t("contact.errorRequired"))
    if (message.length < 10) return showError(t("contact.errorMessageMin"))

    setIsSubmitting(true)
    try {
      const result = await sendContactMessage({ name, email, subject: selectedSubject, message })
      if (result.success) {
        setIsSuccess(true)
        form.reset()
        setSelectedSubject("")
      } else {
        showError(result.error || t("contact.errorUnexpected"))
      }
    } catch (error) {
      console.error("Contact form submit failed:", error)
      showError(t("contact.errorUnexpected"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MarketingPage header={<PublicHeader />} footer={<PublicFooter />}>
      <PageHero eyebrow={t("contact.title")} title={t("contact.formTitle")} description={t("contact.subtitle")} />

      <Section className="pt-0 sm:pt-0">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-6 rounded-xl border border-border bg-muted/40 p-6">
            <InfoItem icon={Mail} label={t("contact.email")} value={FOGCATALOG_COMPANY.email} href={`mailto:${FOGCATALOG_COMPANY.email}`} />
            <InfoItem
              icon={Phone}
              label={t("contact.phone")}
              value={FOGCATALOG_COMPANY.phone}
              href={`tel:${FOGCATALOG_COMPANY.phone.replace(/\s/g, "")}`}
            />
            <InfoItem icon={MapPin} label={t("contact.location")} value={FOGCATALOG_COMPANY.cityDistrict} />
            <InfoItem icon={Clock} label={t("contact.hours")} value={`${t("contact.days")}, ${t("contact.time")}`} />
          </div>

          <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
            {isSuccess ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center" role="status">
                <span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
                  <CheckCircle2 className="size-6" aria-hidden />
                </span>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-card-foreground">{t("contact.successTitle")}</h2>
                  <p className="text-sm text-muted-foreground">{t("contact.successDesc")}</p>
                </div>
                <Button type="button" variant="outline" onClick={() => setIsSuccess(false)}>
                  {t("contact.newMessage")}
                </Button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-card-foreground">{t("contact.formTitle")}</h2>
                  <p className="text-sm text-muted-foreground">{t("contact.formDesc")}</p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">{t("contact.name")}</Label>
                    <Input id="contact-name" name="name" autoComplete="name" required maxLength={100} disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">{t("contact.email")}</Label>
                    <Input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={255} disabled={isSubmitting} />
                  </div>
                </div>

                <fieldset className="space-y-2">
                  <legend className="mb-2 text-sm font-medium">{t("contact.subject")}</legend>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map((subject) => (
                      <button
                        key={subject.id}
                        type="button"
                        aria-pressed={selectedSubject === subject.id}
                        disabled={isSubmitting}
                        onClick={() => {
                          setSelectedSubject(subject.id)
                          setFormError(null)
                        }}
                        className={cn(
                          "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                          selectedSubject === subject.id
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-background text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {t(`contact.subjects.${subject.key}`)}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="space-y-2">
                  <Label htmlFor="contact-message">{t("contact.message")}</Label>
                  <Textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    required
                    maxLength={3000}
                    placeholder={t("contact.messagePlaceholder")}
                    disabled={isSubmitting}
                  />
                </div>

                {formError ? (
                  <p className="flex items-start gap-2 rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive-soft-foreground" role="alert">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {formError}
                  </p>
                ) : null}

                <Button type="submit" variant="brand" size="lg" className="h-11 w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
                  {isSubmitting ? t("contact.sending") : t("contact.send")}
                </Button>
              </form>
            )}
          </div>
        </div>
      </Section>
    </MarketingPage>
  )
}
