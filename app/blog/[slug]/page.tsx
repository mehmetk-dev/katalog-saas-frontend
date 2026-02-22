import React from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Share2 } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { PublicHeader } from '@/components/layout/public-header'
import { PublicFooter } from '@/components/layout/public-footer'
import { getPostBySlug, getAllPosts } from '@/lib/blog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { generateSEO } from '@/lib/seo'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

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

    // JSON-LD Structured Data
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        image: post.coverImage,
        datePublished: post.date,
        dateModified: post.lastModified || post.date,  // SEO: Content freshness signal
        author: {
            '@type': 'Person',
            name: post.author,
            jobTitle: 'Ürün Yöneticisi & Büyüme Uzmanı',
            description: '8+ yıllık SaaS ürün geliştirme ve büyüme pazarlaması deneyimine sahip dijital katalog ve e-ticaret uzmanı.',
            url: 'https://fogcatalog.com',
        },
        publisher: {
            '@type': 'Organization',
            name: 'FogCatalog',
            logo: {
                '@type': 'ImageObject',
                url: 'https://fogcatalog.com/icon.png',
            },
        },
    }

    return (
        <div className="min-h-screen bg-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <PublicHeader />

            <main className="pt-32 pb-24">
                {/* Hero Header */}
                <article className="max-w-4xl mx-auto px-6">
                    <Link href="/blog" className="inline-flex items-center text-slate-400 hover:text-violet-600 font-bold text-sm mb-12 uppercase tracking-widest transition-colors group">
                        <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Blog'a Dön
                    </Link>

                    <div className="space-y-8 mb-16">
                        <div className="flex items-center gap-4">
                            <Badge className="bg-violet-100 text-violet-600 hover:bg-violet-100 border-none px-4 py-1 uppercase tracking-widest text-[10px] font-black">
                                {(() => {
                                    const trCategories: Record<string, string> = {
                                        'guides': 'Rehberler',
                                        'product-updates': 'Ürün Güncellemeleri',
                                        'ecommerce-tips': 'E-ticaret İpuçları',
                                        'success-stories': 'Başarı Hikayeleri'
                                    }
                                    return trCategories[post.category] || post.category
                                })()}
                            </Badge>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
                            {post.title}
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-500 leading-relaxed font-medium italic border-l-4 border-violet-200 pl-8 py-2">
                            {post.excerpt}
                        </p>


                        {/* Tarih Bilgisi */}
                        <div className="py-6 border-y border-slate-100">
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                Yayınlanma: {new Date(post.date).toLocaleDateString('tr-TR', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    {/* Featured Image */}
                    <div className="relative aspect-[16/9] rounded-[3rem] overflow-hidden shadow-2xl mb-20 bg-slate-100">
                        <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                    {/* Content */}
                    <div className="prose prose-slate prose-lg max-w-none 
                        prose-headings:text-slate-900 prose-headings:font-black prose-headings:tracking-tight
                        prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-xl
                        prose-strong:text-slate-900 prose-strong:font-bold
                        prose-a:text-violet-600 prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                        prose-img:rounded-3xl prose-img:shadow-2xl
                        prose-blockquote:border-l-4 prose-blockquote:border-violet-500 prose-blockquote:bg-violet-50 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic prose-blockquote:font-medium
                        prose-ul:list-disc prose-ul:marker:text-violet-500
                        mb-20">
                        <MDXRemote
                            source={post.content}
                            options={{
                                mdxOptions: {
                                    remarkPlugins: [remarkGfm],
                                    rehypePlugins: [rehypeSlug],
                                }
                            }}
                        />
                    </div>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                        <div className="pt-12 border-t border-slate-100">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Konuları Keşfet</h4>
                            <div className="flex flex-wrap gap-2">
                                {post.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Related Posts - Internal Linking for SEO */}
                    <div className="mt-20 pt-16 border-t-2 border-slate-100">
                        <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">İlgili Yazılar</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            {(() => {
                                const allPosts = getAllPosts()
                                const relatedPosts = allPosts
                                    .filter(p => p.slug !== post.slug && p.language === post.language)
                                    .slice(0, 2)

                                return relatedPosts.map((relatedPost) => (
                                    <Link
                                        key={relatedPost.slug}
                                        href={`/blog/${relatedPost.slug}`}
                                        className="group flex flex-col border border-slate-200 rounded-2xl overflow-hidden bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
                                    >
                                        <div className="aspect-[16/9] relative overflow-hidden bg-slate-100">
                                            <Image
                                                src={relatedPost.coverImage}
                                                alt={relatedPost.title}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        </div>
                                        <div className="p-6">
                                            <Badge className="mb-3 bg-violet-100 text-violet-600 hover:bg-violet-100">
                                                {(() => {
                                                    const trCategories: Record<string, string> = {
                                                        'guides': 'Rehberler',
                                                        'product-updates': 'Ürün Güncellemeleri',
                                                        'ecommerce-tips': 'E-ticaret İpuçları',
                                                        'success-stories': 'Başarı Hikayeleri'
                                                    }
                                                    return trCategories[relatedPost.category] || relatedPost.category
                                                })()}
                                            </Badge>
                                            <h4 className="text-lg font-bold text-slate-900 group-hover:text-violet-600 transition-colors mb-2 line-clamp-2">
                                                {relatedPost.title}
                                            </h4>
                                            <p className="text-sm text-slate-500 line-clamp-2">
                                                {relatedPost.excerpt}
                                            </p>
                                        </div>
                                    </Link>
                                ))
                            })()}
                        </div>
                    </div>
                </article>

                {/* Newsletter / CTA */}
                <section className="max-w-4xl mx-auto px-6 mt-32">
                    <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-[100px]" />
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-6">
                                Dijital Geleceğinizi <br /> Şimdi İnşa Edin
                            </h2>
                            <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto">
                                FogCatalog ile profesyonel kataloglar oluşturan 5.000+ işletmeye katılın.
                            </p>
                            <Link href="/auth?tab=signup">
                                <Button size="lg" className="h-16 px-12 bg-white text-slate-900 hover:bg-violet-600 hover:text-white rounded-full text-lg font-bold transition-all shadow-xl shadow-white/5">
                                    Ücretsiz Başlayın
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <PublicFooter />
        </div>
    )
}
