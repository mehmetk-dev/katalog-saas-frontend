import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

import { PublicHeader } from '@/components/layout/public-header'
import { PublicFooter } from '@/components/layout/public-footer'
import { CtaBanner, MARKETING_CONTAINER, MarketingPage, SignupButton } from '@/components/marketing'
import { getPostBySlug, getAllPosts } from '@/lib/services/blog'
import { generateSEO } from '@/lib/services/seo'
import { SITE_URL } from '@/lib/constants'
import { translations, type Language } from '@/lib/translations'
import { cn } from '@/lib/utils'

/** Yazının kendi dili (server component; kullanıcının arayüz dili burada bilinmiyor) */
function blogText(language: string) {
    const lang: Language = language === 'en' ? 'en' : 'tr'
    return { lang, text: translations[lang].blogPage, locale: lang === 'en' ? 'en-US' : 'tr-TR' }
}

function categoryLabel(categories: Record<string, string>, id: string) {
    return categories[id] ?? id
}

interface PostPageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PostPageProps) {
    const { slug } = await params
    const post = getPostBySlug(slug)

    if (!post) return { title: 'Yazı Bulunamadı' }

    return generateSEO({
        title: post.title,
        description: post.excerpt,
        image: post.coverImage,
        url: `/blog/${slug}`,
        keywords: post.tags
    })
}

export async function generateStaticParams() {
    const posts = getAllPosts()
    return posts.map((post) => ({
        slug: post.slug,
    }))
}

export default async function BlogPostPage({ params }: PostPageProps) {
    const { slug } = await params
    const post = getPostBySlug(slug)

    if (!post) notFound()

    const { text, locale } = blogText(post.language)
    const relatedPosts = getAllPosts()
        .filter(p => p.slug !== post.slug && p.language === post.language)
        .slice(0, 2)

    // JSON-LD Structured Data
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        image: post.coverImage,
        datePublished: post.date,
        dateModified: post.lastModified || post.date,
        author: { '@type': 'Person', name: post.author, url: SITE_URL },
        publisher: {
            '@type': 'Organization',
            name: 'FogCatalog',
            logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.png` },
        },
    }

    return (
        <MarketingPage header={<PublicHeader />} footer={<PublicFooter />}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <article className={cn(MARKETING_CONTAINER, "max-w-3xl pb-16 pt-28 sm:pt-36")}>
                <Link href="/blog" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-4" aria-hidden />
                    {text.badge}
                </Link>

                <header className="space-y-5">
                    <p className="text-sm font-medium text-muted-foreground">
                        {categoryLabel(text.categories, post.category)} ·{' '}
                        <time dateTime={post.date}>
                            {new Date(post.date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
                        </time>
                        {post.readingTime ? ` · ${post.readingTime}` : ''}
                    </p>
                    <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{post.title}</h1>
                    <p className="text-pretty text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
                </header>

                <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-xl border border-border bg-muted">
                    <Image src={post.coverImage} alt="" fill sizes="(min-width: 768px) 768px, 100vw" className="object-cover" priority />
                </div>

                <div className="prose prose-zinc mt-12 max-w-none dark:prose-invert
                    prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground
                    prose-p:leading-relaxed prose-p:text-muted-foreground
                    prose-strong:text-foreground
                    prose-a:text-foreground prose-a:underline-offset-4
                    prose-img:rounded-xl
                    prose-blockquote:border-l-brand prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-foreground
                    prose-li:text-muted-foreground prose-li:marker:text-muted-foreground">
                    <MDXRemote
                        source={post.content}
                        options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] } }}
                    />
                </div>

                {post.tags.length > 0 ? (
                    <ul className="mt-12 flex flex-wrap gap-2 border-t border-border pt-8">
                        {post.tags.map(tag => (
                            <li key={tag} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                                #{tag}
                            </li>
                        ))}
                    </ul>
                ) : null}

                {relatedPosts.length > 0 ? (
                    <section className="mt-16 border-t border-border pt-12">
                        <div className="grid gap-6 sm:grid-cols-2">
                            {relatedPosts.map((relatedPost) => (
                                <Link
                                    key={relatedPost.slug}
                                    href={`/blog/${relatedPost.slug}`}
                                    className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/30"
                                >
                                    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                                        <Image src={relatedPost.coverImage} alt="" fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
                                    </div>
                                    <div className="space-y-2 p-5">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {categoryLabel(text.categories, relatedPost.category)}
                                        </span>
                                        <h2 className="line-clamp-2 font-semibold text-card-foreground group-hover:underline">{relatedPost.title}</h2>
                                        <p className="line-clamp-2 text-sm text-muted-foreground">{relatedPost.excerpt}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ) : null}
            </article>

            <CtaBanner
                title={text.ctaTitle}
                description={text.ctaDesc}
                action={<SignupButton>{text.ctaButton}</SignupButton>}
            />
        </MarketingPage>
    )
}
