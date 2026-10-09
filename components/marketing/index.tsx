import Link from "next/link"
import { ArrowRight, Check, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/*
 * Public site (landing, özellikler, fiyatlandırma, SSS, iletişim, blog…) için tek tip yapı taşları.
 * Kurallar:
 *  - Başlıklar sans, font-semibold, tracking-tight; degrade/serif/italik vurgu yok.
 *  - Dönüşüm butonu (kayıt ol / katalog oluştur) `brand`, ikincil aksiyon `outline`.
 *  - Kartlar dashboard'daki gibi: rounded-xl, border, bg-card; büyük gölge yok.
 *  - İkon kutusu her yerde aynı (FeatureIcon); renkli ikon yalnızca durum bildirir.
 */

export const MARKETING_CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6"

interface SectionProps {
  id?: string
  /** muted: alternatif zemin, bölümleri ayırmak için */
  tone?: "default" | "muted"
  className?: string
  children: ReactNode
}

export function Section({ id, tone = "default", className, children }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "py-16 sm:py-24",
        tone === "muted" && "border-y border-border bg-muted/40",
        className,
      )}
    >
      <div className={MARKETING_CONTAINER}>{children}</div>
    </section>
  )
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-brand" aria-hidden />
      {children}
    </span>
  )
}

interface SectionHeaderProps {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  align?: "center" | "left"
  className?: string
}

export function SectionHeader({ eyebrow, title, description, align = "center", className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-10 flex max-w-2xl flex-col gap-4 sm:mb-14",
        align === "center" ? "mx-auto items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h2>
      {description ? <p className="text-pretty text-base text-muted-foreground sm:text-lg">{description}</p> : null}
    </div>
  )
}

interface PageHeroProps {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

/** Her public sayfanın üst bölümü: aynı boşluk, aynı başlık ölçüsü */
export function PageHero({ eyebrow, title, description, actions, children, className }: PageHeroProps) {
  return (
    <section className={cn("pb-12 pt-28 sm:pb-16 sm:pt-36", className)}>
      <div className={cn(MARKETING_CONTAINER, "flex flex-col items-center text-center")}>
        {eyebrow ? <Eyebrow className="mb-6">{eyebrow}</Eyebrow> : null}
        <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">{description}</p>
        ) : null}
        {actions ? <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">{actions}</div> : null}
        {children}
      </div>
    </section>
  )
}

export function FeatureIcon({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-foreground",
        className,
      )}
    >
      <Icon className="size-5" aria-hidden />
    </span>
  )
}

interface FeatureCardProps {
  icon: LucideIcon
  title: ReactNode
  description: ReactNode
  children?: ReactNode
  className?: string
}

export function FeatureCard({ icon, title, description, children, className }: FeatureCardProps) {
  return (
    <div className={cn("flex flex-col gap-4 rounded-xl border border-border bg-card p-6", className)}>
      <FeatureIcon icon={icon} />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight text-card-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

interface StepCardProps {
  step: number
  label: ReactNode
  title: ReactNode
  description: ReactNode
}

export function StepCard({ step, label, title, description }: StepCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {step}
      </span>
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <h3 className="text-lg font-semibold tracking-tight text-card-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function SignupButton({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Button asChild variant="brand" size="lg" className={cn("h-11 px-6", className)}>
      <Link href="/auth?tab=signup">
        {children}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </Button>
  )
}

export function SecondaryButton({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Button asChild variant="outline" size="lg" className={cn("h-11 px-6", className)}>
      <Link href={href}>{children}</Link>
    </Button>
  )
}

interface CtaBannerProps {
  title: ReactNode
  description?: ReactNode
  action: ReactNode
  note?: ReactNode
}

/** Tüm public sayfaların sonunda aynı kapanış bölümü */
export function CtaBanner({ title, description, action, note }: CtaBannerProps) {
  return (
    <section className="py-16 sm:py-24">
      <div className={MARKETING_CONTAINER}>
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-muted/40 px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h2>
          {description ? <p className="max-w-xl text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
          {action}
          {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
        </div>
      </div>
    </section>
  )
}

/** Public sayfa iskeleti: header + içerik + footer, tek zemin rengi */
export function MarketingPage({ header, footer, children }: { header: ReactNode; footer: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {header}
      <main>{children}</main>
      {footer}
    </div>
  )
}

interface FeatureRowProps {
  icon: LucideIcon
  title: ReactNode
  description: ReactNode
  bullets: ReactNode[]
}

/** Özellik detay satırı: solda başlık/açıklama, sağda madde listesi */
export function FeatureRow({ icon, title, description, bullets }: FeatureRowProps) {
  return (
    <div className="grid gap-8 border-t border-border py-12 first:border-t-0 first:pt-0 last:pb-0 md:grid-cols-2 md:gap-16">
      <div className="space-y-4">
        <FeatureIcon icon={icon} />
        <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h2>
        <p className="text-pretty leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <ul className="flex flex-col justify-center gap-3 rounded-xl border border-border bg-card p-6">
        {bullets.map((bullet, index) => (
          <li key={index} className="flex items-start gap-3 text-sm text-card-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface LegalDocumentProps {
  title: ReactNode
  /** Yürürlük / son güncelleme tarihi satırı */
  meta?: ReactNode
  header: ReactNode
  footer: ReactNode
  children: ReactNode
}

/** KVKK, gizlilik, şartlar gibi yasal metinlerin ortak sayfa düzeni */
export function LegalDocument({ title, meta, header, footer, children }: LegalDocumentProps) {
  return (
    <MarketingPage header={header} footer={footer}>
      <article className={cn(MARKETING_CONTAINER, "max-w-3xl pb-16 pt-28 sm:pb-24 sm:pt-36")}>
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
          {meta ? <p className="mt-3 text-sm text-muted-foreground">{meta}</p> : null}
        </header>
        <div className="space-y-10 text-[15px] leading-relaxed text-foreground">{children}</div>
      </article>
    </MarketingPage>
  )
}
