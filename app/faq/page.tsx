"use client"

import { useId, useMemo, useState } from "react"
import { ChevronDown, Search } from "lucide-react"

import { PublicFooter } from "@/components/layout/public-footer"
import { PublicHeader } from "@/components/layout/public-header"
import { CtaBanner, MarketingPage, PageHero, SecondaryButton, Section } from "@/components/marketing"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"

const CATEGORIES = ["general", "products", "sharing", "account"] as const
type Category = (typeof CATEGORIES)[number]

interface FaqItem {
    q: string
    a: string
}

function normalize(text: string) {
    return text.toLocaleLowerCase("tr")
}

export default function FAQPage() {
    const { t } = useTranslation()
    const [activeCategory, setActiveCategory] = useState<Category>("general")
    const [openQuestion, setOpenQuestion] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const idPrefix = useId()

    const query = normalize(searchTerm.trim())
    // Arama yapılırken tüm kategorilerde aranır; aksi halde seçili kategori gösterilir
    const visibleItems = useMemo(() => {
        const categories = query ? CATEGORIES : [activeCategory]
        return categories.flatMap((category) =>
            (t<FaqItem[]>(`faqPage.items.${category}`) || [])
                .map((item, index) => ({ ...item, id: `${category}-${index}` }))
                .filter((item) => !query || normalize(item.q).includes(query) || normalize(item.a).includes(query)),
        )
    }, [activeCategory, query, t])

    return (
        <MarketingPage header={<PublicHeader />} footer={<PublicFooter />}>
            <PageHero eyebrow={t("faqPage.badge")} title={t("faqPage.title")} description={t("faqPage.subtitle")}>
                <div className="relative mt-8 w-full max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder={t("faqPage.searchPlaceholder")}
                        aria-label={t("faqPage.searchPlaceholder")}
                        className="h-11 pl-9"
                    />
                </div>
            </PageHero>

            <Section className="pt-0 sm:pt-0">
                <div className="mx-auto max-w-3xl">
                    {!query ? (
                        <div className="mb-6 flex flex-wrap justify-center gap-2" role="tablist">
                            {CATEGORIES.map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeCategory === category}
                                    onClick={() => setActiveCategory(category)}
                                    className={cn(
                                        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                                        activeCategory === category
                                            ? "border-foreground bg-foreground text-background"
                                            : "border-border bg-background text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {t(`faqPage.categories.${category}`)}
                                </button>
                            ))}
                        </div>
                    ) : null}

                    {visibleItems.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                            {t("faqPage.noResults")}
                        </p>
                    ) : (
                        <div className="divide-y divide-border rounded-xl border border-border bg-card">
                            {visibleItems.map((item) => {
                                const isOpen = openQuestion === item.id || Boolean(query)
                                const panelId = `${idPrefix}-${item.id}`
                                return (
                                    <div key={item.id}>
                                        <button
                                            type="button"
                                            onClick={() => setOpenQuestion(openQuestion === item.id ? null : item.id)}
                                            aria-expanded={isOpen}
                                            aria-controls={panelId}
                                            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium text-card-foreground"
                                        >
                                            {item.q}
                                            <ChevronDown
                                                className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                                                aria-hidden
                                            />
                                        </button>
                                        <div id={panelId} hidden={!isOpen} className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                                            {item.a}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </Section>

            <CtaBanner
                title={t("faqPage.contactTitle")}
                description={t("faqPage.contactDesc")}
                action={<SecondaryButton href="/contact">{t("faqPage.contactButton")}</SecondaryButton>}
            />
        </MarketingPage>
    )
}
