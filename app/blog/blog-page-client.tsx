"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock } from "lucide-react"

import { PublicFooter } from "@/components/layout/public-footer"
import { PublicHeader } from "@/components/layout/public-header"
import { CtaBanner, MarketingPage, PageHero, Section, SignupButton } from "@/components/marketing"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"

const CATEGORY_IDS = ["guides", "product-updates", "ecommerce-tips", "success-stories"] as const

export interface BlogPost {
    slug: string
    title: string
    excerpt: string
    date: string
    author: string
    category: string
    readingTime: string
    coverImage: string
    language: string
}

interface BlogPageClientProps {
    posts: BlogPost[]
}

export default function BlogPageClient({ posts }: BlogPageClientProps) {
    const { t, language } = useTranslation()
    const [activeCategory, setActiveCategory] = useState("all")

    const languagePosts = useMemo(() => posts.filter((post) => post.language === language), [posts, language])
    // Yalnızca yazısı olan kategoriler gösterilir (boş kategori sekmesi kafa karıştırıyordu)
    const categories = useMemo(
        () => ["all", ...CATEGORY_IDS.filter((id) => languagePosts.some((post) => post.category === id))],
        [languagePosts],
    )
    const filteredPosts = languagePosts.filter((post) => activeCategory === "all" || post.category === activeCategory)
    const categoryLabel = (id: string) => {
        const label = t(`blogPage.categories.${id}`)
        return label === `blogPage.categories.${id}` ? id : label
    }

    return (
        <MarketingPage header={<PublicHeader />} footer={<PublicFooter />}>
            <PageHero eyebrow={t("blogPage.badge")} title={t("blogPage.title")} description={t("blogPage.subtitle")} />

            <Section className="pt-0 sm:pt-0">
                {categories.length > 2 ? (
                    <div className="mb-8 flex flex-wrap justify-center gap-2" role="tablist">
                        {categories.map((id) => (
                            <button
                                key={id}
                                type="button"
                                role="tab"
                                aria-selected={activeCategory === id}
                                onClick={() => setActiveCategory(id)}
                                className={cn(
                                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                                    activeCategory === id
                                        ? "border-foreground bg-foreground text-background"
                                        : "border-border bg-background text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {categoryLabel(id)}
                            </button>
                        ))}
                    </div>
                ) : null}

                {filteredPosts.length === 0 ? (
                    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-dashed border-border p-10 text-center">
                        <p className="text-sm text-muted-foreground">{t("blogPage.empty")}</p>
                        {activeCategory !== "all" ? (
                            <button type="button" onClick={() => setActiveCategory("all")} className="text-sm font-medium text-foreground underline">
                                {t("blogPage.showAll")}
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredPosts.map((post) => (
                            <Link
                                key={post.slug}
                                href={`/blog/${post.slug}`}
                                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/30"
                            >
                                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                                    <Image
                                        src={post.coverImage}
                                        alt=""
                                        fill
                                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                    />
                                </div>
                                <div className="flex flex-1 flex-col gap-3 p-5">
                                    <span className="text-xs font-medium text-muted-foreground">{categoryLabel(post.category)}</span>
                                    <h2 className="text-lg font-semibold leading-snug tracking-tight text-card-foreground group-hover:underline">
                                        {post.title}
                                    </h2>
                                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                                    <div className="mt-auto flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="size-3.5" aria-hidden />
                                            {new Date(post.date).toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </span>
                                        {post.readingTime ? (
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="size-3.5" aria-hidden />
                                                {post.readingTime}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </Section>

            <CtaBanner
                title={t("blogPage.ctaTitle")}
                description={t("blogPage.ctaDesc")}
                action={<SignupButton>{t("blogPage.ctaButton")}</SignupButton>}
            />
        </MarketingPage>
    )
}
